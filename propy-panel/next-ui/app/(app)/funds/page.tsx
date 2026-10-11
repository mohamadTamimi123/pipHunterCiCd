"use client";

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Progress,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { Gateway, PaymentMethodPicker, useCheckoutRedirect } from "@/components/payment/payment-method";
import { EmptyState, ErrorBox, InfoRow, Loading, PageHeader, StatusChip } from "@/components/ui";
import { api } from "@/lib/api";
import { INVESTMENT_STATUS, RISK, date, num, pct, usd } from "@/lib/format";
import { useApi } from "@/lib/use-api";

export default function FundsPage() {
  const funds = useApi<any[]>("/funds");
  const investments = useApi<any[]>("/investments");
  const [fund, setFund] = useState<any | null>(null);
  const [amount, setAmount] = useState("");
  const [gateway, setGateway] = useState<Gateway>("zarinpal");
  const [loading, setLoading] = useState(false);
  const checkout = useCheckoutRedirect();

  const invest = async () => {
    setLoading(true);
    try {
      const result = await api(`/funds/${fund.id}/invest`, { method: "POST", body: { amount: Number(amount), gateway } });
      setFund(null);
      checkout.handle(result);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const withdraw = async (id: number) => {
    try {
      await api(`/investments/${id}/withdraw`, { method: "POST" });
      toast.success("درخواست برداشت ثبت شد");
      investments.reload();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <PageHeader title="صندوق‌های سرمایه‌گذاری" description="سرمایه خود را به تیم معامله‌گران حرفه‌ای پیپ‌هانتر بسپارید" />

      <Card className="mb-6 border border-warning/40 bg-warning/5" shadow="none">
        <CardBody className="flex flex-row gap-3 text-sm text-default-600 leading-7">
          <AlertTriangle className="text-warning shrink-0 mt-1" size={18} />
          بازده‌های ذکر شده پیش‌بینی بر اساس عملکرد گذشته است و تضمینی برای سود آینده نیست. سرمایه‌گذاری در بازارهای مالی همراه با ریسک از دست رفتن بخشی یا تمام سرمایه است.
        </CardBody>
      </Card>

      {funds.loading ? (
        <Loading />
      ) : funds.error ? (
        <ErrorBox message={funds.error} onRetry={funds.reload} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
          {funds.data!.map((f) => {
            const fill = Number(f.capacity) > 0 ? (Number(f.raised) / Number(f.capacity)) * 100 : 0;
            return (
              <Card key={f.id} shadow="sm" className="border border-divider">
                <CardHeader className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="font-bold text-lg">{f.name}</span>
                    <span className="text-xs text-default-500">{f.strategy}</span>
                  </div>
                  <StatusChip map={RISK} value={f.riskLevel} />
                </CardHeader>
                <CardBody className="flex flex-col gap-3">
                  <p className="text-sm text-default-500 leading-7">{f.description}</p>
                  <div>
                    <InfoRow label="بازده ماهانه پیش‌بینی" value={<span className="text-success">{pct(f.expectedMonthlyReturn)}</span>} />
                    <InfoRow label="حداقل سرمایه‌گذاری" value={<span className="ltr">{usd(f.minInvestment)}</span>} />
                    <InfoRow label="دوره قفل" value={`${num(f.lockDays)} روز`} />
                    <InfoRow label="کارمزد مدیریت / عملکرد" value={`${pct(f.managementFee)} / ${pct(f.performanceFee)}`} />
                  </div>
                  {Number(f.capacity) > 0 && (
                    <div>
                      <div className="flex justify-between text-xs text-default-500 mb-1">
                        <span>ظرفیت تکمیل شده</span>
                        <span className="ltr">
                          {usd(f.raised)} / {usd(f.capacity)}
                        </span>
                      </div>
                      <Progress aria-label="ظرفیت" size="sm" value={fill} color="primary" />
                    </div>
                  )}
                </CardBody>
                <CardFooter>
                  <Button
                    fullWidth
                    color="primary"
                    isDisabled={f.status !== "open"}
                    onPress={() => {
                      setFund(f);
                      setAmount(String(f.minInvestment));
                    }}
                  >
                    {f.status === "open" ? "سرمایه‌گذاری" : "ظرفیت تکمیل"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <h2 className="text-lg font-semibold mb-3">سرمایه‌گذاری‌های من</h2>
      {investments.loading ? (
        <Loading />
      ) : !investments.data?.length ? (
        <EmptyState title="هنوز سرمایه‌گذاری فعالی ندارید" />
      ) : (
        <Table aria-label="سرمایه‌گذاری‌ها">
          <TableHeader>
            <TableColumn>صندوق</TableColumn>
            <TableColumn>مبلغ</TableColumn>
            <TableColumn>ارزش فعلی</TableColumn>
            <TableColumn>شروع</TableColumn>
            <TableColumn>سررسید</TableColumn>
            <TableColumn>وضعیت</TableColumn>
            <TableColumn>عملیات</TableColumn>
          </TableHeader>
          <TableBody>
            {investments.data.map((i) => (
              <TableRow key={i.id}>
                <TableCell>{i.Fund?.name}</TableCell>
                <TableCell className="ltr text-right">{usd(i.amount)}</TableCell>
                <TableCell className={`ltr text-right ${i.currentValue >= i.amount ? "text-success" : "text-danger"}`}>{usd(i.currentValue)}</TableCell>
                <TableCell>{date(i.startedAt)}</TableCell>
                <TableCell>{date(i.maturesAt)}</TableCell>
                <TableCell>
                  <StatusChip map={INVESTMENT_STATUS} value={i.status} />
                </TableCell>
                <TableCell>
                  {i.status === "active" && (
                    <Button size="sm" variant="flat" isDisabled={new Date(i.maturesAt) > new Date()} onPress={() => withdraw(i.id)}>
                      درخواست برداشت
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal isOpen={!!fund} onClose={() => setFund(null)} placement="center" size="lg">
        <ModalContent>
          <ModalHeader>سرمایه‌گذاری در {fund?.name}</ModalHeader>
          <ModalBody className="flex flex-col gap-4">
            <Input
              type="number"
              label="مبلغ (دلار)"
              description={fund ? `حداقل ${usd(fund.minInvestment)}` : undefined}
              value={amount}
              onValueChange={setAmount}
              variant="bordered"
              classNames={{ input: "ltr text-left" }}
            />
            <PaymentMethodPicker value={gateway} onChange={setGateway} />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setFund(null)}>
              انصراف
            </Button>
            <Button color="primary" isLoading={loading} isDisabled={!fund || Number(amount) < Number(fund.minInvestment)} onPress={invest}>
              پرداخت
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      {checkout.modal}
    </>
  );
}
