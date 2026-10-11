import bcrypt from 'bcrypt';
import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config';
import { publicUser, requireAuth, signToken } from '../core/auth';
import { randomPassword } from '../core/crypto';
import { asyncHandler, badRequest, conflict, forbidden, HttpError, ok, parse, unauthorized } from '../core/http';
import { User } from '../db';
import { notifyAdmins } from '../services/mailer';
import { issueOtp, verifyOtp } from '../services/otp';

export const authRouter = Router();

const email = z.string().trim().toLowerCase().email('ایمیل نامعتبر است');
const password = z.string().min(8, 'رمز عبور باید حداقل ۸ کاراکتر باشد').max(100);

const credentials = z
    .object({ email: email.optional(), username: email.optional(), password: z.string().min(1) })
    .transform((v) => ({ email: v.email || v.username || '', password: v.password }))
    .refine((v) => !!v.email, { message: 'ایمیل الزامی است', path: ['email'] });

const parseUid = (uid: unknown) => {
    const id = Number(String(uid || '').replace(/^U_/, ''));
    if (!Number.isInteger(id) || id <= 0) throw badRequest('شناسه کاربر نامعتبر است');
    return id;
};

authRouter.post('/auth/register', asyncHandler(async (req, res) => {
    const body = parse(
        z
            .object({ email: email.optional(), username: email.optional(), password, fullName: z.string().trim().max(100).optional() })
            .transform((v) => ({ ...v, email: v.email || v.username || '' }))
            .refine((v) => !!v.email, { message: 'ایمیل الزامی است', path: ['email'] }),
        req.body,
    );
    let user = await User.findOne({ where: { email: body.email } });
    if (user?.isVerified) throw conflict('با این ایمیل قبلا ثبت نام شده است');

    const hash = await bcrypt.hash(body.password, 10);
    if (user) {
        user.password = hash;
        if (body.fullName) user.fullName = body.fullName;
        await user.save();
    } else {
        user = await User.create({ email: body.email, password: hash, fullName: body.fullName || null });
    }
    await issueOtp(user.id, user.email);
    ok(res, { uid: `U_${user.id}` });
}));

authRouter.post('/auth/otp', asyncHandler(async (req, res) => {
    const body = parse(z.object({ uid: z.string(), code: z.string().trim().min(4).max(6) }), req.body);
    const user = await User.findByPk(parseUid(body.uid));
    if (!user) throw badRequest('کاربر یافت نشد');
    if (!(await verifyOtp(user.id, body.code))) throw badRequest('کد تایید اشتباه یا منقضی شده است');

    const isNew = !user.isVerified;
    user.isVerified = true;
    await user.save();
    if (isNew) notifyAdmins('ثبت نام جدید', `کاربر جدید: ${user.email}`);
    ok(res, signToken(user));
}));

authRouter.post('/auth/resend-otp', asyncHandler(async (req, res) => {
    const user = await User.findByPk(parseUid(req.body?.uid));
    if (!user) throw badRequest('کاربر یافت نشد');
    await issueOtp(user.id, user.email);
    ok(res, { uid: `U_${user.id}` });
}));

async function login(req: Parameters<Parameters<typeof asyncHandler>[0]>[0], staffOnly: boolean) {
    const body = parse(credentials, req.body);
    const user = await User.findOne({ where: { email: body.email } });
    if (!user?.password || !(await bcrypt.compare(body.password, user.password))) throw unauthorized('ایمیل یا رمز عبور اشتباه است');
    if (!user.isActive) throw forbidden('حساب کاربری شما غیرفعال شده است');
    if (staffOnly && user.role === 'user') throw forbidden();
    if (!user.isVerified) {
        await issueOtp(user.id, user.email);
        throw new HttpError(403, 'ابتدا ایمیل خود را تایید کنید؛ کد تایید ارسال شد', 'NOT_VERIFIED', { uid: `U_${user.id}` });
    }
    return signToken(user);
}

authRouter.post('/auth/login', asyncHandler(async (req, res) => ok(res, await login(req, false))));
authRouter.post('/auth/admin-login', asyncHandler(async (req, res) => ok(res, await login(req, true))));

authRouter.post('/auth/forgot-password', asyncHandler(async (req, res) => {
    const body = parse(z.object({ email }), req.body);
    const user = await User.findOne({ where: { email: body.email } });
    if (user) await issueOtp(user.id, user.email);
    ok(res, { uid: user ? `U_${user.id}` : null });
}));

authRouter.post('/auth/reset-password', asyncHandler(async (req, res) => {
    const body = parse(z.object({ email, code: z.string().trim(), password }), req.body);
    const user = await User.findOne({ where: { email: body.email } });
    if (!user || !(await verifyOtp(user.id, body.code))) throw badRequest('کد تایید اشتباه یا منقضی شده است');
    user.password = await bcrypt.hash(body.password, 10);
    user.isVerified = true;
    await user.save();
    ok(res, signToken(user));
}));

authRouter.get('/auth/get-me', requireAuth, asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.auth!.id);
    ok(res, publicUser(user!));
}));

authRouter.put('/auth/profile', requireAuth, asyncHandler(async (req, res) => {
    const body = parse(
        z.object({ fullName: z.string().trim().max(100).optional(), phone: z.string().trim().regex(/^[0-9+\- ]{6,20}$/, 'شماره تماس نامعتبر است').optional().or(z.literal('')) }),
        req.body,
    );
    const user = await User.findByPk(req.auth!.id);
    if (body.fullName !== undefined) user!.fullName = body.fullName;
    if (body.phone !== undefined) user!.phone = body.phone || null;
    await user!.save();
    ok(res, publicUser(user!));
}));

authRouter.post('/auth/change-password', requireAuth, asyncHandler(async (req, res) => {
    const body = parse(z.object({ currentPassword: z.string(), newPassword: password }), req.body);
    const user = await User.findByPk(req.auth!.id);
    if (!user!.password || !(await bcrypt.compare(body.currentPassword, user!.password))) throw badRequest('رمز عبور فعلی اشتباه است');
    user!.password = await bcrypt.hash(body.newPassword, 10);
    await user!.save();
    ok(res, true);
}));

/** Accepts a Google ID token (credential) and verifies it with Google before trusting its email. */
authRouter.post('/auth-google/google', asyncHandler(async (req, res) => {
    const body = parse(z.object({ cred: z.string().min(10) }), req.body);
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(body.cred)}`, { signal: AbortSignal.timeout(10_000) }).catch(() => null);
    const info = (await response?.json().catch(() => null)) as { aud?: string; email?: string; email_verified?: string | boolean; sub?: string; name?: string } | null;
    if (!response?.ok || !info?.email || String(info.email_verified) !== 'true' || (config.google.clientId && info.aud !== config.google.clientId)) {
        throw unauthorized('ورود با گوگل ناموفق بود');
    }
    const userEmail = info.email.toLowerCase();
    let user = await User.findOne({ where: { email: userEmail } });
    if (!user) {
        user = await User.create({ email: userEmail, password: await bcrypt.hash(randomPassword(16), 10), fullName: info.name || null, isVerified: true, googleId: info.sub });
        notifyAdmins('ثبت نام جدید (گوگل)', `کاربر جدید: ${userEmail}`);
    } else if (!user.isVerified || !user.googleId) {
        user.isVerified = true;
        user.googleId = info.sub;
        await user.save();
    }
    if (!user.isActive) throw forbidden('حساب کاربری شما غیرفعال شده است');
    ok(res, signToken(user));
}));
