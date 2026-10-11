"use client";

import { Button, Select, SelectItem } from "@heroui/react";
import { ArrowRight } from "lucide-react";
import NextLink from "next/link";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import { TicketThread } from "@/components/tickets/ticket-thread";
import { ErrorBox, Loading, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { TICKET_STATUS } from "@/lib/format";
import { useApi } from "@/lib/use-api";

export default function AdminTicketPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, reload, setData } = useApi(`/admin/tickets/${id}`);

  const setStatus = async (status: string) => {
    try {
      await api(`/admin/tickets/${id}`, { method: "PATCH", body: { status } });
      toast.success("وضعیت تیکت تغییر کرد");
      reload();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <PageHeader
        title={`تیکت #${id}`}
        actions={
          <Button as={NextLink} href="/admin/tickets" variant="flat" startContent={<ArrowRight size={16} />}>
            بازگشت
          </Button>
        }
      />
      {loading && !data ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : (
        data && (
          <TicketThread
            ticket={data}
            viewer="staff"
            replyPath={`/admin/tickets/${id}/messages`}
            onUpdated={setData}
            headerActions={
              <Select
                aria-label="وضعیت"
                size="sm"
                className="w-40"
                selectedKeys={[data.status]}
                onSelectionChange={(k) => {
                  const v = Array.from(k)[0];
                  if (v && v !== data.status) setStatus(String(v));
                }}
              >
                {Object.entries(TICKET_STATUS).map(([k, v]) => (
                  <SelectItem key={k}>{v.label}</SelectItem>
                ))}
              </Select>
            }
          />
        )
      )}
    </>
  );
}
