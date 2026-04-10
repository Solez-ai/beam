"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ className, error, label, ...props }: InputProps) {
  return (
    <label className="flex w-full flex-col gap-2 text-sm text-white/78">
      {label ? <span className="font-medium">{label}</span> : null}
      <input
        className={cn(
          "h-12 rounded-[1.15rem] border border-white/10 bg-[linear-gradient(180deg,rgba(36,28,48,0.95),rgba(20,17,29,0.96))] px-4 text-base text-white outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_12px_24px_rgba(0,0,0,0.25)] transition placeholder:text-white/32 focus:border-[rgba(255,140,182,0.6)] focus:ring-2 focus:ring-[rgba(255,140,182,0.18)]",
          error ? "border-red-400/55 focus:border-red-400/60 focus:ring-red-500/20" : "",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs text-rose-300">{error}</span> : null}
    </label>
  );
}

