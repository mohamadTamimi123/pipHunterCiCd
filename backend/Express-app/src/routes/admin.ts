import { Router } from 'express';
import { Op } from 'sequelize';
import { z } from 'zod';
import { broker, isMockBroker, mockBroker } from '../broker';
import { publicUser, requireAdmin, requireAuth, requireStaff } from '../core/auth';
import { slugify } from '../core/crypto';
import { asyncHandler, badRequest, notFound, ok, pagination, parse } from '../core/http';
import {
    AccountSnapshot,
    BlogPost,
    Challenge,
    ChallengeEvent,
    Fund,
    FundInvestment,
    Order,
    Payout,
    Plan,
    Ticket,
    TicketMessage,
    TradingAccount,
    User,
} from '../db';
import { ChallengeRules, evaluateAccount, failChallenge, serializeAccount } from '../services/challenges';
import { sendMail } from '../services/mailer';
import { describeOrder, fulfillOrder } from '../services/payments';
import { getSettings, updateSettings } from '../services/settings';
import { loadTicket } from './user';

export const adminRouter = Router();
adminRouter.use('/admin', requireAuth, requireStaff);

const idParam = (v: unknown) => {
    const id = Number(v);
    if (!Number.isInteger(id) || id <= 0) throw notFound();
    return id;
};

/* ---------- stats ---------- */

adminRouter.get('/admin/stats', asyncHandler(async (_req, res) => {
    const [users, paidOrders, activeChallenges, funded, failed, pendingPayouts, openTickets, reviewOrders, paidPayouts] = await Promise.all([
        User.count({ where: { role: 'user' } }),
        Order.findAll({ where: { status: 'paid' }, attributes: ['amountUsd', 'type', 'paidAt'] }),
        Challenge.count({ where: { status: 'active', stage: { [Op.ne]: 'funded' } } }),
        Challenge.count({ where: { status: 'active', stage: 'funded' } }),
        Challenge.count({ where: { status: 'failed' } }),
        Payout.count({ where: { status: { [Op.in]: ['pending', 'approved'] } } }),
        Ticket.count({ where: { status: { [Op.in]: ['open', 'pending'] } } }),
        Order.count({ where: { status: 'review' } }),
        Payout.sum('amount', { where: { status: 'paid' } }),
    ]);
    const revenueByDay: Record<string, number> = {};
    for (const o of paidOrders) {
        const day = new Date(o.paidAt).toISOString().slice(0, 10);
        revenueByDay[day] = (revenueByDay[day] || 0) + Number(o.amountUsd);
    }
    ok(res, {
        users,
        revenue: paidOrders.filter((o) => o.type === 'challenge').reduce((s, o) => s + Number(o.amountUsd), 0),
        fundInflow: paidOrders.filter((o) => o.type === 'fund').reduce((s, o) => s + Number(o.amountUsd), 0),
        activeChallenges,
        fundedAccounts: funded,
        failedChallenges: failed,
        pendingPayouts,
        paidPayouts: Number(paidPayouts || 0),
        openTickets,
        ordersToReview: reviewOrders,
        revenueByDay: Object.entries(revenueByDay).sort(([a], [b]) => a.localeCompare(b)).slice(-30).map(([date, amount]) => ({ date, amount })),
        brokerMode: broker.name,
    });
}));

/* ---------- users ---------- */

adminRouter.get('/admin/users', asyncHandler(async (req, res) => {
    const { limit, offset, page, pageSize } = pagination(req.query);
    const where: Record<string | symbol, unknown> = {};
    if (req.query.search) {
        const q = `%${String(req.query.search)}%`;
        where[Op.or] = [{ email: { [Op.iLike]: q } }, { fullName: { [Op.iLike]: q } }, { phone: { [Op.iLike]: q } }];
    }
    if (req.query.role) where.role = String(req.query.role);
    const { rows, count } = await User.findAndCountAll({ where, order: [['id', 'DESC']], limit, offset });
    ok(res, { items: rows.map(publicUser), total: count, page, pageSize });
}));

adminRouter.patch('/admin/users/:id', requireAdmin, asyncHandler(async (req, res) => {
    const body = parse(z.object({ role: z.enum(['user', 'support', 'admin']).optional(), isActive: z.boolean().optional(), isVerified: z.boolean().optional() }), req.body);
    const user = await User.findByPk(idParam(req.params.id));
    if (!user) throw notFound('کاربر یافت نشد');
    if (user.id === req.auth!.id && (body.role && body.role !== 'admin' || body.isActive === false)) throw badRequest('نمی‌توانید دسترسی خودتان را محدود کنید');
    await user.update(body);
    ok(res, publicUser(user));
}));

/* ---------- plans ---------- */

const planSchema = z.object({
    name: z.string().trim().min(2),
    slug: z.string().trim().optional(),
    description: z.string().trim().optional().nullable(),
    accountSize: z.coerce.number().positive(),
    price: z.coerce.number().positive(),
    phases: z.coerce.number().int().min(1).max(2),
    profitTargetPhase1: z.coerce.number().min(0).max(100),
    profitTargetPhase2: z.coerce.number().min(0).max(100),
    dailyLossLimit: z.coerce.number().positive().max(100),
    maxLossLimit: z.coerce.number().positive().max(100),
    minTradingDays: z.coerce.number().int().min(0),
    maxDurationDays: z.coerce.number().int().positive().nullable().optional(),
    profitSplit: z.coerce.number().min(0).max(100),
    leverage: z.coerce.number().int().positive(),
    features: z.array(z.string()).default([]),
    isActive: z.boolean().default(true),
    isPopular: z.boolean().default(false),
    sortOrder: z.coerce.number().int().default(0),
});

adminRouter.get('/admin/plans', asyncHandler(async (_req, res) => ok(res, await Plan.findAll({ order: [['sortOrder', 'ASC'], ['accountSize', 'ASC']] }))));

adminRouter.post('/admin/plans', requireAdmin, asyncHandler(async (req, res) => {
    const body = parse(planSchema, req.body);
    ok(res, await Plan.create({ ...body, slug: slugify(body.slug || body.name) }), 201);
}));

adminRouter.put('/admin/plans/:id', requireAdmin, asyncHandler(async (req, res) => {
    const plan = await Plan.findByPk(idParam(req.params.id));
    if (!plan) throw notFound('پلن یافت نشد');
    const body = parse(planSchema.partial(), req.body);
    if (body.slug) body.slug = slugify(body.slug);
    ok(res, await plan.update(body));
}));

adminRouter.delete('/admin/plans/:id', requireAdmin, asyncHandler(async (req, res) => {
    const plan = await Plan.findByPk(idParam(req.params.id));
    if (!plan) throw notFound('پلن یافت نشد');
    const used = await Order.count({ where: { planId: plan.id } });
    if (used) await plan.update({ isActive: false });
    else await plan.destroy();
    ok(res, { archived: !!used });
}));

/* ---------- orders ---------- */

adminRouter.get('/admin/orders', asyncHandler(async (req, res) => {
    const { limit, offset, page, pageSize } = pagination(req.query);
    const where: Record<string, unknown> = {};
    if (req.query.status) where.status = String(req.query.status);
    const { rows, count } = await Order.findAndCountAll({
        where,
        include: [{ model: User, attributes: ['id', 'email', 'fullName'] }, Plan, Fund],
        order: [['id', 'DESC']],
        limit,
        offset,
    });
    const items = await Promise.all(rows.map(async (o) => ({ ...o.toJSON(), title: await describeOrder(o) })));
    ok(res, { items, total: count, page, pageSize });
}));

adminRouter.post('/admin/orders/:id/approve', requireAdmin, asyncHandler(async (req, res) => {
    const order = await Order.findByPk(idParam(req.params.id));
    if (!order || !['pending', 'review'].includes(order.status)) throw badRequest('این سفارش قابل تایید نیست');
    ok(res, await fulfillOrder(order.id, `MANUAL-${req.auth!.id}`));
}));

adminRouter.post('/admin/orders/:id/reject', requireAdmin, asyncHandler(async (req, res) => {
    const body = parse(z.object({ note: z.string().trim().max(500).optional() }), req.body);
    const order = await Order.findByPk(idParam(req.params.id));
    if (!order || !['pending', 'review'].includes(order.status)) throw badRequest('این سفارش قابل رد نیست');
    await order.update({ status: 'failed', adminNote: body.note || null });
    const user = await User.findByPk(order.userId);
    if (user) await sendMail(user.email, 'رد پرداخت', `پرداخت سفارش #${order.id} تایید نشد.${body.note ? `\nتوضیح: ${body.note}` : ''}`);
    ok(res, order);
}));

/* ---------- challenges ---------- */

adminRouter.get('/admin/challenges', asyncHandler(async (req, res) => {
    const { limit, offset, page, pageSize } = pagination(req.query);
    const where: Record<string, unknown> = {};
    if (req.query.status) where.status = String(req.query.status);
    if (req.query.stage) where.stage = String(req.query.stage);
    const { rows, count } = await Challenge.findAndCountAll({
        where,
        include: [{ model: User, attributes: ['id', 'email', 'fullName'] }, { model: Plan, attributes: ['id', 'name'] }, { model: TradingAccount, as: 'accounts' }],
        order: [['id', 'DESC'], [{ model: TradingAccount, as: 'accounts' }, 'id', 'DESC']],
        limit,
        offset,
        distinct: true,
    });
    ok(res, {
        items: rows.map((c) => ({
            id: c.id,
            stage: c.stage,
            status: c.status,
            failReason: c.failReason,
            createdAt: c.createdAt,
            rules: c.rules,
            user: c.User,
            plan: c.Plan,
            account: c.accounts[0] ? serializeAccount(c.accounts[0], c.rules as ChallengeRules) : null,
        })),
        total: count,
        page,
        pageSize,
        mockBroker: isMockBroker,
    });
}));

adminRouter.get('/admin/challenges/:id', asyncHandler(async (req, res) => {
    const challenge = await Challenge.findByPk(idParam(req.params.id), {
        include: [
            { model: User, attributes: ['id', 'email', 'fullName', 'phone'] },
            { model: Plan, attributes: ['id', 'name'] },
            { model: TradingAccount, as: 'accounts' },
            { model: ChallengeEvent, as: 'events' },
        ],
        order: [[{ model: TradingAccount, as: 'accounts' }, 'id', 'ASC'], [{ model: ChallengeEvent, as: 'events' }, 'id', 'DESC']],
    });
    if (!challenge) throw notFound('چالش یافت نشد');
    const rules = challenge.rules as ChallengeRules;
    const current = challenge.accounts[challenge.accounts.length - 1];
    const snapshots = current
        ? (await AccountSnapshot.findAll({ where: { tradingAccountId: current.id }, order: [['id', 'DESC']], limit: 500, attributes: ['balance', 'equity', 'createdAt'] })).reverse()
        : [];
    ok(res, {
        ...(challenge.toJSON() as Record<string, unknown>),
        accounts: challenge.accounts.map((a: Record<string, any>) => serializeAccount(a, rules, req.auth!.role === 'admin')),
        snapshots,
        mockBroker: isMockBroker,
    });
}));

adminRouter.post('/admin/challenges/:id/fail', requireAdmin, asyncHandler(async (req, res) => {
    const challenge = await Challenge.findByPk(idParam(req.params.id));
    if (!challenge || challenge.status !== 'active') throw badRequest('این چالش فعال نیست');
    const account = await TradingAccount.findOne({ where: { challengeId: challenge.id, status: 'active' } });
    await failChallenge(challenge, account, 'manual', { by: req.auth!.id });
    ok(res, true);
}));

adminRouter.post('/admin/challenges/:id/simulate', requireAdmin, asyncHandler(async (req, res) => {
    if (!isMockBroker) throw badRequest('شبیه‌سازی فقط در حالت بروکر آزمایشی فعال است');
    const body = parse(z.object({ percent: z.coerce.number().min(-100).max(100), tradingDays: z.coerce.number().int().min(0).max(60).default(0) }), req.body);
    const account = await TradingAccount.findOne({ where: { challengeId: idParam(req.params.id), status: 'active' } });
    if (!account) throw badRequest('حساب فعالی برای این چالش وجود ندارد');
    await mockBroker.simulate(account.login, body.percent, body.tradingDays);
    await evaluateAccount(account);
    ok(res, true);
}));

/* ---------- payouts ---------- */

adminRouter.get('/admin/payouts', asyncHandler(async (req, res) => {
    const where: Record<string, unknown> = {};
    if (req.query.status) where.status = String(req.query.status);
    ok(res, await Payout.findAll({
        where,
        include: [{ model: User, attributes: ['id', 'email', 'fullName'] }, { model: TradingAccount, attributes: ['id', 'login', 'challengeId', 'balance', 'initialBalance'] }],
        order: [['id', 'DESC']],
    }));
}));

adminRouter.post('/admin/payouts/:id/:action', requireAdmin, asyncHandler(async (req, res) => {
    const action = String(req.params.action);
    const body = parse(z.object({ note: z.string().trim().max(500).optional() }), req.body || {});
    const payout = await Payout.findByPk(idParam(req.params.id));
    if (!payout) throw notFound('درخواست یافت نشد');
    const user = await User.findByPk(payout.userId);

    if (action === 'approve') {
        if (payout.status !== 'pending') throw badRequest('فقط درخواست‌های در انتظار قابل تایید هستند');
        const account = await TradingAccount.findByPk(payout.tradingAccountId);
        if (!account || account.status !== 'active') throw badRequest('حساب فاند فعال نیست');
        await broker.adjustBalance(account.login, -Number(payout.profit), `Payout #${payout.id}`);
        // Withdrawn profit must not count as a drawdown for the daily-loss rule.
        account.balance = Number(account.balance) - Number(payout.profit);
        account.equity = Number(account.equity) - Number(payout.profit);
        account.dayStartBalance = Number(account.dayStartBalance) - Number(payout.profit);
        await account.save();
        await ChallengeEvent.create({ challengeId: account.challengeId, type: 'payout', message: `برداشت سود ${payout.amount}$ تایید شد` });
        await payout.update({ status: 'approved', adminNote: body.note || null, processedAt: new Date() });
        if (user) await sendMail(user.email, 'تایید برداشت سود', `درخواست برداشت ${payout.amount}$ تایید شد و به‌زودی واریز می‌شود.`);
    } else if (action === 'paid') {
        if (payout.status !== 'approved') throw badRequest('ابتدا درخواست را تایید کنید');
        await payout.update({ status: 'paid', adminNote: body.note || payout.adminNote, processedAt: new Date() });
        if (user) await sendMail(user.email, 'واریز سود', `مبلغ ${payout.amount}$ به ${payout.destination} واریز شد.${body.note ? `\n${body.note}` : ''}`);
    } else if (action === 'reject') {
        if (payout.status !== 'pending') throw badRequest('فقط درخواست‌های در انتظار قابل رد هستند');
        await payout.update({ status: 'rejected', adminNote: body.note || null, processedAt: new Date() });
        if (user) await sendMail(user.email, 'رد درخواست برداشت', `درخواست برداشت شما رد شد.${body.note ? `\nدلیل: ${body.note}` : ''}`);
    } else {
        throw notFound();
    }
    ok(res, payout);
}));

/* ---------- tickets ---------- */

adminRouter.get('/admin/tickets', asyncHandler(async (req, res) => {
    const where: Record<string, unknown> = {};
    if (req.query.status) where.status = String(req.query.status);
    ok(res, await Ticket.findAll({ where, include: [{ model: User, attributes: ['id', 'email', 'fullName'] }], order: [['lastMessageAt', 'DESC']] }));
}));

adminRouter.get('/admin/tickets/:id', asyncHandler(async (req, res) => ok(res, await loadTicket(idParam(req.params.id)))));

adminRouter.post('/admin/tickets/:id/messages', asyncHandler(async (req, res) => {
    const body = parse(z.object({ body: z.string().trim().min(1).max(5000) }), req.body);
    const ticket = await loadTicket(idParam(req.params.id));
    await TicketMessage.create({ ticketId: ticket.id, userId: req.auth!.id, body: body.body, isStaff: true });
    await ticket.update({ status: 'answered', lastMessageAt: new Date() });
    if (ticket.User) await sendMail(ticket.User.email, `پاسخ تیکت #${ticket.id}`, `به تیکت «${ticket.subject}» پاسخ داده شد.\n\n${body.body}`);
    ok(res, await loadTicket(ticket.id), 201);
}));

adminRouter.patch('/admin/tickets/:id', asyncHandler(async (req, res) => {
    const body = parse(z.object({ status: z.enum(['open', 'answered', 'pending', 'closed']).optional(), priority: z.enum(['low', 'normal', 'high']).optional() }), req.body);
    const ticket = await Ticket.findByPk(idParam(req.params.id));
    if (!ticket) throw notFound('تیکت یافت نشد');
    ok(res, await ticket.update(body));
}));

/* ---------- blog ---------- */

const postSchema = z.object({
    title: z.string().trim().min(3),
    slug: z.string().trim().optional(),
    excerpt: z.string().trim().max(500).optional().nullable(),
    content: z.string().min(10),
    coverImage: z.string().trim().url().optional().nullable().or(z.literal('')),
    category: z.string().trim().min(1).default('عمومی'),
    tags: z.array(z.string()).default([]),
    status: z.enum(['draft', 'published']).default('draft'),
});

adminRouter.get('/admin/blog/posts', asyncHandler(async (_req, res) => {
    ok(res, await BlogPost.findAll({ order: [['id', 'DESC']], attributes: { exclude: ['content'] } }));
}));

adminRouter.get('/admin/blog/posts/:id', asyncHandler(async (req, res) => {
    const post = await BlogPost.findByPk(idParam(req.params.id));
    if (!post) throw notFound('مقاله یافت نشد');
    ok(res, post);
}));

adminRouter.post('/admin/blog/posts', requireAdmin, asyncHandler(async (req, res) => {
    const body = parse(postSchema, req.body);
    const post = await BlogPost.create({
        ...body,
        coverImage: body.coverImage || null,
        slug: slugify(body.slug || body.title),
        authorId: req.auth!.id,
        publishedAt: body.status === 'published' ? new Date() : null,
    });
    ok(res, post, 201);
}));

adminRouter.put('/admin/blog/posts/:id', requireAdmin, asyncHandler(async (req, res) => {
    const post = await BlogPost.findByPk(idParam(req.params.id));
    if (!post) throw notFound('مقاله یافت نشد');
    const body = parse(postSchema.partial(), req.body);
    const patch: Record<string, unknown> = { ...body };
    if (body.slug) patch.slug = slugify(body.slug);
    if (body.coverImage === '') patch.coverImage = null;
    if (body.status === 'published' && !post.publishedAt) patch.publishedAt = new Date();
    ok(res, await post.update(patch));
}));

adminRouter.delete('/admin/blog/posts/:id', requireAdmin, asyncHandler(async (req, res) => {
    const n = await BlogPost.destroy({ where: { id: idParam(req.params.id) } });
    if (!n) throw notFound('مقاله یافت نشد');
    ok(res, true);
}));

/* ---------- funds ---------- */

const fundSchema = z.object({
    name: z.string().trim().min(2),
    slug: z.string().trim().optional(),
    description: z.string().trim().optional().nullable(),
    strategy: z.string().trim().optional().nullable(),
    riskLevel: z.enum(['low', 'medium', 'high']),
    minInvestment: z.coerce.number().positive(),
    expectedMonthlyReturn: z.coerce.number().min(0).max(100),
    lockDays: z.coerce.number().int().min(0),
    managementFee: z.coerce.number().min(0).max(100),
    performanceFee: z.coerce.number().min(0).max(100),
    capacity: z.coerce.number().min(0),
    status: z.enum(['open', 'closed']),
});

adminRouter.get('/admin/funds', asyncHandler(async (_req, res) => ok(res, await Fund.findAll({ order: [['id', 'ASC']] }))));

adminRouter.post('/admin/funds', requireAdmin, asyncHandler(async (req, res) => {
    const body = parse(fundSchema, req.body);
    ok(res, await Fund.create({ ...body, slug: slugify(body.slug || body.name) }), 201);
}));

adminRouter.put('/admin/funds/:id', requireAdmin, asyncHandler(async (req, res) => {
    const fund = await Fund.findByPk(idParam(req.params.id));
    if (!fund) throw notFound('صندوق یافت نشد');
    const body = parse(fundSchema.partial(), req.body);
    if (body.slug) body.slug = slugify(body.slug);
    ok(res, await fund.update(body));
}));

adminRouter.get('/admin/investments', asyncHandler(async (req, res) => {
    const where: Record<string, unknown> = {};
    if (req.query.status) where.status = String(req.query.status);
    ok(res, await FundInvestment.findAll({ where, include: [Fund, { model: User, attributes: ['id', 'email', 'fullName'] }], order: [['id', 'DESC']] }));
}));

adminRouter.patch('/admin/investments/:id', requireAdmin, asyncHandler(async (req, res) => {
    const body = parse(z.object({ currentValue: z.coerce.number().min(0).optional(), status: z.enum(['active', 'withdraw_requested', 'closed']).optional() }), req.body);
    const inv = await FundInvestment.findByPk(idParam(req.params.id));
    if (!inv || inv.status === 'pending') throw notFound('سرمایه‌گذاری یافت نشد');
    if (body.status === 'closed' && inv.status !== 'closed') {
        const fund = await Fund.findByPk(inv.fundId);
        if (fund) await fund.update({ raised: Math.max(0, Number(fund.raised) - Number(inv.amount)) });
    }
    ok(res, await inv.update(body));
}));

/* ---------- settings ---------- */

adminRouter.get('/admin/settings', requireAdmin, asyncHandler(async (_req, res) => ok(res, await getSettings())));

adminRouter.put('/admin/settings', requireAdmin, asyncHandler(async (req, res) => {
    const body = parse(
        z.object({
            usdToIrr: z.coerce.number().int().positive().optional(),
            gateways: z.object({ zarinpal: z.boolean(), crypto: z.boolean(), manual: z.boolean() }).optional(),
            manualUsdtWallet: z.string().trim().optional(),
            manualCardNumber: z.string().trim().optional(),
            supportEmail: z.string().trim().email().optional(),
            supportPhone: z.string().trim().optional(),
            telegram: z.string().trim().optional(),
            instagram: z.string().trim().optional(),
        }),
        req.body,
    );
    ok(res, await updateSettings(body));
}));
