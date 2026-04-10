"use client";

import type { Participant } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CrownIcon, MicOffIcon, ScreenShareIcon, UsersIcon, XIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

interface ParticipantsPanelProps {
  hostId: string;
  isOpen: boolean;
  onClose: () => void;
  onManageParticipant: (participant: Participant) => void;
  participants: Participant[];
  selfId: string;
}

export function ParticipantsPanel({
  hostId,
  isOpen,
  onClose,
  onManageParticipant,
  participants,
  selfId,
}: ParticipantsPanelProps) {
  return (
    <aside
      className={cn(
        "beam-panel fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-white/10 p-5 transition duration-300 ease-out lg:w-[22rem]",
        isOpen ? "translate-x-0" : "translate-x-full",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white/8 p-2 text-pink-100">
            <UsersIcon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-2xl tracking-[-0.04em] text-white">Participants</h2>
            <p className="text-sm text-white/54">{participants.length} connected</p>
          </div>
        </div>
        <Button onClick={onClose} size="icon" variant="ghost">
          <XIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="beam-scrollbar mt-6 flex h-[calc(100%-4.5rem)] flex-col gap-3 overflow-y-auto pr-1">
        {participants.map((participant) => {
          const canManage = selfId === hostId && !participant.isLocal && !participant.isHost;

          return (
            <div
              className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              key={participant.peerId}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-medium text-white">
                      {participant.displayName}
                      {participant.isLocal ? " (You)" : ""}
                    </h3>
                    {participant.peerId === hostId ? (
                      <Badge className="bg-pink-500/18 text-pink-100">
                        <CrownIcon className="mr-1 h-3 w-3" />
                        Host
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-white/48">
                    <span>{participant.audioEnabled ? "Mic on" : "Mic muted"}</span>
                    <span>{participant.videoEnabled ? "Video on" : "Video off"}</span>
                    {participant.isSharingScreen ? <span>Sharing screen</span> : null}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-white/45">
                  {!participant.audioEnabled ? <MicOffIcon className="h-4 w-4" /> : null}
                  {participant.isSharingScreen ? <ScreenShareIcon className="h-4 w-4" /> : null}
                </div>
              </div>

              {canManage ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => onManageParticipant(participant)} variant="secondary">
                    Manage
                  </Button>
                </div>
              ) : participant.peerId === hostId && participant.peerId !== selfId ? (
                <p className="mt-4 text-xs text-white/42">Hosts cannot be removed by other users.</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

