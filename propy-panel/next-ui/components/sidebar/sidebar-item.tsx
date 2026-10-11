import NextLink from "next/link";
import React from "react";
import { useSidebarContext } from "../layout/layout-context";
import clsx from "clsx";

interface Props {
  title: string;
  icon: React.ReactNode;
  isActive?: boolean;
  href: string;
}

export const SidebarItem = ({ icon, title, isActive, href }: Props) => {
  const { collapsed, setCollapsed } = useSidebarContext();

  const handleClick = () => {
    if (collapsed && window.innerWidth < 768) {
      setCollapsed();
    }
  };
  return (
    <NextLink href={href} className="text-default-900 active:bg-none max-w-full" onClick={handleClick}>
      <div
        className={clsx(
          isActive ? "bg-primary/15 text-primary" : "hover:bg-default-100 text-default-700",
          "flex gap-3 w-full min-h-[42px] h-full items-center px-3.5 rounded-xl cursor-pointer transition-all duration-150 active:scale-[0.98]",
        )}
      >
        {icon}
        <span className="text-sm">{title}</span>
      </div>
    </NextLink>
  );
};
