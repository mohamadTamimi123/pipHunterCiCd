import clsx from "clsx";

export const LogoMark = ({ size = 36, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="ph-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF9A4D" />
        <stop offset="1" stopColor="#F2416B" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="13" fill="url(#ph-grad)" />
    <circle cx="24" cy="24" r="11.5" stroke="#fff" strokeWidth="2.4" opacity="0.95" />
    <path d="M24 7.5v6M24 34.5v6M7.5 24h6M34.5 24h6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M17.5 28.5l4.5-4.5 3.5 3 6-7" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M27.5 20h4v4" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Logo = ({ size = 36, className, subtitle }: { size?: number; className?: string; subtitle?: string }) => (
  <div className={clsx("flex items-center gap-2.5", className)}>
    <LogoMark size={size} />
    <div className="flex flex-col leading-tight ltr text-left">
      <span className="font-bold text-lg tracking-tight text-foreground">
        Pip<span className="text-primary">Hunter</span>
      </span>
      {subtitle && <span className="text-[11px] text-default-500 rtl text-right">{subtitle}</span>}
    </div>
  </div>
);
