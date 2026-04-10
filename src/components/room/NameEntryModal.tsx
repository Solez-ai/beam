"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface NameEntryModalProps {
  initialValue: string;
  isOpen: boolean;
  onSubmit: (name: string) => boolean;
}

export function NameEntryModal({
  initialValue,
  isOpen,
  onSubmit,
}: NameEntryModalProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState("");

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-lg">
      <div className="beam-panel w-full max-w-md rounded-[2rem] p-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.32em] text-white/40">Beam room</p>
          <h2 className="font-display text-3xl tracking-[-0.04em] text-white">
            Enter your name
          </h2>
          <p className="text-sm leading-6 text-white/62">
            Beam keeps your display name in session storage so you can jump into the room without
            using query params or an account.
          </p>
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!onSubmit(value)) {
              setError("Add your name before joining the room.");
            }
          }}
        >
          <Input
            autoFocus
            error={error}
            label="Display name"
            maxLength={32}
            onChange={(event) => {
              setValue(event.target.value);
              if (error) {
                setError("");
              }
            }}
            placeholder="Your name"
            value={value}
          />
          <Button
            className="w-full"
            size="lg"
            type="submit"
          >
            Join Room
          </Button>
        </form>
      </div>
    </div>
  );
}

