"use client";

import { Button, Card, CardBody, CardHeader, Chip } from "@heroui/react";
import { AlertCircle, Banknote, CircleDollarSign, LifeBuoy, PiggyBank, Receipt, Trophy, Users, XCircle, Zap } from "lucide-react";
import NextLink from "next/link";
import { BarsChart } from "@/components/charts/equity-chart";
import { ErrorBox, Loading, PageHeader, StatCard } from "@/components/ui";
import { num, usd } from "@/lib/format";
import { useApi } from "@/lib/use-api";

export default function AdminDashboard() {
  const { data, loading, error, reload } = useApi("/admin/stats");
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const todo = [
    { count: data.ordersToReview, label: "پرداخت دستی در انتظار تایید", href: "/admin/orders?status=review" },
    { count: data.pendingPayouts, label: "درخواست برداشت سود", href: "/admin/payouts" },
    { count: data.openTickets, label: "تیکت باز", href: "/admin/tickets" },
  ].filter((t) => t.count > 0);

  return (
    <>
      <PageHeader
        title="داشبورد مدیریت"
        description="نمای کلی کسب‌وکار پیپ‌هانتر"
        actions={
          <Chip variant="flat" color={data.brokerMode === "mock" ? "warning" : "success"}>
            بروکر: {data.brokerMode === "mock" ? "شبیه‌ساز (آزمایشی)" : "MT5 - Pivot Market"}
          </Chip>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="کاربران" value={num(data.users)} icon={<Users size={22} />} />
        <StatCard label="درآمد فروش چالش" value={usd(data.revenue)} icon={<CircleDollarSign size={22} />} tone="success" />
        <StatCard label="ورودی صندوق‌ها" value={usd(data.fundInflow)} icon={<PiggyBank size={22} />} tone="secondary" />
        <StatCard label="سود پرداخت شده" value={usd(data.paidPayouts)} icon={<Banknote size={22} />} tone="warning" />
        <StatCard label="چالش‌های فعال" value={num(data.activeChallenges)} icon={<Zap size={22} />} />
        <StatCard label="حساب‌های فاند" value={num(data.fundedAccounts)} icon={<Trophy size={22} />} tone="success" />
        <StatCard label="چالش‌های ناموفق" value={num(data.failedChallenges)} icon={<XCircle size={22} />} tone="danger" />
        <StatCard label="تیکت‌های باز" value={num(data.openTickets)} icon={<LifeBuoy size={22} />} tone="default" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card shadow="sm" className="border border-divider xl:col-span-2">
          <CardHeader className="font-semibold">درآمد روزانه (۳۰ روز اخیر)</CardHeader>
          <CardBody>{data.revenueByDay.length ? <BarsChart data={data.revenueByDay} label="درآمد (دلار)" /> : <p className="text-default-500 text-sm py-10 text-center">هنوز فروشی ثبت نشده است.</p>}</CardBody>
        </Card>
        <Card shadow="sm" className="border border-divider">
          <CardHeader className="font-semibold">کارهای در انتظار</CardHeader>
          <CardBody className="flex flex-col gap-3">
            {todo.length === 0 ? (
              <p className="text-default-500 text-sm">کار در انتظاری وجود ندارد 🎉</p>
            ) : (
              todo.map((t) => (
                <Button key={t.href} as={NextLink} href={t.href} variant="flat" className="justify-between" endContent={<Chip size="sm" color="danger">{num(t.count)}</Chip>}>
                  <span className="flex items-center gap-2">
                    {t.href.includes("orders") ? <Receipt size={16} /> : <AlertCircle size={16} />}
                    {t.label}
                  </span>
                </Button>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
