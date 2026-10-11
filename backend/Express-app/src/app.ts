import cors from 'cors';
import express, { Request, Response } from 'express';
import { config } from './config';
import { errorMiddleware } from './core/http';
import { adminRouter } from './routes/admin';
import { authRouter } from './routes/auth';
import { paymentsRouter } from './routes/payments';
import { publicRouter } from './routes/public';
import { userRouter } from './routes/user';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(
    cors({
        origin: (origin, cb) => cb(null, !origin || config.corsOrigins.includes(origin)),
    }),
);
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req: Request, res: Response) => {
    res.json({ name: 'PipHunter API', status: 'ok' });
});
app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
});

app.use('/api/v1', authRouter);
app.use('/api/v1', publicRouter);
app.use('/api/v1', paymentsRouter);
app.use('/api/v1', adminRouter);
app.use('/api/v1', userRouter);

app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, message: 'مسیر یافت نشد' });
});
app.use(errorMiddleware);

export default app;
