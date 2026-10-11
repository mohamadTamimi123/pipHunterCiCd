"use client";

import { Button, Card, CardBody, Chip, Textarea } from "@heroui/react";
import clsx from "clsx";
import { Send } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { StatusChip } from "@/components/ui";
import { api } from "@/lib/api";
import { TICKET_CATEGORY, TICKET_PRIORITY, TICKET_STATUS, date } from "@/lib/format";

export function TicketThread({ ticket, replyPath, onUpdated, viewer, headerActions }: { ticket: any; replyPath: string; onUpdated: (t: any) => void; viewer: "user" | "staff"; headerActions?: React.ReactNode }) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    try {
      onUpdated(await api(replyPath, { method: "POST", body: { body } }));
      setBody("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card shadow="sm" className="border border-divider">
        <CardBody className="flex flex-wrap flex-row items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-lg">{ticket.subject}</span>
            <span className="text-xs text-default-500">
              تیکت #{ticket.id} · {TICKET_CATEGORY[ticket.category]} · {date(ticket.createdAt, true)}
              {viewer === "staff" && ticket.User && ` · ${ticket.User.fullName || ""} (${ticket.User.email})`}
            </span>
          </div>
          <div className="flex gap-2 items-center">
            <StatusChip map={TICKET_PRIORITY} value={ticket.priority} />
            <StatusChip map={TICKET_STATUS} value={ticket.status} />
            {headerActions}
          </div>
        </CardBody>
      </Card>

      <div className="flex flex-col gap-3">
        {ticket.messages.map((m: any) => {
          const mine = viewer === "staff" ? m.isStaff : !m.isStaff;
          return (
            <div key={m.id} className={clsx("flex", mine ? "justify-start" : "justify-end")}>
              <div className={clsx("max-w-[80%] rounded-2xl px-4 py-3", mine ? "bg-primary/15 rounded-tr-sm" : "bg-content2 rounded-tl-sm")}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold">{m.isStaff ? "پشتیبانی پیپ‌هانتر" : m.author?.fullName || m.author?.email}</span>
                  {m.isStaff && viewer === "user" && (
                    <Chip size="sm" color="primary" variant="flat" className="h-5">
                      پشتیبان
                    </Chip>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap leading-7">{m.body}</p>
                <span className="text-[11px] text-default-400 block mt-1">{date(m.createdAt, true)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {ticket.status !== "closed" ? (
        <Card shadow="sm" className="border border-divider">
          <CardBody className="flex flex-col gap-3">
            <Textarea placeholder="پاسخ خود را بنویسید..." value={body} onValueChange={setBody} minRows={3} variant="bordered" />
            <div className="flex justify-end">
              <Button color="primary" isLoading={sending} isDisabled={!body.trim()} onPress={send} endContent={<Send size={16} />}>
                ارسال پاسخ
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <p className="text-center text-sm text-default-500">این تیکت بسته شده است.</p>
      )}
    </div>
  );
}
