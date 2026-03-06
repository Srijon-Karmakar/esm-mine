import React from "react";
import { neo } from "./neo";

export default function NeoInput({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`${neo.inset} overflow-hidden`}>
      <input
        {...props}
        className={`w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:text-slate-400 ${className}`}
      />
    </div>
  );
}