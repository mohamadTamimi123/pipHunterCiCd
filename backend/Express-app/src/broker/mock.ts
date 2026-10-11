import { config } from '../config';
import { randomPassword } from '../core/crypto';
import { MockBrokerAccount } from '../db';
import { AccountStats, BrokerAdapter, CreateAccountInput, CreatedAccount } from './types';

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Local stand-in for the real broker. Accounts live in `mock_broker_accounts`; `tick()` random-walks
 * equity so the rules engine has something to evaluate, and `simulate()` lets admins force outcomes.
 */
export class MockBroker implements BrokerAdapter {
    readonly name = 'mock';

    async createAccount(input: CreateAccountInput): Promise<CreatedAccount> {
        const login = String(Math.floor(70_000_000 + Math.random() * 9_999_999));
        await MockBrokerAccount.create({ login, balance: input.initialBalance, equity: input.initialBalance, tradingDays: [] });
        return { login, password: randomPassword(), investorPassword: randomPassword(), server: config.broker.server };
    }

    private async find(login: string) {
        const acc = await MockBrokerAccount.findByPk(login);
        if (!acc) throw new Error(`Mock account ${login} not found`);
        return acc;
    }

    async getStats(login: string): Promise<AccountStats> {
        const acc = await this.find(login);
        return { balance: acc.balance, equity: acc.equity, openPositions: acc.openPositions, tradingDays: acc.tradingDays.length };
    }

    async setTradingEnabled(login: string, enabled: boolean) {
        const acc = await this.find(login);
        acc.tradingEnabled = enabled;
        if (!enabled) {
            acc.balance = acc.equity;
            acc.openPositions = 0;
        }
        await acc.save();
    }

    async adjustBalance(login: string, amount: number) {
        const acc = await this.find(login);
        acc.balance = Number(acc.balance) + amount;
        acc.equity = Number(acc.equity) + amount;
        await acc.save();
    }

    /** One simulated market step: small P&L drift on open positions, occasionally open/close trades. */
    async tick(login: string) {
        const acc = await this.find(login);
        if (!acc.tradingEnabled) return;
        const base = Number(acc.balance);
        if (acc.openPositions > 0) {
            const drift = base * (Math.random() - 0.47) * 0.004;
            acc.equity = Math.round((Number(acc.equity) + drift) * 100) / 100;
            if (Math.random() < 0.25) {
                acc.balance = acc.equity;
                acc.openPositions = 0;
                this.markTradingDay(acc);
            }
        } else if (Math.random() < 0.4) {
            acc.openPositions = 1 + Math.floor(Math.random() * 3);
            this.markTradingDay(acc);
        }
        await acc.save();
    }

    /** Apply a closed P&L of `percent` of the current balance and mark extra trading days (admin testing). */
    async simulate(login: string, percent: number, addTradingDays = 0) {
        const acc = await this.find(login);
        const pnl = Math.round(Number(acc.balance) * (percent / 100) * 100) / 100;
        acc.balance = Number(acc.balance) + pnl;
        acc.equity = acc.balance;
        acc.openPositions = 0;
        const days: string[] = [...acc.tradingDays];
        if (!days.includes(today())) days.push(today());
        for (let i = 1; days.length < acc.tradingDays.length + addTradingDays + 1 && i < 365; i++) {
            const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
            if (!days.includes(d)) days.push(d);
        }
        acc.tradingDays = days;
        await acc.save();
    }

    private markTradingDay(acc: Record<string, any>) {
        const days: string[] = acc.tradingDays || [];
        if (!days.includes(today())) acc.tradingDays = [...days, today()];
    }
}
