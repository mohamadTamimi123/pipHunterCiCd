"use client";

import { Button, Card, CardBody } from "@heroui/react";
import { ArrowLeft, LifeBuoy, PiggyBank, Trophy, Wallet, XCircle } from "lucide-react";
import NextLink from "next/link";
import { ChallengeCard } from "@/components/challenge/challenge-card";
import { EmptyState, ErrorBox, Loading, PageHeader, StatCard } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { usd } from "@/lib/format";
import { useApi } from "@/lib/use-api";

export default function DashboardPage() {
  const { user } = useAuth();
  const stats = useApi("/dashboard");
  const challenges = useApi<any[]>("/challenges");

  const active = (challenges.data || []).filter((c) => c.status === "active");

  return (
    <>
      <PageHeader
        title={`سلام${user?.fullName ? `، ${user.fullName}` : ""} 👋`}
        description="خلاصه وضعیت حساب‌ها و چالش‌های شما"
        actions={
          <Button as={NextLink} href="/buy" color="primary" startContent={<Trophy size={18} />}>
            خرید چالش جدید
          </Button>
        }
      />

      {stats.error ? (
        <ErrorBox message={stats.error} onRetry={stats.reload} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <StatCard label="چالش‌های در جریان" value={stats.data?.activeChallenges ?? "—"} icon={<Trophy size={22} />} />
          <StatCard label="حساب‌های فاند" value={stats.data?.fundedAccounts ?? "—"} icon={<Wallet size={22} />} tone="success" />
          <StatCard label="مجموع سود دریافتی" value={stats.data ? usd(stats.data.totalPaidOut) : "—"} icon={<PiggyBank size={22} />} tone="secondary" hint={stats.data?.pendingPayouts ? `${stats.data.pendingPayouts} درخواست در جریان` : undefined} />
          <StatCard label="تیکت‌های باز" value={stats.data?.openTickets ?? "—"} icon={<LifeBuoy size={22} />} tone="warning" />
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">حساب‌های فعال</h2>
        <Button as={NextLink} href="/challenges" variant="light" size="sm" endContent={<ArrowLeft size={16} />}>
          همه چالش‌ها
        </Button>
      </div>

      {challenges.loading ? (
        <Loading />
      ) : active.length === 0 ? (
        <EmptyState
          title="هنوز چالش فعالی ندارید"
          description="با خرید اولین چالش، حساب معاملاتی شما روی بروکر Pivot Market ساخته می‌شود و می‌توانید ارزیابی را شروع کنید."
          action={
            <Button as={NextLink} href="/buy" color="primary">
              مشاهده پلن‌ها
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {active.map((c) => (
            <ChallengeCard key={c.id} challenge={c} />
          ))}
        </div>
      )}

      {stats.data?.failedChallenges > 0 && (
        <Card className="mt-6 border border-divider" shadow="none">
          <CardBody className="flex flex-row items-center gap-3 text-sm text-default-500">
            <XCircle size={18} className="text-danger" />
            {stats.data.failedChallenges} چالش ناموفق داشته‌اید. بررسی دلایل در صفحه چالش‌ها به شما کمک می‌کند دفعه بعد موفق شوید.
          </CardBody>
        </Card>
      )}
    </>
  );
}
