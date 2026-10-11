import { CheckCircle2 } from "lucide-react";
import { Logo } from "../brand/logo";

interface Props {
  children: React.ReactNode;
}

const points = ["تا ۱۰۰٬۰۰۰ دلار سرمایه معاملاتی", "تا ۸۰٪ سهم سود برای معامله‌گر", "اتصال به بروکر Pivot Market", "پشتیبانی فارسی و برداشت سریع"];

export const AuthLayoutWrapper = ({ children }: Props) => {
  return (
    <div className="flex min-h-screen">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md flex flex-col items-center">
          <Logo size={44} className="mb-8" />
          {children}
        </div>
      </div>

      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center p-12 bg-gradient-to-br from-[#1a0f0a] via-[#0F1624] to-[#080D17]">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/30 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-pink-600/20 blur-[120px]" />
        <div className="relative z-10 max-w-md text-white">
          <h1 className="text-4xl font-bold leading-tight">
            سرمایه از ما،
            <br />
            <span className="text-primary">مهارت از شما</span>
          </h1>
          <p className="mt-5 text-white/70 leading-8">
            در چالش پیپ‌هانتر مهارت معامله‌گری خود را ثابت کنید و حساب فاند واقعی بگیرید. بدون ریسک سرمایه شخصی، فقط با هزینه ثبت‌نام چالش.
          </p>
          <ul className="mt-8 flex flex-col gap-3">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-3 text-white/85">
                <CheckCircle2 className="text-primary shrink-0" size={20} />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
