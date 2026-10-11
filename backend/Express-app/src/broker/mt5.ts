import { config } from '../config';
import { AccountStats, BrokerAdapter, CreateAccountInput, CreatedAccount } from './types';

/**
 * Talks to an MT5 Web API REST wrapper (e.g. Brokeret MT5 Web API) in front of the broker's MT5 server.
 * Required env: MT5_API_URL, MT5_API_KEY, MT5_CHALLENGE_GROUP, MT5_FUNDED_GROUP, BROKER_SERVER.
 */
export class Mt5Broker implements BrokerAdapter {
    readonly name = 'mt5';

    constructor(
        private baseUrl = config.broker.mt5ApiUrl.replace(/\/$/, ''),
        private apiKey = config.broker.mt5ApiKey,
    ) {
        if (!this.baseUrl || !this.apiKey) throw new Error('BROKER_MODE=mt5 requires MT5_API_URL and MT5_API_KEY');
    }

    private async call<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
        const res = await fetch(`${this.baseUrl}${path}`, {
            method,
            headers: { 'X-API-Key': this.apiKey, 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined,
            signal: AbortSignal.timeout(15_000),
        });
        const text = await res.text();
        if (!res.ok) throw new Error(`MT5 API ${method} ${path} -> ${res.status}: ${text.slice(0, 300)}`);
        return (text ? JSON.parse(text) : {}) as T;
    }

    async createAccount(input: CreateAccountInput): Promise<CreatedAccount> {
        const created = await this.call<{ login: number | string; pass_main: string; pass_investor?: string }>('POST', '/api/user/create', {
            group: input.group,
            name: input.name,
            email: input.email,
            leverage: input.leverage,
        });
        const login = String(created.login);
        await this.adjustBalance(login, input.initialBalance, 'Prop challenge initial balance');
        return { login, password: created.pass_main, investorPassword: created.pass_investor, server: config.broker.server };
    }

    async getStats(login: string): Promise<AccountStats> {
        const stats = await this.call<{ accounts: Array<{ Balance: number; Equity: number }> }>('GET', `/api/trade-stats/by-login/${login}`);
        const account = stats.accounts?.[0];
        if (!account) throw new Error(`MT5 account ${login} not found`);

        const positions = await this.call<{ total?: number }>('GET', `/api/positions/by-login/${login}`);
        const deals = await this.call<{ deals?: Array<{ Time?: number | string }> }>('GET', `/api/deals/by-login/${login}`).catch(() => ({ deals: [] }));
        const days = new Set(
            (deals.deals || [])
                .map((d) => (d.Time ? new Date(typeof d.Time === 'number' ? d.Time * 1000 : d.Time).toISOString().slice(0, 10) : null))
                .filter(Boolean),
        );

        return { balance: Number(account.Balance), equity: Number(account.Equity), openPositions: Number(positions.total || 0), tradingDays: days.size };
    }

    async setTradingEnabled(login: string, enabled: boolean) {
        await this.call('POST', '/api/rights/trading', { login, trading: enabled });
    }

    async adjustBalance(login: string, amount: number, comment: string) {
        await this.call('POST', '/api/finance/balance', { login, balance: amount, comment });
    }
}
