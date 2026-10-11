"use client";

import { Button, Card, CardBody, CardHeader, Chip, Input } from "@heroui/react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Loading, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ROLE, date } from "@/lib/format";

export default function ProfilePage() {
  const { user, loading, refresh } = useAuth();
  const [profile, setProfile] = useState({ fullName: "", phone: "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    if (user) setProfile({ fullName: user.fullName || "", phone: user.phone || "" });
  }, [user]);

  if (loading || !user) return <Loading />;

  const save = async () => {
    setSaving(true);
    try {
      await api("/auth/profile", { method: "PUT", body: profile });
      await refresh();
      toast.success("اطلاعات ذخیره شد");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (passwords.newPassword !== passwords.confirm) return toast.error("رمز جدید و تکرار آن یکسان نیست");
    setChanging(true);
    try {
      await api("/auth/change-password", { method: "POST", body: { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword } });
      setPasswords({ currentPassword: "", newPassword: "", confirm: "" });
      toast.success("رمز عبور تغییر کرد");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setChanging(false);
    }
  };

  return (
    <>
      <PageHeader title="حساب کاربری" description="اطلاعات شخصی و امنیت حساب" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card shadow="sm" className="border border-divider">
          <CardHeader className="flex justify-between">
            <span className="font-semibold">اطلاعات شخصی</span>
            <div className="flex gap-2">
              <Chip size="sm" variant="flat" color={ROLE[user.role].color}>
                {ROLE[user.role].label}
              </Chip>
              {user.isVerified && (
                <Chip size="sm" variant="flat" color="success">
                  ایمیل تایید شده
                </Chip>
              )}
            </div>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <Input label="ایمیل" value={user.email} isReadOnly variant="faded" classNames={{ input: "ltr text-left" }} />
            <Input label="نام و نام خانوادگی" value={profile.fullName} onValueChange={(v) => setProfile({ ...profile, fullName: v })} variant="bordered" />
            <Input label="شماره موبایل" value={profile.phone} onValueChange={(v) => setProfile({ ...profile, phone: v })} variant="bordered" classNames={{ input: "ltr text-left" }} />
            <p className="text-xs text-default-400">عضویت از {date(user.createdAt)}</p>
            <Button color="primary" isLoading={saving} onPress={save} className="self-start">
              ذخیره تغییرات
            </Button>
          </CardBody>
        </Card>

        <Card shadow="sm" className="border border-divider">
          <CardHeader className="font-semibold">تغییر رمز عبور</CardHeader>
          <CardBody className="flex flex-col gap-4">
            <Input type="password" label="رمز عبور فعلی" value={passwords.currentPassword} onValueChange={(v) => setPasswords({ ...passwords, currentPassword: v })} variant="bordered" classNames={{ input: "ltr text-left" }} />
            <Input type="password" label="رمز عبور جدید" description="حداقل ۸ کاراکتر" value={passwords.newPassword} onValueChange={(v) => setPasswords({ ...passwords, newPassword: v })} variant="bordered" classNames={{ input: "ltr text-left" }} />
            <Input type="password" label="تکرار رمز عبور جدید" value={passwords.confirm} onValueChange={(v) => setPasswords({ ...passwords, confirm: v })} variant="bordered" classNames={{ input: "ltr text-left" }} />
            <Button color="primary" variant="flat" isLoading={changing} isDisabled={!passwords.currentPassword || passwords.newPassword.length < 8} onPress={changePassword} className="self-start">
              تغییر رمز عبور
            </Button>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
