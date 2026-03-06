import React from "react";
import { neo } from "./neo";

export default function NeoButton({
  children,
  className = "",
  variant = "ghost",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "ghost" | "primary";
}) {
  const base = variant === "primary" ? neo.btnPrimary : neo.btn;
  return (
    <button
      {...props}
      className={`${base} px-4 py-2 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}