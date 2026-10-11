import { Router } from 'express';
import { Op } from 'sequelize';
import { asyncHandler, notFound, ok, pagination } from '../core/http';
import { BlogPost, Fund, Plan, User, sequelize } from '../db';
import { getSettings, usdToIrr } from '../services/settings';

export const publicRouter = Router();

export function serializePlan(plan: Record<string, any>, rate: number) {
    const json = plan.toJSON ? plan.toJSON() : plan;
    return { ...json, priceIrr: usdToIrr(Number(json.price), rate) };
}

publicRouter.get('/plans', asyncHandler(async (_req, res) => {
    const { usdToIrr: rate } = await getSettings();
    const plans = await Plan.findAll({ where: { isActive: true }, order: [['sortOrder', 'ASC'], ['accountSize', 'ASC']] });
    ok(res, plans.map((p) => serializePlan(p, rate)));
}));

publicRouter.get('/plans/:id', asyncHandler(async (req, res) => {
    const { usdToIrr: rate } = await getSettings();
    const plan = await Plan.findOne({ where: { id: Number(req.params.id) || 0, isActive: true } });
    if (!plan) throw notFound('پلن یافت نشد');
    ok(res, serializePlan(plan, rate));
}));

publicRouter.get('/settings/public', asyncHandler(async (_req, res) => {
    const s = await getSettings();
    ok(res, {
        usdToIrr: s.usdToIrr,
        gateways: s.gateways,
        manualUsdtWallet: s.manualUsdtWallet,
        manualCardNumber: s.manualCardNumber,
        supportEmail: s.supportEmail,
        supportPhone: s.supportPhone,
        telegram: s.telegram,
        instagram: s.instagram,
    });
}));

const postListAttributes = ['id', 'title', 'slug', 'excerpt', 'coverImage', 'category', 'tags', 'publishedAt', 'views'];

publicRouter.get('/blog/posts', asyncHandler(async (req, res) => {
    const { limit, offset, page, pageSize } = pagination(req.query);
    const where: Record<string | symbol, unknown> = { status: 'published' };
    if (req.query.category) where.category = String(req.query.category);
    if (req.query.search) where.title = { [Op.iLike]: `%${String(req.query.search)}%` };
    const { rows, count } = await BlogPost.findAndCountAll({ where, attributes: postListAttributes, order: [['publishedAt', 'DESC']], limit, offset });
    ok(res, { items: rows, total: count, page, pageSize });
}));

publicRouter.get('/blog/posts/:slug', asyncHandler(async (req, res) => {
    const post = await BlogPost.findOne({
        where: { slug: req.params.slug, status: 'published' },
        include: [{ model: User, as: 'author', attributes: ['fullName'] }],
    });
    if (!post) throw notFound('مقاله یافت نشد');
    await post.increment('views');
    const related = await BlogPost.findAll({
        where: { status: 'published', category: post.category, id: { [Op.ne]: post.id } },
        attributes: postListAttributes,
        order: [['publishedAt', 'DESC']],
        limit: 3,
    });
    ok(res, { ...(post.toJSON() as Record<string, unknown>), related });
}));

publicRouter.get('/blog/categories', asyncHandler(async (_req, res) => {
    const rows = await BlogPost.findAll({
        where: { status: 'published' },
        attributes: ['category', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['category'],
        raw: true,
    });
    ok(res, rows);
}));

publicRouter.get('/funds', asyncHandler(async (_req, res) => {
    const funds = await Fund.findAll({ order: [['status', 'DESC'], ['id', 'ASC']] });
    ok(res, funds);
}));

publicRouter.get('/funds/:slug', asyncHandler(async (req, res) => {
    const fund = await Fund.findOne({ where: { slug: req.params.slug } });
    if (!fund) throw notFound('صندوق یافت نشد');
    ok(res, fund);
}));
