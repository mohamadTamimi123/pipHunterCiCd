import { tv } from "@heroui/react";

export const SidebarWrapper = tv({
  base: "bg-background transition-transform h-full fixed translate-x-full right-0 w-64 shrink-0 z-[202] overflow-y-auto border-l border-divider flex-col py-6 px-3 md:flex md:static md:h-screen md:translate-x-0",
  variants: {
    collapsed: {
      true: "translate-x-0 pt-6 [display:inherit]",
    },
  },
});

export const Overlay = tv({
  base: "bg-[rgb(15_23_42/0.3)] fixed inset-0 z-[201] opacity-80 transition-opacity md:hidden md:z-auto md:opacity-100",
});

export const Header = tv({
  base: "flex gap-8 items-center px-4",
});

export const Body = tv({
  base: "flex flex-col gap-6 mt-8 px-1",
});

export const Footer = tv({
  base: "flex items-center justify-center pt-10 pb-2 px-4",
});

export const Sidebar = Object.assign(SidebarWrapper, {
  Header,
  Body,
  Overlay,
  Footer,
});
