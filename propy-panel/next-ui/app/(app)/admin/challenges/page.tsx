"use client";

import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Filters, Pager, qs } from "@/components/ui/admin-table";
import { ErrorBox, Loading, PageHeader, StatusChip } from "@/components/ui";
import { CHALLENGE_STATUS, STAGE, date, pct, usd } from "@/lib/format";
import { useApi } from "@/lib/use-api";

export default function AdminChallengesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [stage, setStage] = useState("");
  const { data, loading, error, reload } = useApi(`/admin/challenges${qs({ page, status, stage })}`);

  return (
    <>
      <PageHeader title="چالش‌ها و حساب‌ها" description="پایش لحظه‌ای حساب‌های معاملاتی کاربران روی بروکر" />
      <div className="flex flex-wrap gap-3">
        <Filters status={status} onStatus={(v) => (setStatus(v), setPage(1))} statuses={CHALLENGE_STATUS} />
        <Filters status={stage} onStatus={(v) => (setStage(v), setPage(1))} statuses={STAGE} statusLabel="مرحله" />
      </div>
      {loading && !data ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : (
        <>
          <Table aria-label="چالش‌ها" selectionMode="none" onRowAction={(k) => router.push(`/admin/challenges/${k}`)}>
            <TableHeader>
              <TableColumn>#</TableColumn>
              <TableColumn>کاربر</TableColumn>
              <TableColumn>پلن</TableColumn>
              <TableColumn>مرحله</TableColumn>
              <TableColumn>لاگین</TableColumn>
              <TableColumn>اکوییتی</TableColumn>
              <TableColumn>سود / زیان</TableColumn>
              <TableColumn>وضعیت</TableColumn>
              <TableColumn>تاریخ</TableColumn>
            </TableHeader>
            <TableBody emptyContent="چالشی یافت نشد">
              {data.items.map((c: any) => (
                <TableRow key={c.id} className="cursor-pointer">
                  <TableCell>{c.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{c.user?.fullName || "—"}</span>
                      <span className="text-xs text-default-400 ltr text-right">{c.user?.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{c.plan?.name}</TableCell>
                  <TableCell>
                    <StatusChip map={STAGE} value={c.stage} />
                  </TableCell>
                  <TableCell className="ltr text-right font-mono">{c.account?.login}</TableCell>
                  <TableCell className="ltr text-right">{usd(c.account?.equity)}</TableCell>
                  <TableCell className={c.account?.progress?.profit >= 0 ? "text-success" : "text-danger"}>{c.account ? pct(c.account.progress.profitPercent) : "—"}</TableCell>
                  <TableCell>
                    <StatusChip map={CHALLENGE_STATUS} value={c.status} />
                  </TableCell>
                  <TableCell>{date(c.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pager page={page} total={data.total} pageSize={data.pageSize} onChange={setPage} />
        </>
      )}
    </>
  );
}
