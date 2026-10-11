export interface CreateAccountInput {
    name: string;
    email: string;
    group: string;
    leverage: number;
    initialBalance: number;
}

export interface CreatedAccount {
    login: string;
    password: string;
    investorPassword?: string;
    server: string;
}

export interface AccountStats {
    balance: number;
    equity: number;
    openPositions: number;
    /** Distinct calendar days (YYYY-MM-DD) on which the account opened or closed a trade. */
    tradingDays: number;
}

export interface BrokerAdapter {
    readonly name: string;
    createAccount(input: CreateAccountInput): Promise<CreatedAccount>;
    getStats(login: string): Promise<AccountStats>;
    setTradingEnabled(login: string, enabled: boolean): Promise<void>;
    /** Positive amount deposits, negative withdraws (used for payouts / balance resets). */
    adjustBalance(login: string, amount: number, comment: string): Promise<void>;
}
