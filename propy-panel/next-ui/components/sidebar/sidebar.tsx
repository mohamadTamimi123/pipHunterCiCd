"use client";

import {
  BarChart3,
  BookOpen,
  CreditCard,
  Gauge,
  Headset,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  PiggyBank,
  Receipt,
  Settings,
  ShoppingCart,
  Swords,
  Trophy,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { usePathname } from "next/navigation";
import React from "react";
import { Logo } from "../brand/logo";
import { useSidebarContext } from "../layout/layout-context";
import { useAuth } from "@/lib/auth-context";
import { SidebarItem } from "./sidebar-item";
import { SidebarMenu } from "./sidebar-menu";
import { Sidebar } from "./sidebar.styles";

const userItems = [
  { href: "/", title: "داشبورد", icon: LayoutDashboard },
  { href: "/challenges", title: "چالش‌های من", icon: Trophy },
  { href: "/buy", title: "خرید چالش", icon: ShoppingCart },
  { href: "/payouts", title: "برداشت سود", icon: Wallet },
  { href: "/funds", title: "صندوق‌های سرمایه‌گذاری", icon: PiggyBank },
  { href: "/orders", title: "سفارش‌ها و پرداخت‌ها", icon: Receipt },
  { href: "/tickets", title: "پشتیبانی", icon: LifeBuoy },
  { href: "/profile", title: "حساب کاربری", icon: UserRound },
];

const staffItems = [
  { href: "/admin", title: "گزارش کلی", icon: BarChart3 },
  { href: "/admin/challenges", title: "مانیتورینگ چالش‌ها", icon: Gauge },
  { href: "/admin/tickets", title: "تیکت‌ها", icon: Headset },
  { href: "/admin/orders", title: "سفارش‌ها", icon: CreditCard, admin: true },
  { href: "/admin/payouts", title: "درخواست‌های برداشت", icon: Landmark, admin: true },
  { href: "/admin/plans", title: "پلن‌های چالش", icon: Swords, admin: true },
  { href: "/admin/funds", title: "صندوق‌ها", icon: PiggyBank, admin: true },
  { href: "/admin/blog", title: "بلاگ", icon: BookOpen, admin: true },
  { href: "/admin/users", title: "کاربران", icon: Users },
  { href: "/admin/settings", title: "تنظیمات", icon: Settings, admin: true },
];

const isActive = (pathname: string, href: string) => (href === "/" || href === "/admin" ? pathname === href : pathname.startsWith(href));

export const SidebarWrapper = () => {
  const pathname = usePathname();
  const { collapsed, setCollapsed } = useSidebarContext();
  const { isStaff, isAdmin } = useAuth();

  return (
    <aside className="h-screen z-[20] sticky top-0">
      {collapsed ? <div className={Sidebar.Overlay()} onClick={setCollapsed} /> : null}
      <div className={Sidebar({ collapsed })}>
        <div className={Sidebar.Header()}>
          <Logo subtitle="پنل معامله‌گران" />
        </div>
        <div className="flex flex-col justify-between h-full">
          <div className={Sidebar.Body()}>
            <SidebarMenu title="منوی کاربری">
              {userItems.map((item) => (
                <SidebarItem key={item.href} title={item.title} icon={<item.icon size={20} />} href={item.href} isActive={isActive(pathname, item.href)} />
              ))}
            </SidebarMenu>
            {isStaff && (
              <SidebarMenu title="مدیریت">
                {staffItems
                  .filter((item) => !item.admin || isAdmin)
                  .map((item) => (
                    <SidebarItem key={item.href} title={item.title} icon={<item.icon size={20} />} href={item.href} isActive={isActive(pathname, item.href)} />
                  ))}
              </SidebarMenu>
            )}
          </div>
          <div className={Sidebar.Footer()}>
            <span className="text-xs text-default-400">بروکر: Pivot Market</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
