"use client";

import { Button } from "@heroui/react";
import { ArrowRight } from "lucide-react";
import NextLink from "next/link";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import { TicketThread } from "@/components/tickets/ticket-thread";
import { ErrorBox, Loading, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";

export default function TicketPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, reload, setData } = useApi(`/tickets/${id}`);

  const close = async () => {
    try {
      await api(`/tickets/${id}/close`, { method: "POST" });
      toast.success("تیکت بسته شد");
      reload();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <PageHeader
        title="جزئیات تیکت"
        actions={
          <Button as={NextLink} href="/tickets" variant="flat" startContent={<ArrowRight size={16} />}>
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
            viewer="user"
            replyPath={`/tickets/${id}/messages`}
            onUpdated={setData}
            headerActions={
              data.status !== "closed" && (
                <Button size="sm" variant="flat" onPress={close}>
                  بستن تیکت
                </Button>
              )
            }
          />
        )
      )}
    </>
  );
}
