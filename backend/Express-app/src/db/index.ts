import { DataTypes, Model, ModelAttributeColumnOptions, Sequelize } from 'sequelize';
import { config } from '../config';

export const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    logging: false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    define: { underscored: true },
});

// Postgres returns DECIMAL as string; expose numbers to the rest of the app.
function money(field: string, opts: Partial<ModelAttributeColumnOptions> = {}): ModelAttributeColumnOptions {
    return {
        type: DataTypes.DECIMAL(16, 2),
        allowNull: false,
        defaultValue: 0,
        ...opts,
        get(this: Model) {
            const v = this.getDataValue(field);
            return v === null || v === undefined ? v : Number(v);
        },
    };
}

function percent(field: string, opts: Partial<ModelAttributeColumnOptions> = {}): ModelAttributeColumnOptions {
    return { ...money(field, opts), type: DataTypes.DECIMAL(6, 2) };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export type AnyModel = Model<any, any> & Record<string, any>;

export const User = sequelize.define<AnyModel>('User', {
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: true },
    fullName: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING },
    role: { type: DataTypes.ENUM('user', 'support', 'admin'), allowNull: false, defaultValue: 'user' },
    isVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    googleId: { type: DataTypes.STRING },
}, { tableName: 'users' });

export const Setting = sequelize.define<AnyModel>('Setting', {
    key: { type: DataTypes.STRING, primaryKey: true },
    value: { type: DataTypes.JSONB },
}, { tableName: 'settings' });

export const Plan = sequelize.define<AnyModel>('Plan', {
    name: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT },
    accountSize: money('accountSize'),
    price: money('price'),
    phases: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
    profitTargetPhase1: percent('profitTargetPhase1', { defaultValue: 8 }),
    profitTargetPhase2: percent('profitTargetPhase2', { defaultValue: 5 }),
    dailyLossLimit: percent('dailyLossLimit', { defaultValue: 5 }),
    maxLossLimit: percent('maxLossLimit', { defaultValue: 10 }),
    minTradingDays: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3 },
    maxDurationDays: { type: DataTypes.INTEGER, allowNull: true },
    profitSplit: percent('profitSplit', { defaultValue: 80 }),
    leverage: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 100 },
    features: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    isPopular: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, { tableName: 'plans' });

export const Order = sequelize.define<AnyModel>('Order', {
    type: { type: DataTypes.ENUM('challenge', 'fund'), allowNull: false },
    amountUsd: money('amountUsd'),
    amountIrr: { type: DataTypes.BIGINT, allowNull: true, get(this: Model) { const v = this.getDataValue('amountIrr'); return v == null ? v : Number(v); } },
    gateway: { type: DataTypes.ENUM('zarinpal', 'crypto', 'manual', 'mock'), allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'review', 'paid', 'failed', 'cancelled'), allowNull: false, defaultValue: 'pending' },
    gatewayRef: { type: DataTypes.STRING },
    gatewayTrackId: { type: DataTypes.STRING },
    receipt: { type: DataTypes.TEXT },
    adminNote: { type: DataTypes.TEXT },
    paidAt: { type: DataTypes.DATE },
    meta: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
}, { tableName: 'orders' });

export const Challenge = sequelize.define<AnyModel>('Challenge', {
    stage: { type: DataTypes.ENUM('phase1', 'phase2', 'funded'), allowNull: false, defaultValue: 'phase1' },
    status: { type: DataTypes.ENUM('active', 'failed'), allowNull: false, defaultValue: 'active' },
    rules: { type: DataTypes.JSONB, allowNull: false },
    failReason: { type: DataTypes.STRING },
    failedAt: { type: DataTypes.DATE },
    fundedAt: { type: DataTypes.DATE },
}, { tableName: 'challenges' });

export const TradingAccount = sequelize.define<AnyModel>('TradingAccount', {
    stage: { type: DataTypes.ENUM('phase1', 'phase2', 'funded'), allowNull: false },
    login: { type: DataTypes.STRING, allowNull: false },
    passwordEnc: { type: DataTypes.TEXT, allowNull: false },
    investorPasswordEnc: { type: DataTypes.TEXT },
    server: { type: DataTypes.STRING, allowNull: false },
    initialBalance: money('initialBalance'),
    balance: money('balance'),
    equity: money('equity'),
    dayStartBalance: money('dayStartBalance'),
    dayStartDate: { type: DataTypes.DATEONLY },
    lowestEquity: money('lowestEquity'),
    tradingDays: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    openPositions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.ENUM('active', 'passed', 'failed', 'closed'), allowNull: false, defaultValue: 'active' },
    startedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    endedAt: { type: DataTypes.DATE },
    lastSyncedAt: { type: DataTypes.DATE },
}, { tableName: 'trading_accounts' });

export const AccountSnapshot = sequelize.define<AnyModel>('AccountSnapshot', {
    balance: money('balance'),
    equity: money('equity'),
}, { tableName: 'account_snapshots', updatedAt: false, indexes: [{ fields: ['trading_account_id', 'created_at'] }] });

export const ChallengeEvent = sequelize.define<AnyModel>('ChallengeEvent', {
    type: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.STRING, allowNull: false },
    data: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
}, { tableName: 'challenge_events', updatedAt: false });

export const Payout = sequelize.define<AnyModel>('Payout', {
    profit: money('profit'),
    amount: money('amount'),
    method: { type: DataTypes.ENUM('usdt', 'card'), allowNull: false },
    destination: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'approved', 'paid', 'rejected'), allowNull: false, defaultValue: 'pending' },
    adminNote: { type: DataTypes.TEXT },
    processedAt: { type: DataTypes.DATE },
}, { tableName: 'payouts' });

export const Ticket = sequelize.define<AnyModel>('Ticket', {
    subject: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.ENUM('general', 'technical', 'financial', 'challenge'), allowNull: false, defaultValue: 'general' },
    priority: { type: DataTypes.ENUM('low', 'normal', 'high'), allowNull: false, defaultValue: 'normal' },
    status: { type: DataTypes.ENUM('open', 'answered', 'pending', 'closed'), allowNull: false, defaultValue: 'open' },
    lastMessageAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'tickets' });

export const TicketMessage = sequelize.define<AnyModel>('TicketMessage', {
    body: { type: DataTypes.TEXT, allowNull: false },
    isStaff: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: 'ticket_messages', updatedAt: false });

export const BlogPost = sequelize.define<AnyModel>('BlogPost', {
    title: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    excerpt: { type: DataTypes.TEXT },
    content: { type: DataTypes.TEXT, allowNull: false },
    coverImage: { type: DataTypes.STRING },
    category: { type: DataTypes.STRING, allowNull: false, defaultValue: 'عمومی' },
    tags: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    status: { type: DataTypes.ENUM('draft', 'published'), allowNull: false, defaultValue: 'draft' },
    publishedAt: { type: DataTypes.DATE },
    views: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, { tableName: 'blog_posts' });

export const Fund = sequelize.define<AnyModel>('Fund', {
    name: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT },
    strategy: { type: DataTypes.STRING },
    riskLevel: { type: DataTypes.ENUM('low', 'medium', 'high'), allowNull: false, defaultValue: 'medium' },
    minInvestment: money('minInvestment', { defaultValue: 100 }),
    expectedMonthlyReturn: percent('expectedMonthlyReturn'),
    lockDays: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 90 },
    managementFee: percent('managementFee'),
    performanceFee: percent('performanceFee'),
    capacity: money('capacity'),
    raised: money('raised'),
    status: { type: DataTypes.ENUM('open', 'closed'), allowNull: false, defaultValue: 'open' },
}, { tableName: 'funds' });

export const FundInvestment = sequelize.define<AnyModel>('FundInvestment', {
    amount: money('amount'),
    currentValue: money('currentValue'),
    status: { type: DataTypes.ENUM('pending', 'active', 'withdraw_requested', 'closed'), allowNull: false, defaultValue: 'pending' },
    startedAt: { type: DataTypes.DATE },
    maturesAt: { type: DataTypes.DATE },
}, { tableName: 'fund_investments' });

export const MockBrokerAccount = sequelize.define<AnyModel>('MockBrokerAccount', {
    login: { type: DataTypes.STRING, primaryKey: true },
    balance: money('balance'),
    equity: money('equity'),
    tradingEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    openPositions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    tradingDays: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
}, { tableName: 'mock_broker_accounts' });

User.hasMany(Order, { foreignKey: { name: 'userId', allowNull: false } });
Order.belongsTo(User, { foreignKey: 'userId' });
Order.belongsTo(Plan, { foreignKey: 'planId' });
Order.belongsTo(Fund, { foreignKey: 'fundId' });

User.hasMany(Challenge, { foreignKey: { name: 'userId', allowNull: false } });
Challenge.belongsTo(User, { foreignKey: 'userId' });
Challenge.belongsTo(Plan, { foreignKey: { name: 'planId', allowNull: false } });
Challenge.belongsTo(Order, { foreignKey: 'orderId' });
Challenge.hasMany(TradingAccount, { foreignKey: { name: 'challengeId', allowNull: false }, as: 'accounts' });
TradingAccount.belongsTo(Challenge, { foreignKey: 'challengeId' });
TradingAccount.belongsTo(User, { foreignKey: { name: 'userId', allowNull: false } });
TradingAccount.hasMany(AccountSnapshot, { foreignKey: { name: 'tradingAccountId', allowNull: false }, as: 'snapshots', onDelete: 'CASCADE' });
Challenge.hasMany(ChallengeEvent, { foreignKey: { name: 'challengeId', allowNull: false }, as: 'events', onDelete: 'CASCADE' });

User.hasMany(Payout, { foreignKey: { name: 'userId', allowNull: false } });
Payout.belongsTo(User, { foreignKey: 'userId' });
Payout.belongsTo(TradingAccount, { foreignKey: { name: 'tradingAccountId', allowNull: false } });

User.hasMany(Ticket, { foreignKey: { name: 'userId', allowNull: false } });
Ticket.belongsTo(User, { foreignKey: 'userId' });
Ticket.hasMany(TicketMessage, { foreignKey: { name: 'ticketId', allowNull: false }, as: 'messages', onDelete: 'CASCADE' });
TicketMessage.belongsTo(Ticket, { foreignKey: 'ticketId' });
TicketMessage.belongsTo(User, { foreignKey: { name: 'userId', allowNull: false }, as: 'author' });

BlogPost.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

Fund.hasMany(FundInvestment, { foreignKey: { name: 'fundId', allowNull: false } });
FundInvestment.belongsTo(Fund, { foreignKey: 'fundId' });
FundInvestment.belongsTo(User, { foreignKey: { name: 'userId', allowNull: false } });
FundInvestment.belongsTo(Order, { foreignKey: 'orderId' });

export async function initDb() {
    await sequelize.authenticate();
    await sequelize.sync({ alter: config.db.syncAlter });
}
