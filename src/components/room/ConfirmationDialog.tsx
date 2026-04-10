"use client";

import { Button } from "@/components/ui/Button";

interface ConfirmationDialogProps {
  body: string;
  confirmLabel: string;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  tone?: "danger" | "primary";
  title: string;
}

export function ConfirmationDialog({
  body,
  confirmLabel,
  isOpen,
  onCancel,
  onConfirm,
  title,
  tone = "primary",
}: ConfirmationDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-md">
      <div className="beam-panel w-full max-w-md rounded-[2rem] p-6">
        <div className="space-y-3">
          <h3 className="font-display text-2xl tracking-[-0.04em] text-white">{title}</h3>
          <p className="text-sm leading-6 text-white/65">{body}</p>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button onClick={onCancel} variant="ghost">
            Cancel
          </Button>
          <Button onClick={onConfirm} variant={tone === "danger" ? "danger" : "primary"}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

