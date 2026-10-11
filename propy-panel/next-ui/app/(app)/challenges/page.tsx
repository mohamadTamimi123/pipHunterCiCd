"use client";

import { Button, Tab, Tabs } from "@heroui/react";
import { Trophy } from "lucide-react";
import NextLink from "next/link";
import { useState } from "react";
import { EmptyState, ErrorBox, Loading, PageHeader } from "@/components/ui";
import { useApi } from "@/lib/use-api";
import { ChallengeCard } from "@/components/challenge/challenge-card";

export default function ChallengesPage() {
  const { data, loading, error, reload } = useApi<any[]>("/challenges");
  const [tab, setTab] = useState("active");

  const filtered = (data || []).filter((c) =>
    tab === "active" ? c.status === "active" && c.stage !== "funded" : tab === "funded" ? c.status === "active" && c.stage === "funded" : c.status === "failed",
  );

  return (
    <>
      <PageHeader
        title="چالش‌های من"
        description="وضعیت لحظه‌ای چالش‌ها و حساب‌های فاند شما"
        actions={
          <Button as={NextLink} href="/buy" color="primary" startContent={<Trophy size={18} />}>
            خرید چالش
          </Button>
        }
      />
      <Tabs selectedKey={tab} onSelectionChange={(k) => setTab(String(k))} className="mb-4" color="primary" variant="underlined">
        <Tab key="active" title="در حال ارزیابی" />
        <Tab key="funded" title="حساب‌های فاند" />
        <Tab key="failed" title="ناموفق" />
      </Tabs>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : filtered.length === 0 ? (
        <EmptyState title="موردی برای نمایش وجود ندارد" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <ChallengeCard key={c.id} challenge={c} />
          ))}
        </div>
      )}
    </>
  );
}
