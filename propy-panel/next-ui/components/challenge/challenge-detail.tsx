"use client";

import { Card, CardBody, CardHeader, Chip, Snippet, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import clsx from "clsx";
import { AlertTriangle, CheckCircle2, Circle, KeyRound } from "lucide-react";
import React from "react";
import { EquityChart } from "@/components/charts/equity-chart";
import { InfoRow, RuleProgress, StatCard, StatusChip } from "@/components/ui";
import { ACCOUNT_STATUS, CHALLENGE_STATUS, FAIL_REASON, STAGE, date, num, pct, usd } from "@/lib/format";

function StageStepper({ phases, stage, failed }: { phases: number; stage: string; failed: boolean }) {
  const steps = phases >= 2 ? ["phase1", "phase2", "funded"] : ["phase1", "funded"];
  const current = steps.indexOf(stage);
  return (
    <div className="flex items-center gap-2 w-full">
      {steps.map((s, i) => {
        const done = i < current;
        const isCurrent = i === current;
        return (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2 shrink-0">
              {done ? (
                <CheckCircle2 className="text-success" size={22} />
              ) : isCurrent && failed ? (
                <AlertTriangle className="text-danger" size={22} />
              ) : (
                <Circle className={isCurrent ? "text-primary fill-primary/20" : "text-default-300"} size={22} />
              )}
              <span className={clsx("text-sm", isCurrent ? "font-semibold" : "text-default-500")}>{STAGE[s].label}</span>
            </div>
            {i < steps.length - 1 && <div className={clsx("h-0.5 flex-1 rounded", done ? "bg-success" : "bg-default-200")} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function ChallengeDetail({ data, adminActions }: { data: any; adminActions?: React.ReactNode }) {
  const rules = data.rules;
  const accounts: any[] = data.accounts || [];
  const current = accounts[accounts.length - 1];
  const p = current?.progress;
  const init = Number(current?.initialBalance || rules.accountSize);

  return (
    <div className="flex flex-col gap-6">
      <Card shadow="sm" className="border border-divider">
        <CardBody className="flex flex-col gap-5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">{data.plan?.name || rules.planName}</h2>
              <StatusChip map={STAGE} value={data.stage} />
              <StatusChip map={CHALLENGE_STATUS} value={data.status} />
            </div>
            <span className="text-sm text-default-500">شروع: {date(data.createdAt)}</span>
          </div>
          <StageStepper phases={rules.phases} stage={data.stage} failed={data.status === "failed"} />
          {data.status === "failed" && (
            <div className="flex items-center gap-2 rounded-xl bg-danger/10 text-danger p-3 text-sm">
              <AlertTriangle size={18} />
              این چالش به دلیل «{FAIL_REASON[data.failReason] || data.failReason}» در تاریخ {date(data.failedAt, true)} متوقف شد.
            </div>
          )}
          {adminActions}
        </CardBody>
      </Card>

      {current && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="بالانس" value={<span className="ltr">{usd(current.balance)}</span>} />
          <StatCard label="اکوئیتی" value={<span className="ltr">{usd(current.equity)}</span>} tone="secondary" />
          <StatCard
            label="سود / زیان بسته‌شده"
            value={<span className={clsx("ltr", p.profit >= 0 ? "text-success" : "text-danger")}>{usd(p.profit)}</span>}
            hint={<span className="ltr">{p.profitPercent}%</span>}
            tone={p.profit >= 0 ? "success" : "danger"}
          />
          <StatCard label="معاملات باز" value={num(current.openPositions)} hint={current.lastSyncedAt ? `بروزرسانی: ${date(current.lastSyncedAt, true)}` : undefined} tone="default" />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card shadow="sm" className="border border-divider xl:col-span-2">
          <CardHeader className="font-semibold">نمودار اکوئیتی و بالانس</CardHeader>
          <CardBody>
            {data.snapshots?.length > 1 ? (
              <EquityChart
                points={data.snapshots}
                initialBalance={init}
                maxLossLevel={init - p.maxLossLimitAmount}
                targetLevel={p.profitTargetAmount ? init + p.profitTargetAmount : null}
              />
            ) : (
              <p className="text-sm text-default-500 py-16 text-center">داده کافی برای رسم نمودار وجود ندارد؛ پس از اولین معاملات نمودار نمایش داده می‌شود.</p>
            )}
          </CardBody>
        </Card>

        <Card shadow="sm" className="border border-divider">
          <CardHeader className="font-semibold">قوانین {STAGE[current?.stage || data.stage]?.label}</CardHeader>
          <CardBody className="flex flex-col gap-5">
            {p && (
              <>
                {p.profitTargetAmount != null && (
                  <RuleProgress label={`هدف سود (${pct(p.profitTarget)})`} current={Math.max(0, p.profit)} limit={p.profitTargetAmount} kind="target" format={usd} />
                )}
                <RuleProgress label={`حد ضرر روزانه (${pct(rules.dailyLossLimit)})`} current={p.dailyLoss} limit={p.dailyLossLimitAmount} kind="loss" format={usd} suffix="بر اساس موجودی ابتدای روز" />
                <RuleProgress label={`حد ضرر کلی (${pct(rules.maxLossLimit)})`} current={p.totalLoss} limit={p.maxLossLimitAmount} kind="loss" format={usd} suffix="بر اساس سرمایه اولیه" />
                {current.stage !== "funded" && (
                  <RuleProgress label="حداقل روزهای معاملاتی" current={p.tradingDays} limit={Math.max(1, p.minTradingDays)} kind="days" format={(n) => num(n)} />
                )}
                <InfoRow label="محدودیت زمانی" value={p.daysLeft != null ? `${num(p.daysLeft)} روز باقی مانده` : "ندارد"} />
                <InfoRow label="سهم سود معامله‌گر" value={pct(rules.profitSplit)} />
                <InfoRow label="اهرم" value={<span className="ltr">1:{rules.leverage}</span>} />
              </>
            )}
          </CardBody>
        </Card>
      </div>

      {current && current.password && (
        <Card shadow="sm" className="border border-primary/30 bg-primary/5">
          <CardHeader className="font-semibold flex gap-2">
            <KeyRound size={18} className="text-primary" />
            اطلاعات ورود به متاتریدر ۵
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-default-500">بروکر / سرور</span>
              <Snippet symbol="" variant="flat" className="ltr">{current.server}</Snippet>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-default-500">شماره حساب (Login)</span>
              <Snippet symbol="" variant="flat" className="ltr">{current.login}</Snippet>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-default-500">رمز معامله (Master)</span>
              <Snippet symbol="" variant="flat" className="ltr">{current.password}</Snippet>
            </div>
            {current.investorPassword && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-default-500">رمز مشاهده (Investor)</span>
                <Snippet symbol="" variant="flat" className="ltr">{current.investorPassword}</Snippet>
              </div>
            )}
            <p className="text-xs text-default-500 md:col-span-2">
              متاتریدر ۵ را نصب کنید، سرور Pivot Market را جستجو کنید و با اطلاعات بالا وارد شوید. این اطلاعات را در اختیار شخص دیگری قرار ندهید.
            </p>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card shadow="sm" className="border border-divider">
          <CardHeader className="font-semibold">حساب‌های این چالش</CardHeader>
          <CardBody>
            <Table removeWrapper aria-label="حساب‌ها">
              <TableHeader>
                <TableColumn>مرحله</TableColumn>
                <TableColumn>لاگین</TableColumn>
                <TableColumn>بالانس</TableColumn>
                <TableColumn>وضعیت</TableColumn>
                <TableColumn>شروع</TableColumn>
              </TableHeader>
              <TableBody>
                {accounts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{STAGE[a.stage]?.label}</TableCell>
                    <TableCell className="ltr">{a.login}</TableCell>
                    <TableCell className="ltr">{usd(a.balance)}</TableCell>
                    <TableCell>
                      <StatusChip map={ACCOUNT_STATUS} value={a.status} />
                    </TableCell>
                    <TableCell>{date(a.startedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        <Card shadow="sm" className="border border-divider">
          <CardHeader className="font-semibold">رویدادها</CardHeader>
          <CardBody className="flex flex-col gap-3 max-h-[360px] overflow-y-auto">
            {(data.events || []).map((e: any) => (
              <div key={e.id} className="flex gap-3 items-start">
                <div className={clsx("w-2 h-2 rounded-full mt-2 shrink-0", e.type === "failed" ? "bg-danger" : e.type === "funded" || e.type === "phase_passed" ? "bg-success" : "bg-primary")} />
                <div className="flex flex-col">
                  <span className="text-sm">{e.message}</span>
                  <span className="text-xs text-default-400">{date(e.createdAt, true)}</span>
                </div>
              </div>
            ))}
            {(!data.events || data.events.length === 0) && <Chip variant="flat">رویدادی ثبت نشده</Chip>}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
