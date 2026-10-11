"use client";

import { Button, Card, CardBody, CardHeader, Chip, Divider } from "@heroui/react";
import clsx from "clsx";
import { Check, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Gateway, PaymentMethodPicker, useCheckoutRedirect } from "@/components/payment/payment-method";
import { ErrorBox, InfoRow, Loading, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { num, pct, toman, usd } from "@/lib/format";
import { useApi } from "@/lib/use-api";

function BuyContent() {
  const params = useSearchParams();
  const plans = useApi<any[]>("/plans");
  const [selected, setSelected] = useState<number | null>(null);
  const [gateway, setGateway] = useState<Gateway>("zarinpal");
  const [loading, setLoading] = useState(false);
  const checkout = useCheckoutRedirect();

  useEffect(() => {
    if (!plans.data?.length || selected) return;
    const fromQuery = Number(params.get("plan"));
    const preset = plans.data.find((p) => p.id === fromQuery || p.slug === params.get("plan"));
    setSelected(preset?.id ?? plans.data.find((p) => p.isPopular)?.id ?? plans.data[0].id);
  }, [plans.data, params, selected]);

  const plan = plans.data?.find((p) => p.id === selected);

  const pay = async () => {
    if (!plan) return;
    setLoading(true);
    try {
      checkout.handle(await api("/orders/checkout", { method: "POST", body: { planId: plan.id, gateway } }));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (plans.loading) return <Loading />;
  if (plans.error) return <ErrorBox message={plans.error} onRetry={plans.reload} />;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
        {plans.data!.map((p) => (
          <Card
            key={p.id}
            isPressable
            onPress={() => setSelected(p.id)}
            shadow="sm"
            className={clsx("border-2 transition-colors text-right", selected === p.id ? "border-primary" : "border-divider hover:border-primary/40")}
          >
            <CardHeader className="flex justify-between items-start">
              <div className="flex flex-col items-start">
                <span className="text-default-500 text-sm">{p.name}</span>
                <span className="text-2xl font-bold ltr">{usd(p.accountSize).replace(".00", "")}</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                {p.isPopular && (
                  <Chip size="sm" color="primary" variant="solid">
                    محبوب
                  </Chip>
                )}
                <Chip size="sm" variant="flat">
                  {p.phases === 1 ? "تک مرحله‌ای" : "دو مرحله‌ای"}
                </Chip>
              </div>
            </CardHeader>
            <CardBody className="pt-0 flex flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <span className="text-default-500">هدف سود</span>
                <span>{p.phases === 1 ? pct(p.profitTargetPhase1) : `${pct(p.profitTargetPhase1)} / ${pct(p.profitTargetPhase2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-default-500">حد ضرر روزانه / کلی</span>
                <span>
                  {pct(p.dailyLossLimit)} / {pct(p.maxLossLimit)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-default-500">سهم سود</span>
                <span>{pct(p.profitSplit)}</span>
              </div>
              <Divider className="my-2" />
              <div className="flex justify-between items-end">
                <span className="text-default-500">هزینه چالش</span>
                <div className="flex flex-col items-end">
                  <span className="text-xl font-bold text-primary ltr">{usd(p.price)}</span>
                  <span className="text-xs text-default-400">{toman(p.priceIrr)}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {plan && (
          <Card shadow="sm" className="border border-divider sticky top-4">
            <CardHeader className="flex flex-col items-start gap-1">
              <span className="font-semibold">خلاصه سفارش</span>
              <span className="text-sm text-default-500">{plan.description}</span>
            </CardHeader>
            <CardBody className="flex flex-col gap-4">
              <div>
                <InfoRow label="پلن" value={plan.name} />
                <InfoRow label="سرمایه حساب" value={<span className="ltr">{usd(plan.accountSize)}</span>} />
                <InfoRow label="تعداد مراحل" value={num(plan.phases)} />
                <InfoRow label="حداقل روز معاملاتی" value={`${num(plan.minTradingDays)} روز`} />
                <InfoRow label="محدودیت زمانی" value={plan.maxDurationDays ? `${num(plan.maxDurationDays)} روز` : "ندارد"} />
                <InfoRow label="اهرم" value={<span className="ltr">1:{plan.leverage}</span>} />
              </div>
              <ul className="flex flex-col gap-2">
                {(plan.features || []).map((f: string) => (
                  <li key={f} className="flex gap-2 text-sm text-default-600">
                    <Check size={16} className="text-success shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Divider />
              <span className="text-sm font-semibold">روش پرداخت</span>
              <PaymentMethodPicker value={gateway} onChange={setGateway} />
              <div className="flex justify-between items-center">
                <span className="text-default-500">مبلغ قابل پرداخت</span>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-bold text-primary ltr">{usd(plan.price)}</span>
                  {gateway !== "crypto" && <span className="text-xs text-default-400">{toman(plan.priceIrr)}</span>}
                </div>
              </div>
              <Button color="primary" size="lg" isLoading={loading} onPress={pay}>
                پرداخت و شروع چالش
              </Button>
              <p className="text-xs text-default-400 flex gap-2">
                <ShieldCheck size={16} className="shrink-0" />
                پس از تایید پرداخت، حساب معاملاتی شما به‌صورت خودکار روی بروکر Pivot Market ساخته و اطلاعات ورود ایمیل می‌شود.
              </p>
            </CardBody>
          </Card>
        )}
      </div>
      {checkout.modal}
    </div>
  );
}

export default function BuyPage() {
  return (
    <>
      <PageHeader title="خرید چالش" description="سرمایه مورد نظر را انتخاب کنید؛ هر چه حساب بزرگ‌تر، سهم سود بزرگ‌تر" />
      <Suspense fallback={<Loading />}>
        <BuyContent />
      </Suspense>
    </>
  );
}
