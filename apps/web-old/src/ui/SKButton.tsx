import React from "react";
import { sk } from "./skeuo";

export default function SKButton({
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={`${sk.glossyBtn} px-10 py-2.5 text-sm font-semibold ${className}`}>
      <span className="relative">
        {children}
        {/* subtle specular highlight */}
        <span className="pointer-events-none absolute -top-2 left-1/2 h-6 w-24 -translate-x-1/2 rounded-full bg-white/35 blur-md" />
      </span>
    </button>
  );
}