"use client";
import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes/dist/types";
import {GoogleOAuthProvider} from "@react-oauth/google";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  return (
    <HeroUIProvider>
      <NextThemesProvider
        defaultTheme='system'
        attribute='class'
        {...themeProps}>
          <GoogleOAuthProvider clientId="10461940507-s35p7i7rqn90aq2gcctso6eae8kveevp.apps.googleusercontent.com">{children}</GoogleOAuthProvider>

      </NextThemesProvider>
    </HeroUIProvider>
  );
}
