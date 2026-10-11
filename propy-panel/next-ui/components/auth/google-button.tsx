"use client";

import { GoogleLogin } from "@react-oauth/google";
import { toast } from "react-toastify";
import { api } from "@/lib/api";

export function GoogleButton({ onToken }: { onToken: (token: string) => void }) {
  if (!process.env.GOOGLE_CLIENT_ID) return null;
  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        theme="filled_black"
        shape="pill"
        text="continue_with"
        onSuccess={async (res) => {
          if (!res.credential) return toast.error("ورود با گوگل ناموفق بود");
          try {
            onToken(await api<string>("/auth-google/google", { method: "POST", body: { cred: res.credential }, auth: false }));
          } catch (e: any) {
            toast.error(e.message);
          }
        }}
        onError={() => toast.error("ورود با گوگل ناموفق بود")}
      />
    </div>
  );
}
