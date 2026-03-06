import React from "react";
import { sk } from "./skeuo";

export default function SKInput({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`${sk.insetField} overflow-hidden`}>
      {/* top shine line */}
      <div className="h-px w-full bg-white/70" />
      <input
        {...props}
        className={`w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:text-slate-400 ${className}`}
      />
    </div>
  );
}