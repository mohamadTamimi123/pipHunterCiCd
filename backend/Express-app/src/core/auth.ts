import { NextFunction, Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { User } from '../db';
import { forbidden, unauthorized } from './http';

export type Role = 'user' | 'support' | 'admin';

export interface AuthUser {
    id: number;
    email: string;
    role: Role;
    fullName?: string | null;
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            auth?: AuthUser;
        }
    }
}

export function signToken(user: Record<string, any>) {
    const payload = { user: { id: user.id, email: user.email, username: user.email, role: user.role, fullName: user.fullName ?? null } };
    return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as SignOptions);
}

function readToken(req: Request): string | null {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (!token || scheme.toLowerCase() !== 'bearer' || token === 'undefined') return null;
    return token;
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
    try {
        const token = readToken(req);
        if (!token) throw unauthorized();
        let decoded: { user?: { id?: number } };
        try {
            decoded = jwt.verify(token, config.jwtSecret) as typeof decoded;
        } catch {
            throw unauthorized('نشست شما منقضی شده است، دوباره وارد شوید');
        }
        const user = decoded.user?.id ? await User.findByPk(decoded.user.id) : null;
        if (!user || !user.isActive) throw unauthorized();
        req.auth = { id: user.id, email: user.email, role: user.role, fullName: user.fullName };
        next();
    } catch (e) {
        next(e);
    }
}

export const requireRole = (...roles: Role[]) => (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(unauthorized());
    if (!roles.includes(req.auth.role)) return next(forbidden());
    next();
};

export const requireStaff = requireRole('admin', 'support');
export const requireAdmin = requireRole('admin');

export function publicUser(user: Record<string, any>) {
    return {
        id: user.id,
        email: user.email,
        username: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
    };
}
