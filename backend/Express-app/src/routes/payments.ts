import express, { Router } from 'express';
import { config } from '../config';
import { asyncHandler, notFound } from '../core/http';
import { Order } from '../db';
import { describeOrder, fulfillOrder, handleNowPaymentsIpn, verifyZarinpal } from '../services/payments';

export const paymentsRouter = Router();

const panelResult = (result: 'success' | 'failed' | 'cancel', orderId: number) => `${config.urls.panel}/orders?result=${result}&order=${orderId}`;

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Sandbox payment page used when no real gateway credentials are configured. */
paymentsRouter.get('/payments/mock/:id', asyncHandler(async (req, res) => {
    const order = await Order.findByPk(Number(req.params.id) || 0);
    if (!config.payments.mockGateway || !order || order.gateway !== 'mock') throw notFound('سفارش یافت نشد');
    const title = escapeHtml(await describeOrder(order));
    res.type('html').send(`<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>درگاه آزمایشی پیپ‌هانتر</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#080D17;color:#fff;font-family:Tahoma,sans-serif}
.card{background:#111827;border:1px solid #1f2937;border-radius:16px;padding:32px;width:min(420px,90vw);text-align:center}
h1{font-size:20px;margin:0 0 8px}.muted{color:#9ca3af;font-size:13px}.amount{font-size:28px;margin:24px 0;color:#FD7245}
button{width:100%;padding:12px;border:0;border-radius:10px;font-size:15px;cursor:pointer;margin-top:10px}
.pay{background:#FD7245;color:#fff}.cancel{background:#374151;color:#fff}.badge{display:inline-block;background:#78350f;color:#fde68a;border-radius:999px;padding:4px 12px;font-size:12px;margin-bottom:16px}</style></head>
<body><form class="card" method="post" action="/api/v1/payments/mock/${order.id}/complete">
<span class="badge">درگاه آزمایشی — پرداخت واقعی انجام نمی‌شود</span>
<h1>${title}</h1><div class="muted">سفارش #${order.id} — درگاه انتخابی: ${escapeHtml(String(order.meta?.requestedGateway || ''))}</div>
<div class="amount">${order.amountUsd}$ <div class="muted">${Number(order.amountIrr || 0).toLocaleString('fa-IR')} ریال</div></div>
<button class="pay" name="result" value="success">پرداخت موفق</button>
<button class="cancel" name="result" value="cancel">انصراف از پرداخت</button></form></body></html>`);
}));

paymentsRouter.post('/payments/mock/:id/complete', express.urlencoded({ extended: false }), asyncHandler(async (req, res) => {
    const order = await Order.findByPk(Number(req.params.id) || 0);
    if (!config.payments.mockGateway || !order || order.gateway !== 'mock') throw notFound('سفارش یافت نشد');
    if (req.body.result === 'success') {
        await fulfillOrder(order.id, `MOCK-${Date.now()}`);
        return res.redirect(panelResult('success', order.id));
    }
    await Order.update({ status: 'cancelled' }, { where: { id: order.id, status: 'pending' } });
    res.redirect(panelResult('cancel', order.id));
}));

paymentsRouter.get('/payments/zarinpal/callback', asyncHandler(async (req, res) => {
    const orderId = Number(req.query.orderId) || 0;
    const { ok } = await verifyZarinpal(orderId, String(req.query.Authority || ''), String(req.query.Status || ''));
    res.redirect(panelResult(ok ? 'success' : 'failed', orderId));
}));

paymentsRouter.post('/payments/crypto/ipn', asyncHandler(async (req, res) => {
    const accepted = await handleNowPaymentsIpn(req.body, req.header('x-nowpayments-sig'));
    res.status(accepted ? 200 : 400).json({ success: accepted });
}));
