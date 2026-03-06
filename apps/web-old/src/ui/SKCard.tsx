import React from "react";
import { sk } from "./skeuo";

export default function SKCard({
  children,
  className = "",
  variant = "light",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "light" | "dark";
}) {
  const base = variant === "dark" ? sk.panelDark : sk.panel;
  return <div className={`${base} ${className}`}>{children}</div>;
}