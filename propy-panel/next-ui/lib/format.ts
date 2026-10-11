const usdFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const faNumber = new Intl.NumberFormat("fa-IR");

export const usd = (n: number | string | null | undefined) => usdFormatter.format(Number(n || 0));
export const num = (n: number | string | null | undefined) => faNumber.format(Number(n || 0));
export const toman = (rial: number | string | null | undefined) => `${faNumber.format(Math.round(Number(rial || 0) / 10))} تومان`;
export const pct = (n: number | string | null | undefined) => `${faNumber.format(Number(n || 0))}٪`;

export function date(value: string | Date | null | undefined, withTime = false) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(value));
}

type Color = "default" | "primary" | "secondary" | "success" | "warning" | "danger";
type Label = { label: string; color: Color };

export const STAGE: Record<string, Label> = {
  phase1: { label: "مرحله اول", color: "primary" },
  phase2: { label: "مرحله دوم", color: "secondary" },
  funded: { label: "حساب فاند", color: "success" },
};

export const CHALLENGE_STATUS: Record<string, Label> = {
  active: { label: "فعال", color: "success" },
  failed: { label: "ناموفق", color: "danger" },
};

export const ACCOUNT_STATUS: Record<string, Label> = {
  active: { label: "فعال", color: "success" },
  passed: { label: "پاس شده", color: "primary" },
  failed: { label: "ناموفق", color: "danger" },
  closed: { label: "بسته", color: "default" },
};

export const FAIL_REASON: Record<string, string> = {
  daily_loss: "عبور از حد ضرر روزانه",
  max_loss: "عبور از حد ضرر کلی",
  time_limit: "پایان مهلت چالش",
  manual: "لغو توسط مدیریت",
};

export const ORDER_STATUS: Record<string, Label> = {
  pending: { label: "در انتظار پرداخت", color: "warning" },
  review: { label: "در حال بررسی", color: "secondary" },
  paid: { label: "پرداخت شده", color: "success" },
  failed: { label: "ناموفق", color: "danger" },
  cancelled: { label: "لغو شده", color: "default" },
};

export const GATEWAY: Record<string, string> = {
  zarinpal: "زرین‌پال",
  crypto: "کریپتو (USDT)",
  manual: "کارت به کارت / انتقال دستی",
  mock: "درگاه آزمایشی",
};

export const PAYOUT_STATUS: Record<string, Label> = {
  pending: { label: "در انتظار بررسی", color: "warning" },
  approved: { label: "تایید شده", color: "primary" },
  paid: { label: "واریز شده", color: "success" },
  rejected: { label: "رد شده", color: "danger" },
};

export const TICKET_STATUS: Record<string, Label> = {
  open: { label: "باز", color: "warning" },
  answered: { label: "پاسخ داده شده", color: "success" },
  pending: { label: "در حال بررسی", color: "secondary" },
  closed: { label: "بسته", color: "default" },
};

export const TICKET_PRIORITY: Record<string, Label> = {
  low: { label: "کم", color: "default" },
  normal: { label: "معمولی", color: "primary" },
  high: { label: "بالا", color: "danger" },
};

export const TICKET_CATEGORY: Record<string, string> = {
  general: "عمومی",
  technical: "فنی",
  financial: "مالی",
  challenge: "چالش",
};

export const RISK: Record<string, Label> = {
  low: { label: "ریسک کم", color: "success" },
  medium: { label: "ریسک متوسط", color: "warning" },
  high: { label: "ریسک بالا", color: "danger" },
};

export const INVESTMENT_STATUS: Record<string, Label> = {
  pending: { label: "در انتظار پرداخت", color: "warning" },
  active: { label: "فعال", color: "success" },
  withdraw_requested: { label: "درخواست برداشت", color: "secondary" },
  closed: { label: "تسویه شده", color: "default" },
};

export const ROLE: Record<string, Label> = {
  user: { label: "کاربر", color: "default" },
  support: { label: "پشتیبان", color: "secondary" },
  admin: { label: "مدیر", color: "primary" },
};
