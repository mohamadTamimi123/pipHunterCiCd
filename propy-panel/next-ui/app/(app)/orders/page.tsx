"use client";

import { Button, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ManualPaymentModal, CheckoutResult } from "@/components/payment/payment-method";
import { EmptyState, ErrorBox, Loading, PageHeader, StatusChip } from "@/components/ui";
import { api } from "@/lib/api";
import { GATEWAY, ORDER_STATUS, date, toman, usd } from "@/lib/format";
import { useApi } from "@/lib/use-api";

function ResultToast() {
  const params = useSearchParams();
  useEffect(() => {
    const result = params.get("result");
    const toastId = "payment-result";
    if (result === "success") toast.success("پرداخت با موفقیت انجام شد. حساب شما در حال آماده‌سازی است.", { toastId });
    else if (result === "failed") toast.error("پرداخت ناموفق بود. در صورت کسر وجه، مبلغ ظرف ۷۲ ساعت برگشت داده می‌شود.", { toastId });
    else if (result === "cancel") toast.info("پرداخت لغو شد.", { toastId });
  }, [params]);
  return null;
}

export default function OrdersPage() {
  const { data, loading, error, reload } = useApi<any[]>("/orders");
  const settings = useApi("/settings/public");
  const [manual, setManual] = useState<CheckoutResult | null>(null);

  const cancel = async (id: number) => {
    try {
      await api(`/orders/${id}/cancel`, { method: "POST" });
      toast.success("سفارش لغو شد");
      reload();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <Suspense>
        <ResultToast />
      </Suspense>
      <PageHeader title="سفارش‌ها و پرداخت‌ها" description="تاریخچه خرید چالش‌ها و سرمایه‌گذاری‌ها" />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : !data?.length ? (
        <EmptyState title="هنوز سفارشی ثبت نکرده‌اید" />
      ) : (
        <Table aria-label="سفارش‌ها" className="overflow-x-auto">
          <TableHeader>
            <TableColumn>شماره</TableColumn>
            <TableColumn>شرح</TableColumn>
            <TableColumn>مبلغ</TableColumn>
            <TableColumn>روش پرداخت</TableColumn>
            <TableColumn>وضعیت</TableColumn>
            <TableColumn>تاریخ</TableColumn>
            <TableColumn>عملیات</TableColumn>
          </TableHeader>
          <TableBody>
            {data.map((o) => (
              <TableRow key={o.id}>
                <TableCell>#{o.id}</TableCell>
                <TableCell>{o.title}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="ltr text-right">{usd(o.amountUsd)}</span>
                    {o.amountIrr ? <span className="text-xs text-default-400">{toman(o.amountIrr)}</span> : null}
                  </div>
                </TableCell>
                <TableCell>{GATEWAY[o.gateway] || o.gateway}</TableCell>
                <TableCell>
                  <StatusChip map={ORDER_STATUS} value={o.status} />
                  {o.adminNote && <p className="text-xs text-danger mt-1">{o.adminNote}</p>}
                </TableCell>
                <TableCell>{date(o.createdAt, true)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {o.gateway === "manual" && o.status === "pending" && (
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        onPress={() =>
                          setManual({
                            orderId: o.id,
                            gateway: "manual",
                            instructions: { amountUsd: o.amountUsd, amountIrr: o.amountIrr, usdtWallet: settings.data?.manualUsdtWallet ?? "", cardNumber: settings.data?.manualCardNumber ?? "" },
                          })
                        }
                      >
                        ثبت رسید
                      </Button>
                    )}
                    {o.status === "pending" && (
                      <Button size="sm" variant="light" color="danger" onPress={() => cancel(o.id)}>
                        لغو
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <ManualPaymentModal result={manual} onClose={() => setManual(null)} onSubmitted={reload} />
    </>
  );
}
