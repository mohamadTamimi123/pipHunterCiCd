"use client";

import { Avatar, Dropdown, DropdownItem, DropdownMenu, DropdownSection, DropdownTrigger, NavbarItem, Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import React from "react";
import { useAuth } from "@/lib/auth-context";
import { ROLE } from "@/lib/format";
import { DarkModeSwitch } from "./darkmodeswitch";

export const UserDropdown = () => {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  if (loading || !user) return <Spinner size="sm" />;

  return (
    <Dropdown placement="bottom-end">
      <NavbarItem>
        <DropdownTrigger>
          <Avatar as="button" color="primary" size="sm" name={(user.fullName || user.email).slice(0, 1).toUpperCase()} isBordered />
        </DropdownTrigger>
      </NavbarItem>
      <DropdownMenu aria-label="منوی کاربر" onAction={(key) => key === "profile" && router.push("/profile")}>
        <DropdownSection showDivider>
          <DropdownItem key="info" isReadOnly className="h-14 gap-2 opacity-100" textValue="info">
            <p className="font-semibold">{user.fullName || "کاربر پیپ‌هانتر"}</p>
            <p className="text-xs text-default-500 ltr text-right">{user.email}</p>
            <p className="text-xs text-primary">{ROLE[user.role]?.label}</p>
          </DropdownItem>
        </DropdownSection>
        <DropdownItem key="profile">حساب کاربری</DropdownItem>
        <DropdownItem key="theme" isReadOnly textValue="theme" endContent={<DarkModeSwitch />}>
          حالت تیره
        </DropdownItem>
        <DropdownItem key="logout" color="danger" className="text-danger" onPress={logout}>
          خروج از حساب
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};
