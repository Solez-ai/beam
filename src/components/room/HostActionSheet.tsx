"use client";

import type { Participant } from "@/types";
import { Button } from "@/components/ui/Button";

interface HostActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onMakeHost: () => void;
  onMute: () => void;
  onRemove: () => void;
  onStopShare: () => void;
  participant: Participant | null;
}

export function HostActionSheet({
  isOpen,
  onClose,
  onMakeHost,
  onMute,
  onRemove,
  onStopShare,
  participant,
}: HostActionSheetProps) {
  if (!isOpen || !participant) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 px-4 backdrop-blur-md md:hidden">
      <div className="absolute inset-x-4 bottom-4 beam-panel rounded-[2rem] p-5">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.32em] text-white/36">Host controls</p>
          <h3 className="font-display text-2xl tracking-[-0.04em] text-white">
            Manage {participant.displayName}
          </h3>
        </div>
        <div className="mt-5 grid gap-3">
          <Button onClick={onMute} variant="secondary">
            Mute Participant
          </Button>
          {participant.isSharingScreen ? (
            <Button onClick={onStopShare} variant="secondary">
              Stop Screen Share
            </Button>
          ) : null}
          <Button onClick={onMakeHost} variant="primary">
            Make Host
          </Button>
          <Button onClick={onRemove} variant="danger">
            Remove Participant
          </Button>
          <Button onClick={onClose} variant="ghost">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

