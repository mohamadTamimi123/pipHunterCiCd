import 'dotenv/config';

function required(name: string, fallback?: string): string {
    const value = process.env[name] ?? fallback;
    if (value === undefined || value === '') {
        throw new Error(`Missing required env variable: ${name}`);
    }
    return value;
}

const nodeEnv = process.env.NODE_ENV || 'development';

if (nodeEnv === 'production' && (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === 'Admin@12345')) {
    throw new Error('Set a strong ADMIN_PASSWORD in production');
}

export const config = {
    env: nodeEnv,
    isDev: nodeEnv !== 'production',
    port: Number(process.env.PORT || 8084),

    db: {
        host: process.env.POSTGRES_HOST || '127.0.0.1',
        port: Number(process.env.POSTGRES_PORT || 5432),
        user: required('POSTGRES_USER', 'citizix_user'),
        password: required('POSTGRES_PASSWORD', 'S3cret'),
        name: required('POSTGRES_DB', 'citizix_db'),
        syncAlter: process.env.DB_SYNC_ALTER !== 'false',
    },

    redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    jwtSecret: required('JWT_SECRET'),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

    urls: {
        api: process.env.API_PUBLIC_URL || 'http://127.0.0.1:8084',
        panel: process.env.PANEL_URL || 'http://127.0.0.1:3002',
        site: process.env.SITE_URL || 'http://127.0.0.1:3000',
    },
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3002,http://127.0.0.1:3000,http://127.0.0.1:3002')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),

    admin: {
        email: process.env.ADMIN_EMAIL || 'admin@piphunter.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@12345',
    },

    google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
    },

    mail: {
        host: process.env.SMTP_HOST || '',
        port: Number(process.env.SMTP_PORT || 587),
        user: process.env.SMTP_USER || '',
        password: process.env.SMTP_PASSWORD || '',
        from: process.env.MAIL_FROM || 'PipHunter <no-reply@piphunter.com>',
        adminNotify: process.env.ADMIN_NOTIFY_EMAIL || '',
    },

    broker: {
        // "mock" simulates accounts locally; "mt5" talks to an MT5 Web API REST wrapper.
        mode: (process.env.BROKER_MODE || 'mock') as 'mock' | 'mt5',
        name: process.env.BROKER_NAME || 'Pivot Market',
        server: process.env.BROKER_SERVER || 'PivotMarket-Demo',
        mt5ApiUrl: process.env.MT5_API_URL || '',
        mt5ApiKey: process.env.MT5_API_KEY || '',
        challengeGroup: process.env.MT5_CHALLENGE_GROUP || 'demo\\prop\\challenge',
        fundedGroup: process.env.MT5_FUNDED_GROUP || 'demo\\prop\\funded',
        evaluateEverySeconds: Number(process.env.EVALUATE_EVERY_SECONDS || 30),
    },

    payments: {
        // Sandbox gateway completes orders without real payment; never enable on a public server.
        mockGateway: process.env.PAYMENTS_MOCK ? process.env.PAYMENTS_MOCK === 'true' : nodeEnv !== 'production',
        zarinpalMerchantId: process.env.ZARINPAL_MERCHANT_ID || '',
        zarinpalSandbox: process.env.ZARINPAL_SANDBOX === 'true',
        nowpaymentsApiKey: process.env.NOWPAYMENTS_API_KEY || '',
        nowpaymentsIpnSecret: process.env.NOWPAYMENTS_IPN_SECRET || '',
        manualUsdtWallet: process.env.MANUAL_USDT_WALLET || 'TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        manualCardNumber: process.env.MANUAL_CARD_NUMBER || '6037-0000-0000-0000',
        defaultUsdToIrr: Number(process.env.DEFAULT_USD_TO_IRR || 1_000_000),
    },
};

export type AppConfig = typeof config;
