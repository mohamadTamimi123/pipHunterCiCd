import { Suspense } from "react";
import { Login } from "@/components/auth/login";

export const metadata = { title: "ورود" };

export default function LoginPage() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}
