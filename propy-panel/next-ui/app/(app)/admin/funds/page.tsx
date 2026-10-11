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
  Tab,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
  Textarea,
} from "@heroui/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { ErrorBox, Loading, PageHeader, StatusChip } from "@/components/ui";
import { api } from "@/lib/api";
import { INVESTMENT_STATUS, RISK, date, pct, usd } from "@/lib/format";
import { useApi } from "@/lib/use-api";

const EMPTY = {
  name: "",
  slug: "",
  description: "",
  strategy: "",
  riskLevel: "medium",
  minInvestment: 100,
  expectedMonthlyReturn: 3,
  lockDays: 30,
  managementFee: 2,
  performanceFee: 20,
  capacity: 0,
  status: "open",
};

const NUMERIC: [keyof typeof EMPTY, string][] = [
  ["minInvestment", "حداقل سرمایه‌گذاری ($)"],
  ["expectedMonthlyReturn", "بازده ماهانه پیش‌بینی (٪)"],
  ["lockDays", "دوره قفل (روز)"],
  ["managementFee", "کارمزد مدیریت (٪)"],
  ["performanceFee", "کارمزد عملکرد (٪)"],
  ["capacity", "ظرفیت ($، صفر = نامحدود)"],
];

function FundsTab() {
  const { data, loading, error, reload } = useApi<any[]>("/admin/funds");
  const [form, setForm] = useState<typeof EMPTY | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const open = (fund?: any) => {
    setEditId(fund?.id ?? null);
    setForm(fund ? { ...EMPTY, ...fund, description: fund.description || "", strategy: fund.strategy || "" } : EMPTY);
  };

  const save = async () => {
    setSaving(true);
    try {
      await api(editId ? `/admin/funds/${editId}` : "/admin/funds", { method: editId ? "PUT" : "POST", body: form });
      toast.success("صندوق ذخیره شد");
      setForm(null);
      reload();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button color="primary" startContent={<Plus size={18} />} onPress={() => open()}>
          صندوق جدید
        </Button>
      </div>
      <Table aria-label="صندوق‌ها">
        <TableHeader>
          <TableColumn>نام</TableColumn>
          <TableColumn>ریسک</TableColumn>
          <TableColumn>بازده ماهانه</TableColumn>
          <TableColumn>حداقل</TableColumn>
          <TableColumn>جذب شده / ظرفیت</TableColumn>
          <TableColumn>وضعیت</TableColumn>
          <TableColumn>عملیات</TableColumn>
        </TableHeader>
        <TableBody>
          {data!.map((f) => (
            <TableRow key={f.id}>
              <TableCell>{f.name}</TableCell>
              <TableCell>
                <StatusChip map={RISK} value={f.riskLevel} />
              </TableCell>
              <TableCell>{pct(f.expectedMonthlyReturn)}</TableCell>
              <TableCell className="ltr text-right">{usd(f.minInvestment)}</TableCell>
              <TableCell className="ltr text-right">
                {usd(f.raised)} / {Number(f.capacity) ? usd(f.capacity) : "∞"}
              </TableCell>
              <TableCell>{f.status === "open" ? "باز" : "بسته"}</TableCell>
              <TableCell>
                <Button size="sm" variant="flat" onPress={() => open(f)}>
                  ویرایش
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Modal isOpen={!!form} onClose={() => setForm(null)} size="2xl" scrollBehavior="inside" placement="center">
        <ModalContent>
          <ModalHeader>{editId ? "ویرایش صندوق" : "صندوق جدید"}</ModalHeader>
          {form && (
            <ModalBody className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="نام" value={form.name} onValueChange={(v) => setForm({ ...form, name: v })} variant="bordered" />
              <Input label="استراتژی" value={form.strategy} onValueChange={(v) => setForm({ ...form, strategy: v })} variant="bordered" />
              <Textarea label="توضیحات" value={form.description} onValueChange={(v) => setForm({ ...form, description: v })} variant="bordered" className="md:col-span-2" />
              <Select label="سطح ریسک" selectedKeys={[form.riskLevel]} onSelectionChange={(k) => setForm({ ...form, riskLevel: String(Array.from(k)[0]) })} variant="bordered">
                {Object.entries(RISK).map(([k, v]) => (
                  <SelectItem key={k}>{v.label}</SelectItem>
                ))}
              </Select>
              <Select label="وضعیت" selectedKeys={[form.status]} onSelectionChange={(k) => setForm({ ...form, status: String(Array.from(k)[0]) })} variant="bordered">
                <SelectItem key="open">باز (پذیرش سرمایه)</SelectItem>
                <SelectItem key="closed">بسته</SelectItem>
              </Select>
              {NUMERIC.map(([key, label]) => (
                <Input key={key} type="number" label={label} value={String(form[key])} onValueChange={(v) => setForm({ ...form, [key]: Number(v) })} variant="bordered" />
              ))}
            </ModalBody>
          )}
          <ModalFooter>
            <Button variant="flat" onPress={() => setForm(null)}>
              انصراف
            </Button>
            <Button color="primary" isLoading={saving} onPress={save}>
              ذخیره
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

function InvestmentsTab() {
  const { data, loading, error, reload } = useApi<any[]>("/admin/investments");

  const update = async (id: number, patch: object) => {
    try {
      await api(`/admin/investments/${id}`, { method: "PATCH", body: patch });
      toast.success("ذخیره شد");
      reload();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  return (
    <Table aria-label="سرمایه‌گذاری‌ها">
      <TableHeader>
        <TableColumn>#</TableColumn>
        <TableColumn>کاربر</TableColumn>
        <TableColumn>صندوق</TableColumn>
        <TableColumn>مبلغ</TableColumn>
        <TableColumn>ارزش فعلی</TableColumn>
        <TableColumn>سررسید</TableColumn>
        <TableColumn>وضعیت</TableColumn>
        <TableColumn>عملیات</TableColumn>
      </TableHeader>
      <TableBody emptyContent="سرمایه‌گذاری ثبت نشده است">
        {data!.map((i) => (
          <TableRow key={i.id}>
            <TableCell>{i.id}</TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span>{i.User?.fullName || "—"}</span>
                <span className="text-xs text-default-400">{i.User?.email}</span>
              </div>
            </TableCell>
            <TableCell>{i.Fund?.name}</TableCell>
            <TableCell className="ltr text-right">{usd(i.amount)}</TableCell>
            <TableCell>
              {i.status === "pending" || i.status === "closed" ? (
                <span className="ltr">{usd(i.currentValue)}</span>
              ) : (
                <Input
                  size="sm"
                  type="number"
                  className="w-32"
                  defaultValue={String(i.currentValue)}
                  onBlur={(e) => Number(e.target.value) !== Number(i.currentValue) && update(i.id, { currentValue: Number(e.target.value) })}
                  aria-label="ارزش فعلی"
                />
              )}
            </TableCell>
            <TableCell>{date(i.maturesAt)}</TableCell>
            <TableCell>
              <StatusChip map={INVESTMENT_STATUS} value={i.status} />
            </TableCell>
            <TableCell>
              {i.status === "withdraw_requested" && (
                <Button size="sm" color="success" variant="flat" onPress={() => confirm("تسویه انجام شد؟") && update(i.id, { status: "closed" })}>
                  تسویه شد
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function AdminFundsPage() {
  return (
    <>
      <PageHeader title="صندوق‌های سرمایه‌گذاری" description="مدیریت صندوق‌ها، بروزرسانی ارزش دارایی سرمایه‌گذاران و تسویه" />
      <Tabs aria-label="صندوق‌ها" color="primary" variant="underlined">
        <Tab key="funds" title="صندوق‌ها">
          <FundsTab />
        </Tab>
        <Tab key="investments" title="سرمایه‌گذاری‌ها">
          <InvestmentsTab />
        </Tab>
      </Tabs>
    </>
  );
}
