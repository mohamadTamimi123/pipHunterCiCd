import React from "react";
import { useTheme as useNextTheme } from "next-themes";
import { Switch } from "@heroui/react";

export const DarkModeSwitch = () => {
  const { setTheme, resolvedTheme } = useNextTheme();
  return <Switch size="sm" aria-label="حالت تیره" isSelected={resolvedTheme === "dark"} onValueChange={(e) => setTheme(e ? "dark" : "light")} />;
};
