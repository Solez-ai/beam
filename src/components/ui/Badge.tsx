import type { PropsWithChildren } from "react";
import { cn } from "@/lib/cn";

export function Badge({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/75",
        className,
      )}
    >
      {children}
    </span>
  );
}

