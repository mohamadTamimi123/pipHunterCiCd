"use client";

import { Button, Snippet, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { useState } from "react";
import { toast } from "react-toastify";
import { Filters, qs } from "@/components/ui/admin-table";
import { ErrorBox, Loading, PageHeader, StatusChip } from "@/components/ui";
import { api } from "@/lib/api";
import { PAYOUT_STATUS, date, usd } from "@/lib/format";
import { useApi } from "@/lib/use-api";

export default function AdminPayoutsPage() {
  const [status, setStatus] = useState("");
  const { data, loading, error, reload } = useApi<any[]>(`/admin/payouts${qs({ status })}`);

  const act = async (id: number, action: "approve" | "paid" | "reject") => {
    let note: string | undefined;
    if (action === "reject") note = prompt("دلیل رد درخواست:") ?? undefined;
    else if (action === "paid") note = prompt("شناسه تراکنش واریز (اختیاری):") ?? undefined;
    else if (!confirm("با تایید، سود از حساب فاند کسر می‌شود. ادامه می‌دهید؟")) return;
    try {
      await api(`/admin/payouts/${id}/${action}`, { method: "POST", body: { note } });
      toast.success("انجام شد");
      reload();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <PageHeader title="درخواست‌های برداشت سود" description="تایید: کسر سود از حساب فاند · واریز شد: ثبت پرداخت به معامله‌گر" />
      <Filters status={status} onStatus={setStatus} statuses={PAYOUT_STATUS} />
      {loading && !data ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : (
        <Table aria-label="برداشت‌ها">
          <TableHeader>
            <TableColumn>#</TableColumn>
            <TableColumn>کاربر</TableColumn>
            <TableColumn>حساب</TableColumn>
            <TableColumn>سود کل / سهم کاربر</TableColumn>
            <TableColumn>مقصد</TableColumn>
            <TableColumn>وضعیت</TableColumn>
            <TableColumn>تاریخ</TableColumn>
            <TableColumn>عملیات</TableColumn>
          </TableHeader>
          <TableBody emptyContent="درخواستی وجود ندارد">
            {data!.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.id}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{p.User?.fullName || "—"}</span>
                    <span className="text-xs text-default-400">{p.User?.email}</span>
                  </div>
                </TableCell>
                <TableCell className="ltr text-right font-mono">{p.TradingAccount?.login}</TableCell>
                <TableCell>
                  <span className="ltr inline-block">{usd(p.profit)}</span> / <b className="ltr inline-block text-success">{usd(p.amount)}</b>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-default-500">{p.method === "usdt" ? "USDT (TRC20)" : "کارت بانکی"}</span>
                    <Snippet size="sm" symbol="" variant="flat" className="ltr max-w-[220px]" classNames={{ pre: "truncate" }}>
                      {p.destination}
                    </Snippet>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusChip map={PAYOUT_STATUS} value={p.status} />
                  {p.adminNote && <p className="text-xs text-default-400 mt-1">{p.adminNote}</p>}
                </TableCell>
                <TableCell>{date(p.createdAt, true)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {p.status === "pending" && (
                      <>
                        <Button size="sm" color="primary" variant="flat" onPress={() => act(p.id, "approve")}>
                          تایید
                        </Button>
                        <Button size="sm" color="danger" variant="light" onPress={() => act(p.id, "reject")}>
                          رد
                        </Button>
                      </>
                    )}
                    {p.status === "approved" && (
                      <Button size="sm" color="success" variant="flat" onPress={() => act(p.id, "paid")}>
                        واریز شد
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
