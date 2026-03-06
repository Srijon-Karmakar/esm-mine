import React from "react";
import { neo } from "./neo";

export default function NeoCard({
  children,
  className = "",
  size = "md",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "md" | "sm";
}) {
  const base = size === "sm" ? neo.cardSm : neo.card;
  return <div className={`${base} ${className}`}>{children}</div>;
}