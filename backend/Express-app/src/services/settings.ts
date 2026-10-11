import { config } from '../config';
import { Setting } from '../db';

export interface AppSettings {
    usdToIrr: number;
    gateways: { zarinpal: boolean; crypto: boolean; manual: boolean };
    manualUsdtWallet: string;
    manualCardNumber: string;
    supportEmail: string;
    supportPhone: string;
    telegram: string;
    instagram: string;
}

const defaults: AppSettings = {
    usdToIrr: config.payments.defaultUsdToIrr,
    gateways: { zarinpal: true, crypto: true, manual: true },
    manualUsdtWallet: config.payments.manualUsdtWallet,
    manualCardNumber: config.payments.manualCardNumber,
    supportEmail: 'support@piphunter.com',
    supportPhone: '021-00000000',
    telegram: 'https://t.me/piphunter',
    instagram: 'https://instagram.com/piphunter',
};

export async function getSettings(): Promise<AppSettings> {
    const row = await Setting.findByPk('app');
    return { ...defaults, ...(row?.value || {}) };
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
    const next = { ...(await getSettings()), ...patch };
    await Setting.upsert({ key: 'app', value: next });
    return next;
}

export function usdToIrr(usd: number, rate: number) {
    return Math.round(usd * rate);
}
