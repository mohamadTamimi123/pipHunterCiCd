"use client";

import { Card, CardBody, Chip, Progress, Spinner } from "@heroui/react";
import clsx from "clsx";
import { Inbox } from "lucide-react";
import React from "react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="text-default-500 text-sm mt-1">{description}</p>}
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  hint,
  tone = "primary",
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "primary" | "success" | "warning" | "danger" | "secondary" | "default";
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary/15 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-danger/15 text-danger",
    secondary: "bg-secondary/15 text-secondary",
    default: "bg-default-100 text-default-600",
  };
  return (
    <Card shadow="sm" className="border border-divider">
      <CardBody className="flex flex-row items-center gap-4 p-5">
        {icon && <div className={clsx("rounded-xl p-3", tones[tone])}>{icon}</div>}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-xs text-default-500">{label}</span>
          <span className="text-xl font-bold truncate">{value}</span>
          {hint && <span className="text-xs text-default-400">{hint}</span>}
        </div>
      </CardBody>
    </Card>
  );
}

export function StatusChip({ map, value, size = "sm" }: { map: Record<string, { label: string; color: any }>; value: string; size?: "sm" | "md" }) {
  const item = map[value] || { label: value, color: "default" };
  return (
    <Chip size={size} color={item.color} variant="flat">
      {item.label}
    </Chip>
  );
}

export function Loading({ label = "در حال بارگذاری..." }: { label?: string }) {
  return (
    <div className="flex justify-center items-center py-20">
      <Spinner label={label} color="primary" />
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="border border-danger/40 bg-danger/5">
      <CardBody className="text-danger text-sm flex flex-row items-center justify-between gap-4">
        <span>{message}</span>
        {onRetry && (
          <button className="underline" onClick={onRetry}>
            تلاش مجدد
          </button>
        )}
      </CardBody>
    </Card>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 gap-3 border border-dashed border-divider rounded-2xl">
      <Inbox className="text-default-300" size={44} />
      <p className="font-semibold">{title}</p>
      {description && <p className="text-sm text-default-500 max-w-md">{description}</p>}
      {action}
    </div>
  );
}

/** Progress toward a target (higher is better) or toward a loss limit (higher is worse). */
export function RuleProgress({
  label,
  current,
  limit,
  kind,
  format,
  suffix,
}: {
  label: string;
  current: number;
  limit: number;
  kind: "target" | "loss" | "days";
  format: (n: number) => string;
  suffix?: React.ReactNode;
}) {
  const ratio = limit > 0 ? Math.min(100, Math.max(0, (current / limit) * 100)) : 0;
  const color = kind === "loss" ? (ratio >= 80 ? "danger" : ratio >= 50 ? "warning" : "success") : ratio >= 100 ? "success" : "primary";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-sm">
        <span className="text-default-600">{label}</span>
        <span className="font-medium ltr">
          {format(current)} / {format(limit)}
        </span>
      </div>
      <Progress aria-label={label} value={ratio} color={color} size="sm" />
      {suffix && <span className="text-xs text-default-400">{suffix}</span>}
    </div>
  );
}

export function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-divider last:border-0 gap-4">
      <span className="text-sm text-default-500">{label}</span>
      <span className={clsx("text-sm font-medium", mono && "ltr font-mono")}>{value}</span>
    </div>
  );
}
