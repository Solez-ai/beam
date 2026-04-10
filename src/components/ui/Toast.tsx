import { cn } from "@/lib/cn";
import type { ToastTone } from "@/types";

const toneClasses: Record<ToastTone, string> = {
  success: "border-emerald-400/30 bg-emerald-500/18 text-emerald-100",
  danger: "border-rose-400/30 bg-rose-500/18 text-rose-100",
  info: "border-white/12 bg-white/10 text-white",
};

export function Toast({
  message,
  tone = "info",
}: {
  message: string;
  tone?: ToastTone;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl animate-toast-in",
        toneClasses[tone],
      )}
    >
      {message}
    </div>
  );
}

