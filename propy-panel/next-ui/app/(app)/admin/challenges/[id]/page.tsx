"use client";

import { Button, Input } from "@heroui/react";
import { ArrowRight, FlaskConical } from "lucide-react";
import NextLink from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { ChallengeDetail } from "@/components/challenge/challenge-detail";
import { ErrorBox, Loading, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { usePolling } from "@/lib/use-api";

export default function AdminChallengePage() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const { data, loading, error, reload } = usePolling(`/admin/challenges/${id}`, 15000);
  const [percent, setPercent] = useState("5");
  const [days, setDays] = useState("1");
  const [busy, setBusy] = useState(false);

  const run = async (path: string, body: object, message: string) => {
    setBusy(true);
    try {
      await api(path, { method: "POST", body });
      toast.success(message);
      reload();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const actions =
    data && isAdmin && data.status === "active" ? (
      <div className="flex flex-wrap items-end gap-3 border-t border-divider pt-4">
        {data.mockBroker && (
          <>
            <div className="flex items-center gap-2 text-sm text-warning">
              <FlaskConical size={18} /> شبیه‌سازی معاملات (بروکر آزمایشی):
            </div>
            <Input size="sm" type="number" label="درصد سود/زیان" value={percent} onValueChange={setPercent} className="w-36" variant="bordered" />
            <Input size="sm" type="number" label="روز معاملاتی" value={days} onValueChange={setDays} className="w-32" variant="bordered" />
            <Button size="sm" color="warning" variant="flat" isLoading={busy} onPress={() => run(`/admin/challenges/${id}/simulate`, { percent: Number(percent), tradingDays: Number(days) }, "شبیه‌سازی اعمال شد")}>
              اعمال
            </Button>
          </>
        )}
        <Button
          size="sm"
          color="danger"
          variant="flat"
          className="ms-auto"
          isLoading={busy}
          onPress={() => confirm("چالش به‌صورت دستی رد شود؟") && run(`/admin/challenges/${id}/fail`, {}, "چالش متوقف شد")}
        >
          رد دستی چالش
        </Button>
      </div>
    ) : null;

  return (
    <>
      <PageHeader
        title={`چالش #${id}`}
        description={data?.User ? `${data.User.fullName || ""} · ${data.User.email}${data.User.phone ? ` · ${data.User.phone}` : ""}` : undefined}
        actions={
          <Button as={NextLink} href="/admin/challenges" variant="flat" startContent={<ArrowRight size={16} />}>
            بازگشت
          </Button>
        }
      />
      {loading && !data ? <Loading /> : error ? <ErrorBox message={error} onRetry={reload} /> : data && <ChallengeDetail data={{ ...data, plan: data.Plan }} adminActions={actions} />}
    </>
  );
}
