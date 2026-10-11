"use client";

import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Filters, qs } from "@/components/ui/admin-table";
import { ErrorBox, Loading, PageHeader, StatusChip } from "@/components/ui";
import { TICKET_CATEGORY, TICKET_PRIORITY, TICKET_STATUS, date } from "@/lib/format";
import { useApi } from "@/lib/use-api";

export default function AdminTicketsPage() {
  const router = useRouter();
  const [status, setStatus] = useState("open");
  const { data, loading, error, reload } = useApi<any[]>(`/admin/tickets${qs({ status })}`);

  return (
    <>
      <PageHeader title="تیکت‌های پشتیبانی" />
      <Filters status={status} onStatus={setStatus} statuses={TICKET_STATUS} />
      {loading && !data ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : (
        <Table aria-label="تیکت‌ها" selectionMode="none" onRowAction={(k) => router.push(`/admin/tickets/${k}`)}>
          <TableHeader>
            <TableColumn>#</TableColumn>
            <TableColumn>کاربر</TableColumn>
            <TableColumn>عنوان</TableColumn>
            <TableColumn>دسته</TableColumn>
            <TableColumn>اولویت</TableColumn>
            <TableColumn>وضعیت</TableColumn>
            <TableColumn>آخرین پیام</TableColumn>
          </TableHeader>
          <TableBody emptyContent="تیکتی وجود ندارد">
            {data!.map((t) => (
              <TableRow key={t.id} className="cursor-pointer">
                <TableCell>{t.id}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{t.User?.fullName || "—"}</span>
                    <span className="text-xs text-default-400">{t.User?.email}</span>
                  </div>
                </TableCell>
                <TableCell>{t.subject}</TableCell>
                <TableCell>{TICKET_CATEGORY[t.category]}</TableCell>
                <TableCell>
                  <StatusChip map={TICKET_PRIORITY} value={t.priority} />
                </TableCell>
                <TableCell>
                  <StatusChip map={TICKET_STATUS} value={t.status} />
                </TableCell>
                <TableCell>{date(t.lastMessageAt, true)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
