import React from "react";

interface Props {
  title: string;
  children?: React.ReactNode;
}

export const SidebarMenu = ({ title, children }: Props) => {
  return (
    <div className="flex gap-1.5 flex-col">
      <span className="text-xs font-normal text-default-400 px-2 mb-1">{title}</span>
      {children}
    </div>
  );
};
