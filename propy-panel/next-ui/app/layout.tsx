import "@/styles/globals.css";
import "react-toastify/dist/ReactToastify.css";
import type { Metadata } from "next";
import clsx from "clsx";
import { ToastContainer } from "react-toastify";
import { kalameFont } from "@/config/fonts";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: { default: "پنل پیپ‌هانتر", template: "%s | پنل پیپ‌هانتر" },
  description: "پنل معامله‌گران پیپ‌هانتر: مدیریت چالش‌ها، حساب‌های فاند، برداشت سود و پشتیبانی",
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className={clsx("antialiased", kalameFont.variable)}>
        <Providers>
          <ToastContainer position="bottom-left" autoClose={4000} rtl theme="dark" />
          {children}
        </Providers>
      </body>
    </html>
  );
}
