"use client";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useRouter } from "next/navigation";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const content = GOOGLE_CLIENT_ID ? <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{children}</GoogleOAuthProvider> : children;
  return (
    <HeroUIProvider navigate={router.push} locale="fa-IR">
      <NextThemesProvider defaultTheme="dark" attribute="class">
        {content}
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
