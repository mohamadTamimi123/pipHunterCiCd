import { Router } from 'express';
import { Op } from 'sequelize';
import { z } from 'zod';
import { requireAuth } from '../core/auth';
import { asyncHandler, badRequest, notFound, ok, parse } from '../core/http';
import { AccountSnapshot, Challenge, ChallengeEvent, Fund, FundInvestment, Order, Payout, Plan, Ticket, TicketMessage, TradingAccount, User } from '../db';
import { ChallengeRules, serializeAccount } from '../services/challenges';
import { notifyAdmins } from '../services/mailer';
import { checkout, describeOrder, submitManualReceipt } from '../services/payments';

export const userRouter = Router();
userRouter.use(requireAuth);

const gateway = z.enum(['zarinpal', 'crypto', 'manual']);
const idParam = (v: unknown) => {
    const id = Number(v);
    if (!Number.isInteger(id) || id <= 0) throw notFound();
    return id;
};

/* ---------- dashboard ---------- */

userRouter.get('/dashboard', asyncHandler(async (req, res) => {
    const userId = req.auth!.id;
    const [challenges, payouts, openTickets, investments] = await Promise.all([
        Challenge.findAll({ where: { userId }, include: [Plan] }),
        Payout.findAll({ where: { userId } }),
        Ticket.count({ where: { userId, status: { [Op.ne]: 'closed' } } }),
        FundInvestment.findAll({ where: { userId, status: { [Op.in]: ['active', 'withdraw_requested'] } } }),
    ]);
    ok(res, {
        activeChallenges: challenges.filter((c) => c.status === 'active' && c.stage !== 'funded').length,
        fundedAccounts: challenges.filter((c) => c.status === 'active' && c.stage === 'funded').length,
        failedChallenges: challenges.filter((c) => c.status === 'failed').length,
        totalPaidOut: payouts.filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0),
        pendingPayouts: payouts.filter((p) => ['pending', 'approved'].includes(p.status)).length,
        openTickets,
        investedAmount: investments.reduce((s, i) => s + Number(i.amount), 0),
        investmentsValue: investments.reduce((s, i) => s + Number(i.currentValue), 0),
    });
}));

/* ---------- orders & checkout ---------- */

userRouter.post('/orders/checkout', asyncHandler(async (req, res) => {
    const body = parse(z.object({ planId: z.coerce.number().int().positive(), gateway }), req.body);
    const plan = await Plan.findOne({ where: { id: body.planId, isActive: true } });
    if (!plan) throw badRequest('پلن انتخاب شده موجود نیست');
    ok(res, await checkout({ userId: req.auth!.id, type: 'challenge', gateway: body.gateway, amountUsd: plan.price, planId: plan.id }), 201);
}));

userRouter.get('/orders', asyncHandler(async (req, res) => {
    const orders = await Order.findAll({ where: { userId: req.auth!.id }, include: [Plan, Fund], order: [['id', 'DESC']] });
    ok(res, await Promise.all(orders.map(async (o) => ({ ...o.toJSON(), title: await describeOrder(o) }))));
}));

userRouter.post('/orders/:id/receipt', asyncHandler(async (req, res) => {
    const body = parse(z.object({ receipt: z.string().trim().min(5, 'اطلاعات رسید را کامل وارد کنید').max(1000) }), req.body);
    ok(res, await submitManualReceipt(idParam(req.params.id), req.auth!.id, body.receipt));
}));

userRouter.post('/orders/:id/cancel', asyncHandler(async (req, res) => {
    const [n] = await Order.update({ status: 'cancelled' }, { where: { id: idParam(req.params.id), userId: req.auth!.id, status: 'pending' } });
    if (!n) throw badRequest('این سفارش قابل لغو نیست');
    ok(res, true);
}));

/* ---------- challenges ---------- */

userRouter.get('/challenges', asyncHandler(async (req, res) => {
    const challenges = await Challenge.findAll({
        where: { userId: req.auth!.id },
        include: [{ model: Plan, attributes: ['id', 'name'] }, { model: TradingAccount, as: 'accounts' }],
        order: [['id', 'DESC'], [{ model: TradingAccount, as: 'accounts' }, 'id', 'DESC']],
    });
    ok(res, challenges.map((c) => {
        const current = c.accounts[0];
        return {
            id: c.id,
            stage: c.stage,
            status: c.status,
            failReason: c.failReason,
            rules: c.rules,
            createdAt: c.createdAt,
            fundedAt: c.fundedAt,
            plan: c.Plan,
            account: current ? serializeAccount(current, c.rules as ChallengeRules) : null,
        };
    }));
}));

userRouter.get('/challenges/:id', asyncHandler(async (req, res) => {
    const challenge = await Challenge.findOne({
        where: { id: idParam(req.params.id), userId: req.auth!.id },
        include: [
            { model: Plan, attributes: ['id', 'name'] },
            { model: TradingAccount, as: 'accounts' },
            { model: ChallengeEvent, as: 'events' },
        ],
        order: [[{ model: TradingAccount, as: 'accounts' }, 'id', 'ASC'], [{ model: ChallengeEvent, as: 'events' }, 'id', 'DESC']],
    });
    if (!challenge) throw notFound('چالش یافت نشد');
    const rules = challenge.rules as ChallengeRules;
    const accounts = challenge.accounts.map((a: Record<string, any>) => serializeAccount(a, rules, a.status === 'active'));
    const current = challenge.accounts[challenge.accounts.length - 1];
    const snapshots = current
        ? (await AccountSnapshot.findAll({ where: { tradingAccountId: current.id }, order: [['id', 'DESC']], limit: 500, attributes: ['balance', 'equity', 'createdAt'] })).reverse()
        : [];
    ok(res, {
        id: challenge.id,
        stage: challenge.stage,
        status: challenge.status,
        failReason: challenge.failReason,
        failedAt: challenge.failedAt,
        fundedAt: challenge.fundedAt,
        createdAt: challenge.createdAt,
        rules,
        plan: challenge.Plan,
        accounts,
        events: challenge.events,
        snapshots,
    });
}));

/* ---------- payouts ---------- */

async function payoutEligibility(userId: number) {
    const accounts = await TradingAccount.findAll({ where: { userId, stage: 'funded', status: 'active' }, include: [Challenge] });
    const pending = await Payout.findAll({ where: { userId, status: { [Op.in]: ['pending', 'approved'] } } });
    return accounts.map((a) => {
        const rules = a.Challenge.rules as ChallengeRules;
        const profit = Math.max(0, Math.round((Number(a.balance) - Number(a.initialBalance)) * 100) / 100);
        const hasPending = pending.some((p) => p.tradingAccountId === a.id);
        return {
            tradingAccountId: a.id,
            challengeId: a.challengeId,
            login: a.login,
            balance: a.balance,
            profit,
            profitSplit: rules.profitSplit,
            amount: Math.round(profit * rules.profitSplit) / 100,
            openPositions: a.openPositions,
            eligible: profit > 0 && a.openPositions === 0 && !hasPending,
            reason: hasPending ? 'درخواست در حال بررسی دارید' : a.openPositions > 0 ? 'ابتدا معاملات باز را ببندید' : profit <= 0 ? 'سودی برای برداشت وجود ندارد' : null,
        };
    });
}

userRouter.get('/payouts', asyncHandler(async (req, res) => {
    const payouts = await Payout.findAll({ where: { userId: req.auth!.id }, include: [{ model: TradingAccount, attributes: ['login', 'challengeId'] }], order: [['id', 'DESC']] });
    ok(res, { payouts, eligibility: await payoutEligibility(req.auth!.id) });
}));

userRouter.post('/payouts', asyncHandler(async (req, res) => {
    const body = parse(
        z.object({ tradingAccountId: z.coerce.number().int().positive(), method: z.enum(['usdt', 'card']), destination: z.string().trim().min(10, 'آدرس کیف پول / شماره کارت نامعتبر است').max(100) }),
        req.body,
    );
    const item = (await payoutEligibility(req.auth!.id)).find((e) => e.tradingAccountId === body.tradingAccountId);
    if (!item) throw badRequest('حساب فاند یافت نشد');
    if (!item.eligible) throw badRequest(item.reason || 'امکان برداشت وجود ندارد');
    const payout = await Payout.create({ userId: req.auth!.id, tradingAccountId: item.tradingAccountId, profit: item.profit, amount: item.amount, method: body.method, destination: body.destination });
    notifyAdmins('درخواست برداشت سود', `درخواست برداشت #${payout.id} به مبلغ ${item.amount}$ ثبت شد.`);
    ok(res, payout, 201);
}));

/* ---------- tickets ---------- */

userRouter.get('/tickets', asyncHandler(async (req, res) => {
    const where: Record<string, unknown> = { userId: req.auth!.id };
    if (req.query.status) where.status = String(req.query.status);
    ok(res, await Ticket.findAll({ where, order: [['lastMessageAt', 'DESC']] }));
}));

userRouter.post('/tickets', asyncHandler(async (req, res) => {
    const body = parse(
        z.object({
            subject: z.string().trim().min(3, 'عنوان تیکت کوتاه است').max(150),
            category: z.enum(['general', 'technical', 'financial', 'challenge']).default('general'),
            priority: z.enum(['low', 'normal', 'high']).default('normal'),
            message: z.string().trim().min(5, 'متن پیام کوتاه است').max(5000),
        }),
        req.body,
    );
    const ticket = await Ticket.create({ userId: req.auth!.id, subject: body.subject, category: body.category, priority: body.priority });
    await TicketMessage.create({ ticketId: ticket.id, userId: req.auth!.id, body: body.message });
    notifyAdmins('تیکت جدید', `تیکت #${ticket.id}: ${ticket.subject}`);
    ok(res, ticket, 201);
}));

export async function loadTicket(id: number, userId?: number) {
    const ticket = await Ticket.findOne({
        where: userId ? { id, userId } : { id },
        include: [
            { model: TicketMessage, as: 'messages', include: [{ model: User, as: 'author', attributes: ['id', 'fullName', 'email'] }] },
            { model: User, attributes: ['id', 'fullName', 'email'] },
        ],
        order: [[{ model: TicketMessage, as: 'messages' }, 'id', 'ASC']],
    });
    if (!ticket) throw notFound('تیکت یافت نشد');
    return ticket;
}

userRouter.get('/tickets/:id', asyncHandler(async (req, res) => ok(res, await loadTicket(idParam(req.params.id), req.auth!.id))));

userRouter.post('/tickets/:id/messages', asyncHandler(async (req, res) => {
    const body = parse(z.object({ body: z.string().trim().min(1).max(5000) }), req.body);
    const ticket = await loadTicket(idParam(req.params.id), req.auth!.id);
    if (ticket.status === 'closed') throw badRequest('این تیکت بسته شده است');
    await TicketMessage.create({ ticketId: ticket.id, userId: req.auth!.id, body: body.body });
    await ticket.update({ status: 'open', lastMessageAt: new Date() });
    ok(res, await loadTicket(ticket.id, req.auth!.id), 201);
}));

userRouter.post('/tickets/:id/close', asyncHandler(async (req, res) => {
    const ticket = await loadTicket(idParam(req.params.id), req.auth!.id);
    await ticket.update({ status: 'closed' });
    ok(res, true);
}));

/* ---------- funds & investments ---------- */

userRouter.post('/funds/:id/invest', asyncHandler(async (req, res) => {
    const body = parse(z.object({ amount: z.coerce.number().positive(), gateway }), req.body);
    const fund = await Fund.findByPk(idParam(req.params.id));
    if (!fund || fund.status !== 'open') throw badRequest('این صندوق در حال حاضر پذیرش سرمایه ندارد');
    if (body.amount < Number(fund.minInvestment)) throw badRequest(`حداقل مبلغ سرمایه‌گذاری ${fund.minInvestment}$ است`);
    if (Number(fund.capacity) > 0 && Number(fund.raised) + body.amount > Number(fund.capacity)) throw badRequest('ظرفیت صندوق کافی نیست');

    const result = await checkout({ userId: req.auth!.id, type: 'fund', gateway: body.gateway, amountUsd: body.amount, fundId: fund.id });
    await FundInvestment.create({ userId: req.auth!.id, fundId: fund.id, orderId: result.orderId, amount: body.amount, currentValue: body.amount });
    ok(res, result, 201);
}));

userRouter.get('/investments', asyncHandler(async (req, res) => {
    ok(res, await FundInvestment.findAll({ where: { userId: req.auth!.id, status: { [Op.ne]: 'pending' } }, include: [Fund], order: [['id', 'DESC']] }));
}));

userRouter.post('/investments/:id/withdraw', asyncHandler(async (req, res) => {
    const inv = await FundInvestment.findOne({ where: { id: idParam(req.params.id), userId: req.auth!.id } });
    if (!inv || inv.status !== 'active') throw badRequest('امکان درخواست برداشت وجود ندارد');
    if (inv.maturesAt && new Date(inv.maturesAt) > new Date()) throw badRequest('دوره قفل سرمایه هنوز به پایان نرسیده است');
    await inv.update({ status: 'withdraw_requested' });
    notifyAdmins('درخواست برداشت از صندوق', `سرمایه‌گذاری #${inv.id} درخواست برداشت دارد.`);
    ok(res, inv);
}));
