"use client";

import { Button, Checkbox, Divider, Input } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { api, setToken } from "@/lib/api";
import { GoogleButton } from "./google-button";
import { OtpStep } from "./otp-step";

const SITE_URL = process.env.SITE_URL || "http://localhost:3000";

export const Register = () => {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const finish = (token: string) => {
    setToken(token);
    toast.success("به پیپ‌هانتر خوش آمدید!");
    router.replace("/buy");
    router.refresh();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error("رمز عبور باید حداقل ۸ کاراکتر باشد");
    if (form.password !== form.confirm) return toast.error("رمز عبور و تکرار آن یکسان نیست");
    if (!accepted) return toast.error("لطفا قوانین و مقررات را بپذیرید");
    setLoading(true);
    try {
      const res = await api<{ uid: string }>("/auth/register", {
        method: "POST",
        body: { fullName: form.fullName, email: form.email, password: form.password },
        auth: false,
      });
      toast.success("کد تایید به ایمیل شما ارسال شد");
      setUid(res.uid);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (uid) return <OtpStep uid={uid} email={form.email} onVerified={finish} onBack={() => setUid(null)} />;

  return (
    <form onSubmit={submit} className="w-full flex flex-col gap-4">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold">ایجاد حساب کاربری</h2>
        <p className="text-sm text-default-500 mt-2">در کمتر از یک دقیقه ثبت نام کنید و اولین چالش خود را شروع کنید</p>
      </div>
      <Input variant="bordered" label="نام و نام خانوادگی" value={form.fullName} onValueChange={set("fullName")} isRequired />
      <Input variant="bordered" label="ایمیل" type="email" value={form.email} onValueChange={set("email")} isRequired classNames={{ input: "ltr text-left" }} />
      <Input variant="bordered" label="رمز عبور" description="حداقل ۸ کاراکتر" type="password" value={form.password} onValueChange={set("password")} isRequired classNames={{ input: "ltr text-left" }} />
      <Input variant="bordered" label="تکرار رمز عبور" type="password" value={form.confirm} onValueChange={set("confirm")} isRequired classNames={{ input: "ltr text-left" }} />
      <Checkbox size="sm" isSelected={accepted} onValueChange={setAccepted}>
        <span className="text-sm">
          <a href={`${SITE_URL}/terms`} target="_blank" className="text-primary">
            قوانین و مقررات
          </a>{" "}
          پیپ‌هانتر را مطالعه کرده‌ام و می‌پذیرم
        </span>
      </Checkbox>
      <Button type="submit" color="primary" isLoading={loading} size="lg">
        ثبت نام
      </Button>
      {process.env.GOOGLE_CLIENT_ID && (
        <>
          <div className="flex items-center gap-3 my-1">
            <Divider className="flex-1" />
            <span className="text-xs text-default-400">یا</span>
            <Divider className="flex-1" />
          </div>
          <GoogleButton onToken={finish} />
        </>
      )}
      <p className="text-center text-sm text-default-500 mt-2">
        قبلا ثبت نام کرده‌اید؟{" "}
        <Link href="/login" className="text-primary font-semibold">
          وارد شوید
        </Link>
      </p>
    </form>
  );
};
