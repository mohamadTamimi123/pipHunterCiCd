"use client";

import { Button, Divider, Input } from "@heroui/react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { api, ApiError, setToken } from "@/lib/api";
import { GoogleButton } from "./google-button";
import { OtpStep } from "./otp-step";

export const Login = () => {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  const finish = (token: string) => {
    setToken(token);
    const next = params.get("next");
    router.replace(next && next.startsWith("/") ? next : "/");
    router.refresh();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      finish(await api<string>("/auth/login", { method: "POST", body: { email, password }, auth: false }));
    } catch (err) {
      const error = err as ApiError;
      if (error.code === "NOT_VERIFIED" && error.details?.uid) {
        toast.info(error.message);
        setUid(error.details.uid);
      } else {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (uid) return <OtpStep uid={uid} email={email} onVerified={finish} onBack={() => setUid(null)} />;

  return (
    <form onSubmit={submit} className="w-full flex flex-col gap-4">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold">ورود به حساب</h2>
        <p className="text-sm text-default-500 mt-2">برای مدیریت چالش‌ها و حساب‌های فاند وارد شوید</p>
      </div>
      <Input variant="bordered" label="ایمیل" type="email" value={email} onValueChange={setEmail} isRequired classNames={{ input: "ltr text-left" }} />
      <Input
        variant="bordered"
        label="رمز عبور"
        type={show ? "text" : "password"}
        value={password}
        onValueChange={setPassword}
        isRequired
        classNames={{ input: "ltr text-left" }}
        endContent={
          <button type="button" onClick={() => setShow(!show)} className="text-default-400" aria-label="نمایش رمز">
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }
      />
      <div className="flex justify-end -mt-1">
        <Link href="/forgot-password" className="text-xs text-primary">
          رمز عبور را فراموش کرده‌اید؟
        </Link>
      </div>
      <Button type="submit" color="primary" isLoading={loading} size="lg">
        ورود
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
        حساب کاربری ندارید؟{" "}
        <Link href="/register" className="text-primary font-semibold">
          ثبت نام کنید
        </Link>
      </p>
    </form>
  );
};
