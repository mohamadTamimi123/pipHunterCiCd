"use client";

import { Button, InputOtp } from "@heroui/react";
import { useState } from "react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";

export function OtpStep({ uid, email, onVerified, onBack }: { uid: string; email: string; onVerified: (token: string) => void; onBack: () => void }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      onVerified(await api<string>("/auth/otp", { method: "POST", body: { uid, code }, auth: false }));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      await api("/auth/resend-otp", { method: "POST", body: { uid }, auth: false });
      toast.success("کد جدید ارسال شد");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-5">
      <h2 className="text-2xl font-bold">تایید ایمیل</h2>
      <p className="text-sm text-default-500 text-center leading-7">
        کد ۴ رقمی ارسال شده به <span className="ltr inline-block text-foreground">{email}</span> را وارد کنید.
      </p>
      <div className="ltr">
        <InputOtp length={4} value={code} onValueChange={setCode} size="lg" autoFocus onComplete={() => undefined} />
      </div>
      <Button color="primary" fullWidth isLoading={loading} isDisabled={code.length !== 4} onPress={submit}>
        تایید و ورود
      </Button>
      <div className="flex justify-between w-full text-sm">
        <button className="text-default-500 hover:text-foreground" onClick={onBack}>
          بازگشت
        </button>
        <button className="text-primary disabled:opacity-50" disabled={resending} onClick={resend}>
          ارسال مجدد کد
        </button>
      </div>
    </div>
  );
}
