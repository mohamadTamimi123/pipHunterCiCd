import Queue from 'bull';
import { Op } from 'sequelize';
import { broker, isMockBroker, mockBroker } from '../broker';
import { config } from '../config';
import { decrypt, encrypt } from '../core/crypto';
import { AccountSnapshot, Challenge, ChallengeEvent, Plan, TradingAccount, User } from '../db';
import { notifyAdmins, sendMail } from './mailer';

export type Stage = 'phase1' | 'phase2' | 'funded';

export interface ChallengeRules {
    planName: string;
    accountSize: number;
    phases: number;
    profitTargetPhase1: number;
    profitTargetPhase2: number;
    dailyLossLimit: number;
    maxLossLimit: number;
    minTradingDays: number;
    maxDurationDays: number | null;
    profitSplit: number;
    leverage: number;
}

export const STAGE_LABELS: Record<Stage, string> = { phase1: 'مرحله اول', phase2: 'مرحله دوم', funded: 'حساب فاند' };

export const FAIL_REASONS: Record<string, string> = {
    daily_loss: 'عبور از حد ضرر روزانه',
    max_loss: 'عبور از حد ضرر کلی',
    time_limit: 'پایان مهلت چالش',
    manual: 'لغو توسط مدیریت',
};

const today = () => new Date().toISOString().slice(0, 10);
const round2 = (n: number) => Math.round(n * 100) / 100;

export function rulesFromPlan(plan: Record<string, any>): ChallengeRules {
    return {
        planName: plan.name,
        accountSize: plan.accountSize,
        phases: plan.phases,
        profitTargetPhase1: plan.profitTargetPhase1,
        profitTargetPhase2: plan.profitTargetPhase2,
        dailyLossLimit: plan.dailyLossLimit,
        maxLossLimit: plan.maxLossLimit,
        minTradingDays: plan.minTradingDays,
        maxDurationDays: plan.maxDurationDays,
        profitSplit: plan.profitSplit,
        leverage: plan.leverage,
    };
}

async function addEvent(challengeId: number, type: string, message: string, data: Record<string, unknown> = {}) {
    await ChallengeEvent.create({ challengeId, type, message, data });
}

async function openAccount(challenge: Record<string, any>, stage: Stage) {
    const user = await User.findByPk(challenge.userId);
    const rules: ChallengeRules = challenge.rules;
    const created = await broker.createAccount({
        name: user?.fullName || user?.email || `user-${challenge.userId}`,
        email: user?.email || '',
        group: stage === 'funded' ? config.broker.fundedGroup : config.broker.challengeGroup,
        leverage: rules.leverage,
        initialBalance: rules.accountSize,
    });

    const account = await TradingAccount.create({
        challengeId: challenge.id,
        userId: challenge.userId,
        stage,
        login: created.login,
        passwordEnc: encrypt(created.password),
        investorPasswordEnc: created.investorPassword ? encrypt(created.investorPassword) : null,
        server: created.server,
        initialBalance: rules.accountSize,
        balance: rules.accountSize,
        equity: rules.accountSize,
        dayStartBalance: rules.accountSize,
        dayStartDate: today(),
        lowestEquity: rules.accountSize,
    });
    await AccountSnapshot.create({ tradingAccountId: account.id, balance: rules.accountSize, equity: rules.accountSize });
    await addEvent(challenge.id, 'account_created', `حساب ${STAGE_LABELS[stage]} ساخته شد (لاگین ${created.login})`, { login: created.login, stage });

    if (user) {
        await sendMail(
            user.email,
            `حساب ${STAGE_LABELS[stage]} شما آماده است`,
            [
                `حساب معاملاتی ${STAGE_LABELS[stage]} چالش «${rules.planName}» ساخته شد.`,
                `بروکر: ${config.broker.name}`,
                `سرور: ${created.server}`,
                `لاگین: ${created.login}`,
                `رمز عبور: ${created.password}`,
                '',
                `جزئیات و قوانین را در پنل ببینید: ${config.urls.panel}/challenges/${challenge.id}`,
            ].join('\n'),
        );
    }
    return account;
}

export async function createChallengeForOrder(order: Record<string, any>) {
    const existing = await Challenge.findOne({ where: { orderId: order.id } });
    if (existing) return existing;
    const plan = await Plan.findByPk(order.planId);
    if (!plan) throw new Error(`Plan ${order.planId} not found for order ${order.id}`);

    const challenge = await Challenge.create({ userId: order.userId, planId: plan.id, orderId: order.id, stage: 'phase1', rules: rulesFromPlan(plan) });
    await addEvent(challenge.id, 'created', `چالش «${plan.name}» خریداری شد`);
    await openAccount(challenge, 'phase1');
    notifyAdmins('خرید چالش جدید', `کاربر ${order.userId} چالش ${plan.name} را خرید (سفارش #${order.id}).`);
    return challenge;
}

export async function failChallenge(challenge: Record<string, any>, account: Record<string, any> | null, reason: keyof typeof FAIL_REASONS, data: Record<string, unknown> = {}) {
    if (account) {
        account.status = 'failed';
        account.endedAt = new Date();
        await account.save();
        await broker.setTradingEnabled(account.login, false).catch((e) => console.error('[broker] disable trading failed', e.message));
    }
    challenge.status = 'failed';
    challenge.failReason = reason;
    challenge.failedAt = new Date();
    await challenge.save();
    await addEvent(challenge.id, 'failed', `چالش ناموفق: ${FAIL_REASONS[reason]}`, data);

    const user = await User.findByPk(challenge.userId);
    if (user) {
        await sendMail(user.email, 'نتیجه چالش', `متاسفانه چالش «${challenge.rules.planName}» به دلیل «${FAIL_REASONS[reason]}» متوقف شد.\nمی‌توانید از پنل چالش جدیدی شروع کنید: ${config.urls.panel}/buy`);
    }
}

async function passStage(challenge: Record<string, any>, account: Record<string, any>) {
    account.status = 'passed';
    account.endedAt = new Date();
    await account.save();
    await broker.setTradingEnabled(account.login, false).catch((e) => console.error('[broker] disable trading failed', e.message));

    const rules: ChallengeRules = challenge.rules;
    const user = await User.findByPk(challenge.userId);

    if (account.stage === 'phase1' && rules.phases >= 2) {
        challenge.stage = 'phase2';
        await challenge.save();
        await addEvent(challenge.id, 'phase_passed', 'مرحله اول با موفقیت پاس شد');
        await openAccount(challenge, 'phase2');
        if (user) await sendMail(user.email, 'تبریک! مرحله اول پاس شد', `مرحله اول چالش «${rules.planName}» را پاس کردید. حساب مرحله دوم برایتان ساخته شد.`);
        return;
    }

    challenge.stage = 'funded';
    challenge.fundedAt = new Date();
    await challenge.save();
    await addEvent(challenge.id, 'funded', 'چالش کامل شد؛ حساب فاند صادر شد');
    await openAccount(challenge, 'funded');
    if (user) await sendMail(user.email, 'تبریک! شما فاند شدید', `چالش «${rules.planName}» را با موفقیت پشت سر گذاشتید. حساب فاند ${rules.accountSize.toLocaleString()} دلاری شما آماده است.`);
    notifyAdmins('حساب فاند جدید', `کاربر ${challenge.userId} در چالش #${challenge.id} فاند شد.`);
}

export interface Progress {
    profit: number;
    profitPercent: number;
    profitTarget: number | null;
    profitTargetAmount: number | null;
    dailyLoss: number;
    dailyLossLimitAmount: number;
    totalLoss: number;
    maxLossLimitAmount: number;
    tradingDays: number;
    minTradingDays: number;
    daysLeft: number | null;
}

export function computeProgress(account: Record<string, any>, rules: ChallengeRules): Progress {
    const init = Number(account.initialBalance);
    const balance = Number(account.balance);
    const equity = Number(account.equity);
    const target = account.stage === 'phase1' ? rules.profitTargetPhase1 : account.stage === 'phase2' ? rules.profitTargetPhase2 : null;
    let daysLeft: number | null = null;
    if (rules.maxDurationDays && account.stage !== 'funded') {
        const end = new Date(account.startedAt).getTime() + rules.maxDurationDays * 86_400_000;
        daysLeft = Math.max(0, Math.ceil((end - Date.now()) / 86_400_000));
    }
    return {
        profit: round2(balance - init),
        profitPercent: round2(((balance - init) / init) * 100),
        profitTarget: target,
        profitTargetAmount: target != null ? round2((init * target) / 100) : null,
        dailyLoss: round2(Math.max(0, Number(account.dayStartBalance) - equity)),
        dailyLossLimitAmount: round2((init * rules.dailyLossLimit) / 100),
        totalLoss: round2(Math.max(0, init - equity)),
        maxLossLimitAmount: round2((init * rules.maxLossLimit) / 100),
        tradingDays: account.tradingDays,
        minTradingDays: rules.minTradingDays,
        daysLeft,
    };
}

export async function evaluateAccount(account: Record<string, any>) {
    const challenge = await Challenge.findByPk(account.challengeId);
    if (!challenge || challenge.status !== 'active' || account.status !== 'active') return;

    const stats = await broker.getStats(account.login);
    const changed = stats.equity !== account.equity || stats.balance !== account.balance;

    if (account.dayStartDate !== today()) {
        account.dayStartDate = today();
        account.dayStartBalance = Math.max(stats.balance, Number(account.balance));
    }
    account.balance = stats.balance;
    account.equity = stats.equity;
    account.openPositions = stats.openPositions;
    account.tradingDays = stats.tradingDays;
    account.lowestEquity = Math.min(Number(account.lowestEquity), stats.equity);
    account.lastSyncedAt = new Date();
    await account.save();
    if (changed) await AccountSnapshot.create({ tradingAccountId: account.id, balance: stats.balance, equity: stats.equity });

    const rules: ChallengeRules = challenge.rules;
    const p = computeProgress(account, rules);

    if (p.dailyLoss >= p.dailyLossLimitAmount) return failChallenge(challenge, account, 'daily_loss', { equity: stats.equity, dayStartBalance: account.dayStartBalance });
    if (p.totalLoss >= p.maxLossLimitAmount) return failChallenge(challenge, account, 'max_loss', { equity: stats.equity });
    if (account.stage === 'funded') return;

    const targetHit = p.profitTargetAmount != null && p.profit >= p.profitTargetAmount;
    if (targetHit && stats.openPositions === 0 && p.tradingDays >= p.minTradingDays) return passStage(challenge, account);
    if (p.daysLeft === 0) return failChallenge(challenge, account, 'time_limit');
}

export async function evaluateAll() {
    const accounts = await TradingAccount.findAll({ where: { status: 'active' }, order: [['id', 'ASC']] });
    for (const account of accounts) {
        try {
            if (isMockBroker) await mockBroker.tick(account.login);
            await evaluateAccount(account);
        } catch (e) {
            console.error(`[rules] account ${account.id} (${account.login}) evaluation failed:`, (e as Error).message);
        }
    }
}

export function serializeAccount(account: Record<string, any>, rules: ChallengeRules, withSecrets = false) {
    const data: Record<string, unknown> = {
        id: account.id,
        stage: account.stage,
        login: account.login,
        server: account.server,
        status: account.status,
        initialBalance: account.initialBalance,
        balance: account.balance,
        equity: account.equity,
        openPositions: account.openPositions,
        tradingDays: account.tradingDays,
        startedAt: account.startedAt,
        endedAt: account.endedAt,
        lastSyncedAt: account.lastSyncedAt,
        progress: computeProgress(account, rules),
    };
    if (withSecrets) {
        data.password = decrypt(account.passwordEnc);
        data.investorPassword = account.investorPasswordEnc ? decrypt(account.investorPasswordEnc) : null;
    }
    return data;
}

export async function activeAccount(challengeId: number) {
    return TradingAccount.findOne({ where: { challengeId, status: { [Op.in]: ['active'] } }, order: [['id', 'DESC']] });
}

const evaluationQueue = new Queue('challenge-evaluation', config.redisUrl);

export async function startRulesEngine() {
    evaluationQueue.process(async () => evaluateAll());
    evaluationQueue.on('failed', (_job, err) => console.error('[rules] evaluation job failed:', err.message));
    const repeatable = await evaluationQueue.getRepeatableJobs();
    await Promise.all(repeatable.map((j) => evaluationQueue.removeRepeatableByKey(j.key)));
    await evaluationQueue.add({}, { repeat: { every: config.broker.evaluateEverySeconds * 1000 }, removeOnComplete: true, removeOnFail: 50 });
    console.log(`[rules] engine started (every ${config.broker.evaluateEverySeconds}s, broker=${broker.name})`);
}
