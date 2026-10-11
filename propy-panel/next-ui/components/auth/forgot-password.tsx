"use client";

import { Button, Input } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { api, setToken } from "@/lib/api";

export const ForgotPassword = () => {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api("/auth/forgot-password", { method: "POST", body: { email }, auth: false });
      toast.success("اگر این ایمیل ثبت شده باشد، کد بازیابی ارسال شد");
      setStep("reset");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      setToken(await api<string>("/auth/reset-password", { method: "POST", body: { email, code, password }, auth: false }));
      toast.success("رمز عبور تغییر کرد");
      router.replace("/");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={step === "email" ? requestCode : reset} className="w-full flex flex-col gap-4">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold">بازیابی رمز عبور</h2>
        <p className="text-sm text-default-500 mt-2">
          {step === "email" ? "ایمیل حساب خود را وارد کنید تا کد بازیابی برایتان ارسال شود" : "کد ارسال شده و رمز عبور جدید را وارد کنید"}
        </p>
      </div>
      <Input variant="bordered" label="ایمیل" type="email" value={email} onValueChange={setEmail} isRequired isDisabled={step === "reset"} classNames={{ input: "ltr text-left" }} />
      {step === "reset" && (
        <>
          <Input variant="bordered" label="کد تایید" value={code} onValueChange={setCode} isRequired classNames={{ input: "ltr text-left tracking-[0.5em]" }} />
          <Input variant="bordered" label="رمز عبور جدید" description="حداقل ۸ کاراکتر" type="password" value={password} onValueChange={setPassword} isRequired classNames={{ input: "ltr text-left" }} />
        </>
      )}
      <Button type="submit" color="primary" isLoading={loading} size="lg">
        {step === "email" ? "ارسال کد" : "تغییر رمز و ورود"}
      </Button>
      <p className="text-center text-sm text-default-500 mt-2">
        <Link href="/login" className="text-primary">
          بازگشت به صفحه ورود
        </Link>
      </p>
    </form>
  );
};
