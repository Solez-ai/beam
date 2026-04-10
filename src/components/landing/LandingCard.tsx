"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { JoinForm } from "@/components/landing/JoinForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { generateRoomCode, sanitizeRoomCode, validateRoomCode } from "@/lib/generateRoomCode";
import { getStoredDisplayName, setStoredDisplayName } from "@/lib/session";
import { siteConfig } from "@/lib/site";
import { useBeamStore } from "@/store/useBeamStore";

export function LandingCard() {
  const router = useRouter();
  const storedName = useBeamStore((state) => state.displayName);
  const setDisplayName = useBeamStore((state) => state.setDisplayName);
  const [joinCode, setJoinCode] = useState("");
  const [nameError, setNameError] = useState("");
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    if (!storedName) {
      const sessionName = getStoredDisplayName();
      if (sessionName) {
        setDisplayName(sessionName);
      }
    }
  }, [setDisplayName, storedName]);

  function persistName() {
    const trimmed = storedName.trim();

    if (!trimmed) {
      setNameError("Add your name before creating or joining a room.");
      return "";
    }

    setNameError("");
    setStoredDisplayName(trimmed);
    return trimmed;
  }

  function handleCreateRoom() {
    if (!persistName()) {
      return;
    }

    router.push(`/room/${generateRoomCode()}`);
  }

  function handleJoinRoom() {
    if (!persistName()) {
      return;
    }

    const nextCode = sanitizeRoomCode(joinCode);
    setJoinCode(nextCode);

    if (!validateRoomCode(nextCode)) {
      setJoinError("Enter a valid 6-character room code.");
      return;
    }

    setJoinError("");
    router.push(`/room/${nextCode}`);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,143,178,0.32),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(129,86,255,0.14),transparent_26%),linear-gradient(180deg,#120e1a_0%,#09070d_48%,#06050a_100%)] px-4 py-8 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_30%,transparent_60%,rgba(255,255,255,0.02)_100%)]" />
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center gap-12 lg:flex-row lg:items-center lg:justify-between">
        <section className="max-w-2xl space-y-6">
          <Badge className="bg-white/10 text-pink-100">Instant peer-to-peer calls</Badge>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="rounded-[2rem] border border-white/12 bg-white/8 p-3 shadow-[0_24px_80px_rgba(255,72,124,0.25),inset_0_1px_0_rgba(255,255,255,0.2)]">
                <Image alt="Beam logo" height={88} priority src="/logo.png" width={88} />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.32em] text-white/50">Beam</p>
                <h1 className="font-display text-5xl tracking-[-0.05em] text-white sm:text-6xl">
                  Call in seconds.
                </h1>
              </div>
            </div>
            <p className="max-w-xl text-lg leading-8 text-white/68">
              Zero accounts, zero friction, and just enough control to run a clean call.
              Beam is built for fast rooms, stable WebRTC handshakes, and a tactile claymorphic
              interface shaped around your logo.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-white/60">
            <span className="rounded-full border border-white/10 bg-white/6 px-4 py-2">
              Full mesh WebRTC
            </span>
            <span className="rounded-full border border-white/10 bg-white/6 px-4 py-2">
              Host controls
            </span>
            <span className="rounded-full border border-white/10 bg-white/6 px-4 py-2">
              Screen sharing
            </span>
          </div>
        </section>

        <section className="w-full max-w-[28rem] rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(31,26,42,0.92),rgba(16,12,23,0.95))] p-6 shadow-[0_28px_100px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-xl sm:p-8">
          <div className="mb-6 space-y-2">
            <p className="text-sm uppercase tracking-[0.32em] text-white/44">Start meeting</p>
            <h2 className="font-display text-3xl tracking-[-0.04em]">Create or join a room</h2>
            <p className="text-sm leading-6 text-white/58">
              Your display name stays local in session storage and follows you into the room.
            </p>
          </div>

          <div className="space-y-5">
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateRoom();
              }}
            >
              <Input
                error={nameError}
                label="Display name"
                maxLength={32}
                onChange={(event) => {
                  setDisplayName(event.target.value);
                  if (nameError) {
                    setNameError("");
                  }
                }}
                placeholder="Samin"
                value={storedName}
              />

              <Button className="w-full" size="lg" type="submit">
                Create Room
              </Button>
            </form>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs uppercase tracking-[0.3em] text-white/38">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <JoinForm
              error={joinError}
              onJoin={handleJoinRoom}
              onRoomCodeChange={(value) => {
                setJoinCode(sanitizeRoomCode(value));
                if (joinError) {
                  setJoinError("");
                }
              }}
              roomCode={joinCode}
            />
          </div>

          <footer className="mt-8 border-t border-white/8 pt-5 text-sm text-white/55">
            Built by{" "}
            <a
              className="text-pink-200 transition hover:text-pink-100"
              href={siteConfig.creator.github}
              rel="noreferrer"
              target="_blank"
            >
              {siteConfig.creator.name}
            </a>
            . Explore the{" "}
            <a
              className="text-pink-200 transition hover:text-pink-100"
              href={siteConfig.repositoryUrl}
              rel="noreferrer"
              target="_blank"
            >
              GitHub repository
            </a>{" "}
            or visit the{" "}
            <a
              className="text-pink-200 transition hover:text-pink-100"
              href={siteConfig.creator.portfolio}
              rel="noreferrer"
              target="_blank"
            >
              portfolio
            </a>
            .
          </footer>
        </section>
      </div>
    </main>
  );
}

