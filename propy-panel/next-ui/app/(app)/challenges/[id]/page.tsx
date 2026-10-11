"use client";

import { Button } from "@heroui/react";
import { ArrowRight } from "lucide-react";
import NextLink from "next/link";
import { useParams } from "next/navigation";
import { ChallengeDetail } from "@/components/challenge/challenge-detail";
import { ErrorBox, Loading, PageHeader } from "@/components/ui";
import { usePolling } from "@/lib/use-api";

export default function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, reload } = usePolling(`/challenges/${id}`, 15000);

  return (
    <>
      <PageHeader
        title={`چالش #${id}`}
        description="اطلاعات حساب، قوانین و وضعیت لحظه‌ای"
        actions={
          <Button as={NextLink} href="/challenges" variant="flat" startContent={<ArrowRight size={16} />}>
            بازگشت
          </Button>
        }
      />
      {loading && !data ? <Loading /> : error && !data ? <ErrorBox message={error} onRetry={reload} /> : data && <ChallengeDetail data={data} />}
    </>
  );
}
