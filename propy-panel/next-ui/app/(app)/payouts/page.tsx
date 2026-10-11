"use client";

import { Button, Card, CardBody, CardHeader, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { Wallet } from "lucide-react";
import NextLink from "next/link";
import { useState } from "react";
import { toast } from "react-toastify";
import { EmptyState, ErrorBox, InfoRow, Loading, PageHeader, StatusChip } from "@/components/ui";
import { api } from "@/lib/api";
import { PAYOUT_STATUS, date, pct, usd } from "@/lib/format";
import { useApi } from "@/lib/use-api";

export default function PayoutsPage() {
  const { data, loading, error, reload } = useApi<{ payouts: any[]; eligibility: any[] }>("/payouts");
  const [target, setTarget] = useState<any | null>(null);
  const [method, setMethod] = useState<"usdt" | "card">("usdt");
  const [destination, setDestination] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await api("/payouts", { method: "POST", body: { tradingAccountId: target.tradingAccountId, method, destination } });
      toast.success("درخواست برداشت ثبت شد");
      setTarget(null);
      setDestination("");
      reload();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="برداشت سود" description="درخواست برداشت سهم سود از حساب‌های فاند" />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : (
        <div className="flex flex-col gap-8">
          {data!.eligibility.length === 0 ? (
            <EmptyState
              title="هنوز حساب فاند ندارید"
              description="بعد از پاس کردن مراحل چالش، حساب فاند صادر می‌شود و می‌توانید سهم سود خود را برداشت کنید."
              action={
                <Button as={NextLink} href="/challenges" color="primary" variant="flat">
                  مشاهده چالش‌ها
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {data!.eligibility.map((e) => (
                <Card key={e.tradingAccountId} shadow="sm" className="border border-divider">
                  <CardHeader className="flex justify-between">
                    <span className="font-semibold ltr">#{e.login}</span>
                    <Wallet className="text-primary" size={20} />
                  </CardHeader>
                  <CardBody className="flex flex-col gap-3">
                    <div>
                      <InfoRow label="بالانس فعلی" value={<span className="ltr">{usd(e.balance)}</span>} />
                      <InfoRow label="سود قابل تقسیم" value={<span className="ltr">{usd(e.profit)}</span>} />
                      <InfoRow label={`سهم شما (${pct(e.profitSplit)})`} value={<span className="ltr text-success font-bold">{usd(e.amount)}</span>} />
                    </div>
                    <Button color="primary" isDisabled={!e.eligible} onPress={() => setTarget(e)}>
                      درخواست برداشت
                    </Button>
                    {e.reason && <span className="text-xs text-default-400 text-center">{e.reason}</span>}
                  </CardBody>
                </Card>
              ))}
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold mb-3">تاریخچه برداشت‌ها</h2>
            {data!.payouts.length === 0 ? (
              <EmptyState title="درخواستی ثبت نشده است" />
            ) : (
              <Table aria-label="برداشت‌ها">
                <TableHeader>
                  <TableColumn>شماره</TableColumn>
                  <TableColumn>حساب</TableColumn>
                  <TableColumn>مبلغ</TableColumn>
                  <TableColumn>روش</TableColumn>
                  <TableColumn>وضعیت</TableColumn>
                  <TableColumn>تاریخ</TableColumn>
                </TableHeader>
                <TableBody>
                  {data!.payouts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>#{p.id}</TableCell>
                      <TableCell className="ltr text-right">{p.TradingAccount?.login}</TableCell>
                      <TableCell className="ltr text-right">{usd(p.amount)}</TableCell>
                      <TableCell>{p.method === "usdt" ? "تتر (USDT)" : "کارت بانکی"}</TableCell>
                      <TableCell>
                        <StatusChip map={PAYOUT_STATUS} value={p.status} />
                        {p.adminNote && <p className="text-xs text-default-400 mt-1">{p.adminNote}</p>}
                      </TableCell>
                      <TableCell>{date(p.createdAt, true)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}

      <Modal isOpen={!!target} onClose={() => setTarget(null)} placement="center">
        <ModalContent>
          <ModalHeader>درخواست برداشت {target && usd(target.amount)}</ModalHeader>
          <ModalBody className="flex flex-col gap-4">
            <Select label="روش دریافت" selectedKeys={[method]} onSelectionChange={(k) => setMethod(Array.from(k)[0] as "usdt" | "card")} variant="bordered">
              <SelectItem key="usdt">تتر (USDT - TRC20)</SelectItem>
              <SelectItem key="card">کارت بانکی (ریالی)</SelectItem>
            </Select>
            <Input
              label={method === "usdt" ? "آدرس کیف پول TRC20" : "شماره کارت یا شبا"}
              value={destination}
              onValueChange={setDestination}
              variant="bordered"
              classNames={{ input: "ltr text-left" }}
            />
            <p className="text-xs text-default-500 leading-6">
              پس از تایید درخواست، سود از حساب فاند کسر و سرمایه حساب به مقدار اولیه برمی‌گردد. واریز معمولا ظرف ۲۴ تا ۷۲ ساعت کاری انجام می‌شود.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setTarget(null)}>
              انصراف
            </Button>
            <Button color="primary" isLoading={submitting} isDisabled={destination.trim().length < 10} onPress={submit}>
              ثبت درخواست
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
