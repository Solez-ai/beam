"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmationDialog } from "@/components/room/ConfirmationDialog";
import { ControlBar } from "@/components/room/ControlBar";
import { HostActionSheet } from "@/components/room/HostActionSheet";
import { NameEntryModal } from "@/components/room/NameEntryModal";
import { ParticipantsPanel } from "@/components/room/ParticipantsPanel";
import { RoomInfoPill } from "@/components/room/RoomInfoPill";
import { VideoGrid } from "@/components/room/VideoGrid";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { useRoom } from "@/hooks/useRoom";
import type { Participant } from "@/types";

type ConfirmAction = "make-host" | "remove" | "stop-share" | null;

export function RoomExperience({ roomCode }: { roomCode: string }) {
  const router = useRouter();
  const room = useRoom(roomCode);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [pinnedPeerId, setPinnedPeerId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [isControlBarVisible, setIsControlBarVisible] = useState(true);
  const shouldForceControlsVisible =
    room.isNameEntryOpen ||
    room.isParticipantsPanelOpen ||
    Boolean(selectedParticipant) ||
    Boolean(room.pendingShareRequest) ||
    Boolean(room.manualCopyValue);

  useEffect(() => {
    if (!room.wasRemoved) {
      return;
    }

    async function handleRemoval() {
      await room.leaveRoom();
      router.replace(`/removed?room=${roomCode}`);
    }

    void handleRemoval();
  }, [room, room.wasRemoved, roomCode, router]);

  useEffect(() => {
    if (shouldForceControlsVisible) {
      return;
    }

    let hideTimer: number | null = null;

    const showControls = () => {
      setIsControlBarVisible(true);
      if (hideTimer) {
        window.clearTimeout(hideTimer);
      }
      hideTimer = window.setTimeout(() => {
        setIsControlBarVisible(false);
      }, 2600);
    };

    showControls();
    window.addEventListener("mousemove", showControls);
    window.addEventListener("touchstart", showControls);
    window.addEventListener("keydown", showControls);

    return () => {
      if (hideTimer) {
        window.clearTimeout(hideTimer);
      }
      window.removeEventListener("mousemove", showControls);
      window.removeEventListener("touchstart", showControls);
      window.removeEventListener("keydown", showControls);
    };
  }, [
    shouldForceControlsVisible,
  ]);

  if (!room.isValidRoomCode) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#120e1a,#050509)] px-4 text-white">
        <div className="beam-panel max-w-lg rounded-[2rem] p-8 text-center">
          <p className="text-xs uppercase tracking-[0.32em] text-white/38">Beam</p>
          <h1 className="mt-3 font-display text-4xl tracking-[-0.05em]">Invalid room code</h1>
          <p className="mt-4 text-sm leading-7 text-white/62">
            Room codes must be exactly six characters using Beam&apos;s allowed letters and digits.
          </p>
          <Button className="mt-6" onClick={() => router.push("/")}>
            Back Home
          </Button>
        </div>
      </main>
    );
  }

  const localParticipant = room.participants.at(-1);
  const isHostViewer = Boolean(room.selfId && room.selfId === room.hostId);
  const selectedName = selectedParticipant?.displayName ?? "this participant";

  async function handleLeave() {
    await room.leaveRoom();
    router.push("/");
  }

  async function handleScreenShare() {
    if (room.isSharingScreen) {
      await room.handleStopScreenShare();
      return;
    }

    await room.startScreenShare();
  }

  function clearActions() {
    setConfirmAction(null);
    setSelectedParticipant(null);
  }

  async function runConfirmedAction() {
    if (!selectedParticipant || !confirmAction) {
      return;
    }

    if (confirmAction === "make-host") {
      room.transferHost(selectedParticipant.peerId);
    }
    if (confirmAction === "remove") {
      room.removeParticipant(selectedParticipant.peerId);
    }
    if (confirmAction === "stop-share") {
      room.stopParticipantShare(selectedParticipant.peerId);
    }

    clearActions();
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,130,168,0.18),transparent_24%),radial-gradient(circle_at_top_right,rgba(120,90,255,0.15),transparent_26%),linear-gradient(180deg,#100d18_0%,#07060b_55%,#040308_100%)] px-3 pb-36 pt-4 text-white sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <header className="beam-surface hidden sm:flex flex-col gap-4 rounded-[2rem] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-display text-3xl tracking-[-0.05em]">Beam Room</p>
              <Badge className="font-mono text-pink-100">{roomCode}</Badge>
              <Badge className="bg-white/10 text-white/70">{room.socketStatus}</Badge>
            </div>
            <p className="text-sm text-white/58">
              {room.resolvedName || room.draftName || "Guest"} is connected to a fast, peer-first
              call surface with host controls and screen sharing.
            </p>
          </div>
          <RoomInfoPill />
        </header>

        {room.roomError ? (
          <div className="rounded-[1.5rem] border border-rose-400/20 bg-rose-500/14 px-4 py-3 text-sm text-rose-100">
            {room.roomError}
          </div>
        ) : null}

        {room.mediaBanner ? (
          <div className="rounded-[1.5rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/74">
            {room.mediaBanner}
          </div>
        ) : null}

        <VideoGrid
          activeSharerId={room.activeSharerId}
          pinnedPeerId={pinnedPeerId}
          isHostViewer={isHostViewer}
          onOpenActions={(participant) => {
            setSelectedParticipant(participant);
          }}
          onTogglePin={(peerId) => {
            setPinnedPeerId(prev => prev === peerId ? null : peerId);
          }}
          participants={room.participants}
        />
      </div>

      <ParticipantsPanel
        hostId={room.hostId}
        isOpen={room.isParticipantsPanelOpen}
        onClose={room.closeParticipantsPanel}
        onManageParticipant={(participant) => setSelectedParticipant(participant)}
        participants={room.participants}
        selfId={room.selfId}
      />

      <ControlBar
        canShareScreen={room.canShareScreen}
        cameraEnabled={localParticipant?.videoEnabled ?? false}
        copyLinkStatus={room.copyLinkStatus}
        isCameraDisabled={!room.videoAvailable}
        isMicrophoneDisabled={!room.audioAvailable}
        isParticipantsPanelOpen={room.isParticipantsPanelOpen}
        isSharingScreen={room.isSharingScreen}
        isVisible={shouldForceControlsVisible || isControlBarVisible}
        manualCopyValue={room.manualCopyValue}
        microphoneEnabled={localParticipant?.audioEnabled ?? false}
        onKeepVisible={() => setIsControlBarVisible(true)}
        onCopyLink={room.copyRoomLink}
        onLeave={handleLeave}
        onSendReaction={room.sendReaction}
        onStartShare={handleScreenShare}
        onToggleCamera={room.toggleCamera}
        onToggleMicrophone={room.toggleMicrophone}
        onToggleParticipants={room.toggleParticipantsPanel}
        roomCode={roomCode}
      />

      <HostActionSheet
        isOpen={Boolean(selectedParticipant && isHostViewer && !selectedParticipant.isHost)}
        onClose={() => setSelectedParticipant(null)}
        onMakeHost={() => setConfirmAction("make-host")}
        onMute={() => {
          if (selectedParticipant) {
            room.muteParticipant(selectedParticipant.peerId);
            setSelectedParticipant(null);
          }
        }}
        onRemove={() => setConfirmAction("remove")}
        onStopShare={() => setConfirmAction("stop-share")}
        participant={selectedParticipant}
      />

      {selectedParticipant && isHostViewer && !selectedParticipant.isHost ? (
        <div className="pointer-events-none fixed bottom-40 right-6 z-20 hidden max-w-xs rounded-[1.5rem] border border-white/10 bg-[rgba(16,13,24,0.92)] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl md:block">
          <p className="pointer-events-auto text-sm text-white/62">
            Managing <span className="font-medium text-white">{selectedParticipant.displayName}</span>
          </p>
          <div className="pointer-events-auto mt-3 grid gap-2">
            <Button
              onClick={() => {
                room.muteParticipant(selectedParticipant.peerId);
                setSelectedParticipant(null);
              }}
              variant="secondary"
            >
              Mute
            </Button>
            {selectedParticipant.isSharingScreen ? (
              <Button onClick={() => setConfirmAction("stop-share")} variant="secondary">
                Stop Share
              </Button>
            ) : null}
            <Button onClick={() => setConfirmAction("make-host")} variant="primary">
              Make Host
            </Button>
            <Button onClick={() => setConfirmAction("remove")} variant="danger">
              Remove
            </Button>
            <Button onClick={() => setSelectedParticipant(null)} variant="ghost">
              Close
            </Button>
          </div>
        </div>
      ) : null}

      <NameEntryModal
        initialValue={room.draftName}
        isOpen={room.isNameEntryOpen}
        onSubmit={room.submitName}
      />

      <ConfirmationDialog
        body={`Transfer host privileges to ${selectedName}. They will become the room host immediately.`}
        confirmLabel="Transfer Host"
        isOpen={confirmAction === "make-host"}
        onCancel={clearActions}
        onConfirm={runConfirmedAction}
        title="Make new host?"
      />

      <ConfirmationDialog
        body={`Remove ${selectedName} from the room. They will be disconnected and sent to the removal page.`}
        confirmLabel="Remove Participant"
        isOpen={confirmAction === "remove"}
        onCancel={clearActions}
        onConfirm={runConfirmedAction}
        title="Remove participant?"
        tone="danger"
      />

      <ConfirmationDialog
        body={`Stop screen sharing for ${selectedName}. Their video feed will return to the camera track if available.`}
        confirmLabel="Stop Sharing"
        isOpen={confirmAction === "stop-share"}
        onCancel={clearActions}
        onConfirm={runConfirmedAction}
        title="Stop screen share?"
      />

      <ConfirmationDialog
        body={`${room.pendingShareRequest?.requesterName ?? "Another participant"} wants to take over screen sharing. Accepting will stop your current share and hand the stage over.`}
        confirmLabel="Yield Screen"
        isOpen={Boolean(room.pendingShareRequest)}
        onCancel={() => {
          void room.respondToShareRequest(false);
        }}
        onConfirm={() => {
          void room.respondToShareRequest(true);
        }}
        title="Yield the screen?"
      />

      <div className="pointer-events-none fixed bottom-28 right-4 z-50 flex max-w-sm flex-col gap-3 sm:right-6">
        {room.notices.map((notice) => (
          <Toast key={notice.id} message={notice.message} tone={notice.tone} />
        ))}
      </div>
    </main>
  );
}
