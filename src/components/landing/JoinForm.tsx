"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface JoinFormProps {
  roomCode: string;
  onRoomCodeChange: (value: string) => void;
  onJoin: () => void;
  error?: string;
}

export function JoinForm({
  roomCode,
  onJoin,
  onRoomCodeChange,
  error,
}: JoinFormProps) {
  return (
    <form
      className="grid gap-3 md:grid-cols-[1fr_auto]"
      onSubmit={(e) => {
        e.preventDefault();
        onJoin();
      }}
    >
      <Input
        aria-label="Room code"
        autoComplete="off"
        className="font-mono uppercase tracking-[0.28em]"
        error={error}
        maxLength={6}
        onChange={(event) => onRoomCodeChange(event.target.value)}
        placeholder="A3K7PQ"
        value={roomCode}
      />
      <Button className="w-full md:w-auto" type="submit" variant="secondary">
        Join Room
      </Button>
    </form>
  );
}

