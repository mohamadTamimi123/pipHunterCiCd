"use client";

import {
  Button,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Textarea,
} from "@heroui/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { ErrorBox, Loading, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { pct, usd } from "@/lib/format";
import { useApi } from "@/lib/use-api";

const EMPTY = {
  name: "",
  slug: "",
  description: "",
  accountSize: 10000,
  price: 69,
  phases: 2,
  profitTargetPhase1: 8,
  profitTargetPhase2: 5,
  dailyLossLimit: 5,
  maxLossLimit: 10,
  minTradingDays: 3,
  maxDurationDays: "" as number | string,
  profitSplit: 80,
  leverage: 100,
  features: "",
  isActive: true,
  isPopular: false,
  sortOrder: 0,
};

const NUMERIC: [keyof typeof EMPTY, string][] = [
  ["accountSize", "سرمایه حساب ($)"],
  ["price", "قیمت ($)"],
  ["profitTargetPhase1", "هدف سود مرحله ۱ (٪)"],
  ["profitTargetPhase2", "هدف سود مرحله ۲ (٪)"],
  ["dailyLossLimit", "حد ضرر روزانه (٪)"],
  ["maxLossLimit", "حد ضرر کلی (٪)"],
  ["minTradingDays", "حداقل روز معاملاتی"],
  ["maxDurationDays", "مهلت (روز، خالی = نامحدود)"],
  ["profitSplit", "سهم سود معامله‌گر (٪)"],
  ["leverage", "اهرم (1:x)"],
  ["sortOrder", "ترتیب نمایش"],
];

export default function AdminPlansPage() {
  const { data, loading, error, reload } = useApi<any[]>("/admin/plans");
  const [form, setForm] = useState<typeof EMPTY | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const open = (plan?: any) => {
    setEditId(plan?.id ?? null);
    setForm(plan ? { ...EMPTY, ...plan, description: plan.description || "", maxDurationDays: plan.maxDurationDays ?? "", features: (plan.features || []).join("\n") } : EMPTY);
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const body = {
        ...form,
        maxDurationDays: form.maxDurationDays === "" ? null : Number(form.maxDurationDays),
        features: String(form.features)
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      await api(editId ? `/admin/plans/${editId}` : "/admin/plans", { method: editId ? "PUT" : "POST", body });
      toast.success("پلن ذخیره شد");
      setForm(null);
      reload();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("پلن حذف شود؟ (اگر قبلا فروخته شده باشد آرشیو می‌شود)")) return;
    try {
      const res = await api<{ archived: boolean }>(`/admin/plans/${id}`, { method: "DELETE" });
      toast.success(res.archived ? "پلن آرشیو شد" : "پلن حذف شد");
      reload();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <PageHeader
        title="پلن‌های چالش"
        description="قوانین و قیمت چالش‌ها؛ تغییرات فقط روی خریدهای جدید اعمال می‌شود"
        actions={
          <Button color="primary" startContent={<Plus size={18} />} onPress={() => open()}>
            پلن جدید
          </Button>
        }
      />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : (
        <Table aria-label="پلن‌ها">
          <TableHeader>
            <TableColumn>نام</TableColumn>
            <TableColumn>سرمایه</TableColumn>
            <TableColumn>قیمت</TableColumn>
            <TableColumn>مراحل</TableColumn>
            <TableColumn>هدف سود</TableColumn>
            <TableColumn>ضرر روزانه / کلی</TableColumn>
            <TableColumn>سهم سود</TableColumn>
            <TableColumn>وضعیت</TableColumn>
            <TableColumn>عملیات</TableColumn>
          </TableHeader>
          <TableBody>
            {data!.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  {p.name} {p.isPopular && <Chip size="sm" color="primary" variant="flat">محبوب</Chip>}
                </TableCell>
                <TableCell className="ltr text-right">{usd(p.accountSize)}</TableCell>
                <TableCell className="ltr text-right">{usd(p.price)}</TableCell>
                <TableCell>{p.phases}</TableCell>
                <TableCell>{p.phases === 1 ? pct(p.profitTargetPhase1) : `${pct(p.profitTargetPhase1)} / ${pct(p.profitTargetPhase2)}`}</TableCell>
                <TableCell>
                  {pct(p.dailyLossLimit)} / {pct(p.maxLossLimit)}
                </TableCell>
                <TableCell>{pct(p.profitSplit)}</TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat" color={p.isActive ? "success" : "default"}>
                    {p.isActive ? "فعال" : "غیرفعال"}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="flat" onPress={() => open(p)}>
                      ویرایش
                    </Button>
                    <Button size="sm" variant="light" color="danger" onPress={() => remove(p.id)}>
                      حذف
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal isOpen={!!form} onClose={() => setForm(null)} size="3xl" scrollBehavior="inside" placement="center">
        <ModalContent>
          <ModalHeader>{editId ? "ویرایش پلن" : "پلن جدید"}</ModalHeader>
          {form && (
            <ModalBody className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input label="نام" value={form.name} onValueChange={(v) => setForm({ ...form, name: v })} variant="bordered" className="md:col-span-2" />
              <Select label="تعداد مراحل" selectedKeys={[String(form.phases)]} onSelectionChange={(k) => setForm({ ...form, phases: Number(Array.from(k)[0]) })} variant="bordered">
                <SelectItem key="1">تک مرحله‌ای</SelectItem>
                <SelectItem key="2">دو مرحله‌ای</SelectItem>
              </Select>
              <Textarea label="توضیحات" value={form.description} onValueChange={(v) => setForm({ ...form, description: v })} variant="bordered" className="md:col-span-3" minRows={2} />
              {NUMERIC.filter(([k]) => !(k === "profitTargetPhase2" && form.phases === 1)).map(([key, label]) => (
                <Input key={key} type="number" label={label} value={String(form[key])} onValueChange={(v) => setForm({ ...form, [key]: key === "maxDurationDays" ? v : Number(v) })} variant="bordered" />
              ))}
              <Textarea label="ویژگی‌ها (هر خط یک مورد)" value={String(form.features)} onValueChange={(v) => setForm({ ...form, features: v })} variant="bordered" className="md:col-span-3" minRows={3} />
              <div className="flex gap-6 md:col-span-3">
                <Switch isSelected={form.isActive} onValueChange={(v) => setForm({ ...form, isActive: v })}>
                  فعال
                </Switch>
                <Switch isSelected={form.isPopular} onValueChange={(v) => setForm({ ...form, isPopular: v })}>
                  نمایش به عنوان محبوب
                </Switch>
              </div>
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
