"use client";

import { Select, SelectItem, Switch, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { useState } from "react";
import { toast } from "react-toastify";
import { Filters, Pager, qs } from "@/components/ui/admin-table";
import { ErrorBox, Loading, PageHeader, StatusChip } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ROLE, date } from "@/lib/format";
import { useApi } from "@/lib/use-api";

export default function AdminUsersPage() {
  const { isAdmin, user: me } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const { data, loading, error, reload } = useApi(`/admin/users${qs({ page, search, role })}`);

  const update = async (id: number, patch: object) => {
    try {
      await api(`/admin/users/${id}`, { method: "PATCH", body: patch });
      toast.success("ذخیره شد");
      reload();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <PageHeader title="کاربران" description={data ? `${data.total} کاربر` : undefined} />
      <Filters search={search} onSearch={(v) => (setSearch(v), setPage(1))} status={role} onStatus={(v) => (setRole(v), setPage(1))} statuses={ROLE} statusLabel="نقش" />
      {loading && !data ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : (
        <>
          <Table aria-label="کاربران">
            <TableHeader>
              <TableColumn>#</TableColumn>
              <TableColumn>نام</TableColumn>
              <TableColumn>ایمیل</TableColumn>
              <TableColumn>موبایل</TableColumn>
              <TableColumn>نقش</TableColumn>
              <TableColumn>تایید ایمیل</TableColumn>
              <TableColumn>فعال</TableColumn>
              <TableColumn>عضویت</TableColumn>
            </TableHeader>
            <TableBody emptyContent="کاربری یافت نشد">
              {data.items.map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell>{u.id}</TableCell>
                  <TableCell>{u.fullName || "—"}</TableCell>
                  <TableCell className="ltr text-right">{u.email}</TableCell>
                  <TableCell className="ltr text-right">{u.phone || "—"}</TableCell>
                  <TableCell>
                    {isAdmin && u.id !== me?.id ? (
                      <Select aria-label="نقش" size="sm" className="w-32" selectedKeys={[u.role]} onSelectionChange={(k) => update(u.id, { role: Array.from(k)[0] })}>
                        {Object.entries(ROLE).map(([k, v]) => (
                          <SelectItem key={k}>{v.label}</SelectItem>
                        ))}
                      </Select>
                    ) : (
                      <StatusChip map={ROLE} value={u.role} />
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch size="sm" isSelected={u.isVerified} isDisabled={!isAdmin} onValueChange={(v) => update(u.id, { isVerified: v })} />
                  </TableCell>
                  <TableCell>
                    <Switch size="sm" color="success" isSelected={u.isActive} isDisabled={!isAdmin || u.id === me?.id} onValueChange={(v) => update(u.id, { isActive: v })} />
                  </TableCell>
                  <TableCell>{date(u.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pager page={page} total={data.total} pageSize={data.pageSize} onChange={setPage} />
        </>
      )}
    </>
  );
}
