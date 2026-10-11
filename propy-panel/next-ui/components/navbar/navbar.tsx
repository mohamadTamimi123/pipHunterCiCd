"use client";

import { Button, Navbar, NavbarContent, Tooltip } from "@heroui/react";
import { ExternalLink, LifeBuoy } from "lucide-react";
import NextLink from "next/link";
import React from "react";
import { BurguerButton } from "./burguer-button";
import { UserDropdown } from "./user-dropdown";

interface Props {
  children: React.ReactNode;
}

const SITE_URL = process.env.SITE_URL || "http://localhost:3000";

export const NavbarWrapper = ({ children }: Props) => {
  return (
    <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden min-h-screen">
      <Navbar isBordered className="w-full" classNames={{ wrapper: "w-full max-w-full" }}>
        <NavbarContent className="md:hidden">
          <BurguerButton />
        </NavbarContent>
        <NavbarContent className="max-md:hidden" justify="start">
          <span className="text-sm text-default-500">به پنل پیپ‌هانتر خوش آمدید</span>
        </NavbarContent>
        <NavbarContent justify="end" className="gap-2">
          <Tooltip content="سایت پیپ‌هانتر">
            <Button as="a" href={SITE_URL} isIconOnly variant="light" size="sm" aria-label="سایت">
              <ExternalLink size={18} />
            </Button>
          </Tooltip>
          <Tooltip content="پشتیبانی">
            <Button as={NextLink} href="/tickets" isIconOnly variant="light" size="sm" aria-label="پشتیبانی">
              <LifeBuoy size={18} />
            </Button>
          </Tooltip>
          <UserDropdown />
        </NavbarContent>
      </Navbar>
      <main className="flex-1 p-4 md:p-8 max-w-[1400px] w-full mx-auto">{children}</main>
    </div>
  );
};
