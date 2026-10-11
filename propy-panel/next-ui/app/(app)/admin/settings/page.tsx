"use client";

import { Button, Card, CardBody, CardHeader, Input, Switch } from "@heroui/react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ErrorBox, Loading, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { toman } from "@/lib/format";
import { useApi } from "@/lib/use-api";

export default function AdminSettingsPage() {
  const { data, loading, error, reload } = useApi("/admin/settings");
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = async () => {
    setSaving(true);
    try {
      setForm(await api("/admin/settings", { method: "PUT", body: { ...form, usdToIrr: Number(form.usdToIrr) } }));
      toast.success("تنظیمات ذخیره شد");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || (!form && !error)) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const field = (key: string, label: string, ltr = true) => (
    <Input label={label} value={form[key] ?? ""} onValueChange={(v) => setForm({ ...form, [key]: v })} variant="bordered" classNames={ltr ? { input: "ltr text-left" } : undefined} />
  );

  return (
    <>
      <PageHeader
        title="تنظیمات"
        actions={
          <Button color="primary" isLoading={saving} onPress={save}>
            ذخیره تنظیمات
          </Button>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card shadow="sm" className="border border-divider">
          <CardHeader className="font-semibold">پرداخت</CardHeader>
          <CardBody className="flex flex-col gap-4">
            <Input
              type="number"
              label="نرخ دلار (ریال)"
              description={`هر دلار = ${toman(form.usdToIrr)} · مبنای محاسبه پرداخت ریالی`}
              value={String(form.usdToIrr)}
              onValueChange={(v) => setForm({ ...form, usdToIrr: v })}
              variant="bordered"
              classNames={{ input: "ltr text-left" }}
            />
            <div className="flex flex-col gap-3">
              <span className="text-sm text-default-500">درگاه‌های فعال</span>
              {[
                ["zarinpal", "زرین‌پال (ریالی)"],
                ["crypto", "NOWPayments (کریپتو)"],
                ["manual", "انتقال دستی / کارت به کارت"],
              ].map(([key, label]) => (
                <Switch key={key} isSelected={form.gateways?.[key]} onValueChange={(v) => setForm({ ...form, gateways: { ...form.gateways, [key]: v } })}>
                  {label}
                </Switch>
              ))}
            </div>
            {field("manualUsdtWallet", "آدرس کیف پول USDT برای پرداخت دستی")}
            {field("manualCardNumber", "شماره کارت برای کارت به کارت")}
          </CardBody>
        </Card>
        <Card shadow="sm" className="border border-divider">
          <CardHeader className="font-semibold">راه‌های ارتباطی (نمایش در سایت)</CardHeader>
          <CardBody className="flex flex-col gap-4">
            {field("supportEmail", "ایمیل پشتیبانی")}
            {field("supportPhone", "تلفن پشتیبانی")}
            {field("telegram", "آیدی تلگرام")}
            {field("instagram", "آیدی اینستاگرام")}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
