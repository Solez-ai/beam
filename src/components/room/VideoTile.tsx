"use client";

import { useEffect, useRef } from "react";
import type { Participant } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CrownIcon, MicOffIcon, ScreenShareIcon, UsersIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

interface VideoTileProps {
  onOpenActions?: (participant: Participant) => void;
  participant: Participant;
  showManageButton?: boolean;
}

export function VideoTile({
  onOpenActions,
  participant,
  showManageButton = false,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const longPressTimerRef = useRef<number | null>(null);

  const trackCount = participant.stream?.getTracks().length;

  useEffect(() => {
    if (!videoRef.current || !participant.stream) {
      return;
    }

    if (videoRef.current.srcObject !== participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream, trackCount]);

  function clearLongPress() {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  const showVideo = Boolean(participant.stream && participant.videoEnabled);

  return (
    <article
      className={cn(
        "beam-grid-glow group relative overflow-hidden rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(34,28,49,0.95),rgba(13,11,20,0.98))] shadow-[0_24px_80px_rgba(0,0,0,0.35)] animate-tile-in",
        participant.isLocal ? "order-last" : "",
      )}
      onPointerDown={() => {
        if (!showManageButton || !onOpenActions) {
          return;
        }

        longPressTimerRef.current = window.setTimeout(() => {
          onOpenActions(participant);
        }, 450);
      }}
      onPointerLeave={clearLongPress}
      onPointerUp={clearLongPress}
    >
      <video
        autoPlay
        className={cn(
          "h-full min-h-[14rem] w-full object-cover",
          !showVideo ? "hidden" : ""
        )}
        muted={participant.isLocal}
        playsInline
        ref={videoRef}
      />
      {!showVideo ? (
        <div className="flex min-h-[14rem] h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,151,188,0.18),transparent_30%),linear-gradient(180deg,rgba(19,15,29,1),rgba(7,6,12,1))]">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/8 text-3xl font-semibold text-pink-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
            {participant.displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.0),rgba(0,0,0,0.5))]" />

      <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
        {participant.isHost ? (
          <Badge className="bg-pink-500/20 text-pink-100">
            <CrownIcon className="mr-1 h-3 w-3" />
            Host
          </Badge>
        ) : null}
        {participant.isSharingScreen ? (
          <Badge className="bg-sky-400/18 text-sky-100">
            <ScreenShareIcon className="mr-1 h-3 w-3" />
            Sharing screen
          </Badge>
        ) : null}
      </div>

      {showManageButton && onOpenActions ? (
        <div className="absolute right-4 top-4 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
          <Button onClick={() => onOpenActions(participant)} variant="ghost">
            <UsersIcon className="h-4 w-4" />
            Manage
          </Button>
        </div>
      ) : null}

      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-base font-medium text-white">
            {participant.displayName}
            {participant.isLocal ? " (You)" : ""}
          </p>
          <p className="text-sm text-white/54 capitalize">{participant.connectionState}</p>
        </div>
        {!participant.audioEnabled ? (
          <div className="rounded-full bg-amber-400/18 p-3 text-amber-100 shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
            <MicOffIcon className="h-4 w-4" />
          </div>
        ) : null}
      </div>
    </article>
  );
}

