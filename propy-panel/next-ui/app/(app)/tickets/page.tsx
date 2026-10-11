"use client";

import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Textarea,
  useDisclosure,
} from "@heroui/react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { EmptyState, ErrorBox, Loading, PageHeader, StatusChip } from "@/components/ui";
import { api } from "@/lib/api";
import { TICKET_CATEGORY, TICKET_PRIORITY, TICKET_STATUS, date } from "@/lib/format";
import { useApi } from "@/lib/use-api";

export default function TicketsPage() {
  const router = useRouter();
  const { data, loading, error, reload } = useApi<any[]>("/tickets");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [form, setForm] = useState({ subject: "", category: "general", priority: "normal", message: "" });
  const [sending, setSending] = useState(false);

  const create = async () => {
    setSending(true);
    try {
      const ticket = await api("/tickets", { method: "POST", body: form });
      toast.success("تیکت ثبت شد");
      onClose();
      setForm({ subject: "", category: "general", priority: "normal", message: "" });
      router.push(`/tickets/${ticket.id}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeader
        title="پشتیبانی"
        description="سوال یا مشکلی دارید؟ تیکت ثبت کنید؛ تیم پشتیبانی در کوتاه‌ترین زمان پاسخ می‌دهد."
        actions={
          <Button color="primary" startContent={<Plus size={18} />} onPress={onOpen}>
            تیکت جدید
          </Button>
        }
      />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : !data?.length ? (
        <EmptyState title="تیکتی ثبت نکرده‌اید" />
      ) : (
        <Table aria-label="تیکت‌ها" selectionMode="none" onRowAction={(key) => router.push(`/tickets/${key}`)}>
          <TableHeader>
            <TableColumn>شماره</TableColumn>
            <TableColumn>عنوان</TableColumn>
            <TableColumn>دسته</TableColumn>
            <TableColumn>اولویت</TableColumn>
            <TableColumn>وضعیت</TableColumn>
            <TableColumn>آخرین بروزرسانی</TableColumn>
          </TableHeader>
          <TableBody>
            {data.map((t) => (
              <TableRow key={t.id} className="cursor-pointer">
                <TableCell>#{t.id}</TableCell>
                <TableCell>{t.subject}</TableCell>
                <TableCell>{TICKET_CATEGORY[t.category]}</TableCell>
                <TableCell>
                  <StatusChip map={TICKET_PRIORITY} value={t.priority} />
                </TableCell>
                <TableCell>
                  <StatusChip map={TICKET_STATUS} value={t.status} />
                </TableCell>
                <TableCell>{date(t.lastMessageAt, true)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="xl" placement="center">
        <ModalContent>
          <ModalHeader>ثبت تیکت جدید</ModalHeader>
          <ModalBody className="flex flex-col gap-4">
            <Input label="عنوان" value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })} variant="bordered" />
            <div className="grid grid-cols-2 gap-3">
              <Select label="دسته‌بندی" selectedKeys={[form.category]} onSelectionChange={(k) => setForm({ ...form, category: String(Array.from(k)[0]) })} variant="bordered">
                {Object.entries(TICKET_CATEGORY).map(([k, v]) => (
                  <SelectItem key={k}>{v}</SelectItem>
                ))}
              </Select>
              <Select label="اولویت" selectedKeys={[form.priority]} onSelectionChange={(k) => setForm({ ...form, priority: String(Array.from(k)[0]) })} variant="bordered">
                {Object.entries(TICKET_PRIORITY).map(([k, v]) => (
                  <SelectItem key={k}>{v.label}</SelectItem>
                ))}
              </Select>
            </div>
            <Textarea label="متن پیام" value={form.message} onValueChange={(v) => setForm({ ...form, message: v })} minRows={5} variant="bordered" />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              انصراف
            </Button>
            <Button color="primary" isLoading={sending} isDisabled={form.subject.length < 3 || form.message.length < 5} onPress={create}>
              ثبت تیکت
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
