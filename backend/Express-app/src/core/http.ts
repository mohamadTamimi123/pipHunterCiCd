import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { ZodError, ZodTypeAny, z } from 'zod';

export class HttpError extends Error {
    constructor(
        public status: number,
        message: string,
        public code?: string,
        public details?: unknown,
    ) {
        super(message);
    }
}

export const badRequest = (message: string, details?: unknown) => new HttpError(400, message, 'BAD_REQUEST', details);
export const unauthorized = (message = 'ابتدا وارد حساب کاربری شوید') => new HttpError(401, message, 'UNAUTHORIZED');
export const forbidden = (message = 'دسترسی ندارید') => new HttpError(403, message, 'FORBIDDEN');
export const notFound = (message = 'یافت نشد') => new HttpError(404, message, 'NOT_FOUND');
export const conflict = (message: string) => new HttpError(409, message, 'CONFLICT');

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown;

export const asyncHandler = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

export function parse<T extends ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw badRequest('اطلاعات ارسالی نامعتبر است', result.error.flatten().fieldErrors);
    }
    return result.data;
}

export function ok(res: Response, data: unknown, status = 200) {
    return res.status(status).json({ success: true, data });
}

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof HttpError) {
        res.status(err.status).json({ success: false, message: err.message, code: err.code, details: err.details });
        return;
    }
    if (err instanceof ZodError) {
        res.status(400).json({ success: false, message: 'اطلاعات ارسالی نامعتبر است', details: err.flatten().fieldErrors });
        return;
    }
    if (err?.type === 'entity.parse.failed') {
        res.status(400).json({ success: false, message: 'بدنه درخواست نامعتبر است' });
        return;
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'خطای داخلی سرور' });
};

export function pagination(query: Record<string, unknown>) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    return { page, pageSize, offset: (page - 1) * pageSize, limit: pageSize };
}
