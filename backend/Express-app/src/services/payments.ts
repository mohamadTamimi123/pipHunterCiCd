import crypto from 'crypto';
import { Op } from 'sequelize';
import { config } from '../config';
import { Fund, FundInvestment, Order, Plan, User } from '../db';
import { badRequest } from '../core/http';
import { createChallengeForOrder } from './challenges';
import { notifyAdmins, sendMail } from './mailer';
import { getSettings, usdToIrr } from './settings';

export type GatewayChoice = 'zarinpal' | 'crypto' | 'manual';

export interface CheckoutResult {
    orderId: number;
    gateway: string;
    paymentUrl?: string;
    instructions?: { amountUsd: number; amountIrr: number; usdtWallet: string; cardNumber: string };
}

const zarinpalBase = () => (config.payments.zarinpalSandbox ? 'https://sandbox.zarinpal.com' : 'https://payment.zarinpal.com');

async function startZarinpal(order: Record<string, any>, email: string): Promise<string> {
    const res = await fetch(`${zarinpalBase()}/pg/v4/payment/request.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
            merchant_id: config.payments.zarinpalMerchantId,
            amount: order.amountIrr,
            currency: 'IRR',
            callback_url: `${config.urls.api}/api/v1/payments/zarinpal/callback?orderId=${order.id}`,
            description: `PipHunter order #${order.id}`,
            metadata: { email },
        }),
        signal: AbortSignal.timeout(15_000),
    });
    const body = (await res.json()) as { data?: { code?: number; authority?: string }; errors?: unknown };
    if (body.data?.code !== 100 || !body.data.authority) {
        console.error('[zarinpal] request failed', body.errors);
        throw badRequest('اتصال به درگاه زرین‌پال ناموفق بود');
    }
    order.gatewayRef = body.data.authority;
    await order.save();
    return `${zarinpalBase()}/pg/StartPay/${body.data.authority}`;
}

export async function verifyZarinpal(orderId: number, authority: string, status: string) {
    const order = await Order.findByPk(orderId);
    if (!order || order.gatewayRef !== authority) return { ok: false, order };
    if (status !== 'OK') {
        await Order.update({ status: 'failed' }, { where: { id: order.id, status: 'pending' } });
        return { ok: false, order };
    }
    const res = await fetch(`${zarinpalBase()}/pg/v4/payment/verify.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ merchant_id: config.payments.zarinpalMerchantId, amount: order.amountIrr, authority }),
        signal: AbortSignal.timeout(15_000),
    });
    const body = (await res.json()) as { data?: { code?: number; ref_id?: number } };
    if (body.data?.code === 100 || body.data?.code === 101) {
        await fulfillOrder(order.id, String(body.data.ref_id ?? ''));
        return { ok: true, order };
    }
    await Order.update({ status: 'failed' }, { where: { id: order.id, status: 'pending' } });
    return { ok: false, order };
}

async function startNowPayments(order: Record<string, any>): Promise<string> {
    const res = await fetch('https://api.nowpayments.io/v1/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': config.payments.nowpaymentsApiKey },
        body: JSON.stringify({
            price_amount: order.amountUsd,
            price_currency: 'usd',
            order_id: String(order.id),
            order_description: `PipHunter order #${order.id}`,
            ipn_callback_url: `${config.urls.api}/api/v1/payments/crypto/ipn`,
            success_url: `${config.urls.panel}/orders?result=success&order=${order.id}`,
            cancel_url: `${config.urls.panel}/orders?result=cancel&order=${order.id}`,
        }),
        signal: AbortSignal.timeout(15_000),
    });
    const body = (await res.json()) as { id?: string; invoice_url?: string; message?: string };
    if (!body.invoice_url) {
        console.error('[nowpayments] invoice failed', body.message);
        throw badRequest('اتصال به درگاه پرداخت کریپتو ناموفق بود');
    }
    order.gatewayRef = String(body.id);
    await order.save();
    return body.invoice_url;
}

function sortKeys(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(sortKeys);
    if (value && typeof value === 'object') {
        return Object.keys(value as object)
            .sort()
            .reduce((acc, k) => ({ ...acc, [k]: sortKeys((value as Record<string, unknown>)[k]) }), {});
    }
    return value;
}

export async function handleNowPaymentsIpn(body: Record<string, any>, signature: string | undefined) {
    if (!config.payments.nowpaymentsIpnSecret || !signature) return false;
    const expected = crypto.createHmac('sha512', config.payments.nowpaymentsIpnSecret).update(JSON.stringify(sortKeys(body))).digest('hex');
    if (expected.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return false;

    const orderId = Number(body.order_id);
    if (body.payment_status === 'finished' || body.payment_status === 'confirmed') {
        await fulfillOrder(orderId, String(body.payment_id ?? ''));
    } else if (['failed', 'expired', 'refunded'].includes(body.payment_status)) {
        await Order.update({ status: 'failed' }, { where: { id: orderId, status: 'pending' } });
    }
    return true;
}

/** Marks an order paid exactly once and delivers what was bought. Safe to call repeatedly. */
export async function fulfillOrder(orderId: number, trackId?: string) {
    const [updated] = await Order.update(
        { status: 'paid', paidAt: new Date(), gatewayTrackId: trackId || null },
        { where: { id: orderId, status: { [Op.in]: ['pending', 'review'] } } },
    );
    const order = await Order.findByPk(orderId);
    if (!order || !updated) return order;

    const user = await User.findByPk(order.userId);
    if (order.type === 'challenge') {
        await createChallengeForOrder(order);
    } else if (order.type === 'fund') {
        const investment = await FundInvestment.findOne({ where: { orderId: order.id } });
        const fund = await Fund.findByPk(order.fundId);
        if (investment && fund) {
            investment.status = 'active';
            investment.startedAt = new Date();
            investment.maturesAt = new Date(Date.now() + fund.lockDays * 86_400_000);
            investment.currentValue = investment.amount;
            await investment.save();
            fund.raised = Number(fund.raised) + Number(investment.amount);
            await fund.save();
        }
    }
    if (user) await sendMail(user.email, 'پرداخت موفق', `پرداخت سفارش #${order.id} به مبلغ ${order.amountUsd}$ تایید شد.`);
    return order;
}

export async function checkout(params: {
    userId: number;
    type: 'challenge' | 'fund';
    gateway: GatewayChoice;
    amountUsd: number;
    planId?: number;
    fundId?: number;
    meta?: Record<string, unknown>;
}): Promise<CheckoutResult> {
    const settings = await getSettings();
    if (!settings.gateways[params.gateway]) throw badRequest('این روش پرداخت در حال حاضر فعال نیست');
    const user = await User.findByPk(params.userId);
    if (!user) throw badRequest('کاربر یافت نشد');

    const live =
        (params.gateway === 'zarinpal' && !!config.payments.zarinpalMerchantId) ||
        (params.gateway === 'crypto' && !!config.payments.nowpaymentsApiKey);
    if (params.gateway !== 'manual' && !live && !config.payments.mockGateway) {
        throw badRequest('این درگاه پرداخت هنوز راه‌اندازی نشده است؛ لطفا روش دیگری انتخاب کنید');
    }
    const gateway = params.gateway === 'manual' ? 'manual' : live ? params.gateway : 'mock';

    const order = await Order.create({
        userId: params.userId,
        type: params.type,
        planId: params.planId ?? null,
        fundId: params.fundId ?? null,
        amountUsd: params.amountUsd,
        amountIrr: usdToIrr(params.amountUsd, settings.usdToIrr),
        gateway,
        meta: { ...(params.meta || {}), requestedGateway: params.gateway },
    });

    if (gateway === 'manual') {
        return {
            orderId: order.id,
            gateway,
            instructions: { amountUsd: order.amountUsd, amountIrr: order.amountIrr, usdtWallet: settings.manualUsdtWallet, cardNumber: settings.manualCardNumber },
        };
    }
    if (gateway === 'mock') return { orderId: order.id, gateway, paymentUrl: `${config.urls.api}/api/v1/payments/mock/${order.id}` };
    if (gateway === 'zarinpal') return { orderId: order.id, gateway, paymentUrl: await startZarinpal(order, user.email) };
    return { orderId: order.id, gateway, paymentUrl: await startNowPayments(order) };
}

export async function submitManualReceipt(orderId: number, userId: number, receipt: string) {
    const order = await Order.findOne({ where: { id: orderId, userId } });
    if (!order) throw badRequest('سفارش یافت نشد');
    if (order.gateway !== 'manual' || !['pending', 'review'].includes(order.status)) throw badRequest('امکان ثبت رسید برای این سفارش وجود ندارد');
    order.receipt = receipt;
    order.status = 'review';
    await order.save();
    notifyAdmins('رسید پرداخت جدید', `سفارش #${order.id} رسید ثبت کرد و منتظر تایید است.`);
    return order;
}

export async function describeOrder(order: Record<string, any>) {
    if (order.type === 'challenge') {
        const plan = order.Plan || (await Plan.findByPk(order.planId));
        return plan ? `چالش ${plan.name}` : 'چالش';
    }
    const fund = order.Fund || (await Fund.findByPk(order.fundId));
    return fund ? `سرمایه‌گذاری در ${fund.name}` : 'سرمایه‌گذاری';
}
