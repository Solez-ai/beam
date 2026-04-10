"use client";

import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg" | "icon";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[linear-gradient(180deg,rgba(255,236,244,0.92),rgba(255,82,129,0.88))] text-slate-950 shadow-[0_18px_45px_rgba(255,78,125,0.3),inset_0_1px_0_rgba(255,255,255,0.9)] hover:brightness-[1.04]",
  secondary:
    "bg-[linear-gradient(180deg,rgba(40,31,53,0.96),rgba(24,20,35,0.98))] text-white shadow-[0_12px_32px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.12)] hover:border-white/15",
  ghost:
    "bg-white/6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-white/10",
  danger:
    "bg-[linear-gradient(180deg,rgba(255,147,161,0.95),rgba(239,68,68,0.9))] text-white shadow-[0_18px_38px_rgba(239,68,68,0.35),inset_0_1px_0_rgba(255,255,255,0.18)] hover:brightness-[1.04]",
};

const sizeClasses: Record<Size, string> = {
  md: "h-12 px-5 text-sm",
  lg: "h-14 px-6 text-base",
  icon: "h-12 w-12 p-0",
};

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
  }
>;

export function Button({
  children,
  className,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[1.15rem] border border-white/10 font-medium tracking-[-0.01em] transition duration-200 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

