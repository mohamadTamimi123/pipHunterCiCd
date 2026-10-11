"use client";

import { Button, Popover, PopoverContent, PopoverTrigger, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "react-toastify";
import { Filters, Pager, qs } from "@/components/ui/admin-table";
import { ErrorBox, Loading, PageHeader, StatusChip } from "@/components/ui";
import { api } from "@/lib/api";
import { GATEWAY, ORDER_STATUS, date, toman, usd } from "@/lib/format";
import { useApi } from "@/lib/use-api";

function OrdersTable() {
  const params = useSearchParams();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(params.get("status") || "");
  const { data, loading, error, reload } = useApi(`/admin/orders${qs({ page, status })}`);

  const act = async (id: number, action: "approve" | "reject") => {
    const note = action === "reject" ? prompt("دلیل رد (اختیاری):") ?? undefined : undefined;
    if (action === "approve" && !confirm(`پرداخت سفارش #${id} تایید شود؟`)) return;
    try {
      await api(`/admin/orders/${id}/${action}`, { method: "POST", body: { note } });
      toast.success(action === "approve" ? "سفارش تایید و فعال شد" : "سفارش رد شد");
      reload();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <Filters status={status} onStatus={(v) => (setStatus(v), setPage(1))} statuses={ORDER_STATUS} />
      {loading && !data ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : (
        <>
          <Table aria-label="سفارش‌ها">
            <TableHeader>
              <TableColumn>#</TableColumn>
              <TableColumn>کاربر</TableColumn>
              <TableColumn>شرح</TableColumn>
              <TableColumn>مبلغ</TableColumn>
              <TableColumn>درگاه</TableColumn>
              <TableColumn>رسید / پیگیری</TableColumn>
              <TableColumn>وضعیت</TableColumn>
              <TableColumn>تاریخ</TableColumn>
              <TableColumn>عملیات</TableColumn>
            </TableHeader>
            <TableBody emptyContent="سفارشی یافت نشد">
              {data.items.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell>{o.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{o.User?.fullName || "—"}</span>
                      <span className="text-xs text-default-400">{o.User?.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{o.title}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="ltr text-right">{usd(o.amountUsd)}</span>
                      {o.amountIrr ? <span className="text-xs text-default-400">{toman(o.amountIrr)}</span> : null}
                    </div>
                  </TableCell>
                  <TableCell>{GATEWAY[o.gateway] || o.gateway}</TableCell>
                  <TableCell>
                    {o.receipt ? (
                      <Popover placement="bottom">
                        <PopoverTrigger>
                          <Button size="sm" variant="light">
                            مشاهده رسید
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="max-w-sm p-3 text-sm whitespace-pre-wrap">{o.receipt}</PopoverContent>
                      </Popover>
                    ) : (
                      <span className="text-xs text-default-400 ltr">{o.gatewayTrackId || o.gatewayRef || "—"}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusChip map={ORDER_STATUS} value={o.status} />
                  </TableCell>
                  <TableCell>{date(o.createdAt, true)}</TableCell>
                  <TableCell>
                    {["pending", "review"].includes(o.status) && (
                      <div className="flex gap-1">
                        <Button size="sm" color="success" variant="flat" onPress={() => act(o.id, "approve")}>
                          تایید
                        </Button>
                        <Button size="sm" color="danger" variant="light" onPress={() => act(o.id, "reject")}>
                          رد
                        </Button>
                      </div>
                    )}
                  </TableCell>
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

export default function AdminOrdersPage() {
  return (
    <>
      <PageHeader title="سفارش‌ها و پرداخت‌ها" description="تایید پرداخت‌های دستی و پیگیری تراکنش‌ها" />
      <Suspense fallback={<Loading />}>
        <OrdersTable />
      </Suspense>
    </>
  );
}
