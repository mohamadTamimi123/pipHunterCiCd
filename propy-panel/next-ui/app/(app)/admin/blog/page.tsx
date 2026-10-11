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
} from "@heroui/react";
import { ExternalLink, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { ErrorBox, Loading, PageHeader, StatusChip } from "@/components/ui";
import { api } from "@/lib/api";
import { date, num } from "@/lib/format";
import { useApi } from "@/lib/use-api";

const POST_STATUS = {
  draft: { label: "پیش‌نویس", color: "default" as const },
  published: { label: "منتشر شده", color: "success" as const },
};

const EMPTY = { title: "", slug: "", excerpt: "", content: "", coverImage: "", category: "آموزش", tags: "", status: "draft" };

export default function AdminBlogPage() {
  const { data, loading, error, reload } = useApi<any[]>("/admin/blog/posts");
  const [form, setForm] = useState<typeof EMPTY | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const open = async (id?: number) => {
    setEditId(id ?? null);
    if (!id) return setForm(EMPTY);
    try {
      const p = await api(`/admin/blog/posts/${id}`);
      setForm({ title: p.title, slug: p.slug, excerpt: p.excerpt || "", content: p.content, coverImage: p.coverImage || "", category: p.category, tags: (p.tags || []).join("، "), status: p.status });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const body = {
        ...form,
        tags: form.tags
          .split(/[,،]/)
          .map((t) => t.trim())
          .filter(Boolean),
      };
      await api(editId ? `/admin/blog/posts/${editId}` : "/admin/blog/posts", { method: editId ? "PUT" : "POST", body });
      toast.success("مقاله ذخیره شد");
      setForm(null);
      reload();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("مقاله حذف شود؟")) return;
    try {
      await api(`/admin/blog/posts/${id}`, { method: "DELETE" });
      toast.success("حذف شد");
      reload();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <PageHeader
        title="بلاگ"
        description="مقالات آموزشی و اخبار سایت (متن با فرمت Markdown)"
        actions={
          <Button color="primary" startContent={<Plus size={18} />} onPress={() => open()}>
            مقاله جدید
          </Button>
        }
      />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : (
        <Table aria-label="مقالات">
          <TableHeader>
            <TableColumn>عنوان</TableColumn>
            <TableColumn>دسته</TableColumn>
            <TableColumn>بازدید</TableColumn>
            <TableColumn>وضعیت</TableColumn>
            <TableColumn>انتشار</TableColumn>
            <TableColumn>عملیات</TableColumn>
          </TableHeader>
          <TableBody emptyContent="مقاله‌ای وجود ندارد">
            {data!.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.title}</TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell>{num(p.views)}</TableCell>
                <TableCell>
                  <StatusChip map={POST_STATUS} value={p.status} />
                </TableCell>
                <TableCell>{date(p.publishedAt)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="flat" onPress={() => open(p.id)}>
                      ویرایش
                    </Button>
                    {p.status === "published" && (
                      <Button size="sm" variant="light" isIconOnly as="a" href={`${process.env.SITE_URL}/blog/${p.slug}`} target="_blank">
                        <ExternalLink size={16} />
                      </Button>
                    )}
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

      <Modal isOpen={!!form} onClose={() => setForm(null)} size="4xl" scrollBehavior="inside" placement="center">
        <ModalContent>
          <ModalHeader>{editId ? "ویرایش مقاله" : "مقاله جدید"}</ModalHeader>
          {form && (
            <ModalBody className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="عنوان" value={form.title} onValueChange={(v) => setForm({ ...form, title: v })} variant="bordered" className="md:col-span-2" />
              <Input label="نامک (slug) - اختیاری" value={form.slug} onValueChange={(v) => setForm({ ...form, slug: v })} variant="bordered" classNames={{ input: "ltr text-left" }} />
              <Input label="دسته‌بندی" value={form.category} onValueChange={(v) => setForm({ ...form, category: v })} variant="bordered" />
              <Input label="آدرس تصویر کاور (اختیاری)" value={form.coverImage} onValueChange={(v) => setForm({ ...form, coverImage: v })} variant="bordered" classNames={{ input: "ltr text-left" }} />
              <Input label="برچسب‌ها (با ، جدا کنید)" value={form.tags} onValueChange={(v) => setForm({ ...form, tags: v })} variant="bordered" />
              <Textarea label="خلاصه" value={form.excerpt} onValueChange={(v) => setForm({ ...form, excerpt: v })} variant="bordered" className="md:col-span-2" minRows={2} />
              <Textarea
                label="متن مقاله (Markdown)"
                value={form.content}
                onValueChange={(v) => setForm({ ...form, content: v })}
                variant="bordered"
                className="md:col-span-2"
                minRows={14}
                maxRows={30}
                description="از ## برای تیتر، - برای لیست و **متن** برای پررنگ استفاده کنید."
              />
              <Select label="وضعیت" selectedKeys={[form.status]} onSelectionChange={(k) => setForm({ ...form, status: String(Array.from(k)[0]) })} variant="bordered">
                <SelectItem key="draft">پیش‌نویس</SelectItem>
                <SelectItem key="published">انتشار</SelectItem>
              </Select>
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
