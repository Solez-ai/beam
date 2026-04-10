"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  CameraIcon,
  CameraOffIcon,
  CheckIcon,
  CopyIcon,
  LeaveIcon,
  LinkIcon,
  MicIcon,
  MicOffIcon,
  ScreenShareIcon,
  UsersIcon,
} from "@/components/ui/icons";

interface ControlBarProps {
  canShareScreen: boolean;
  cameraEnabled: boolean;
  copyLinkStatus: "idle" | "copied";
  isCameraDisabled: boolean;
  isMicrophoneDisabled: boolean;
  isParticipantsPanelOpen: boolean;
  isSharingScreen: boolean;
  isVisible: boolean;
  manualCopyValue: string;
  microphoneEnabled: boolean;
  onKeepVisible: () => void;
  onCopyLink: () => void | Promise<void>;
  onLeave: () => void | Promise<void>;
  onStartShare: () => void | Promise<void>;
  onToggleCamera: () => void | Promise<void>;
  onToggleMicrophone: () => void | Promise<void>;
  onToggleParticipants: () => void;
  roomCode: string;
}

export function ControlBar({
  canShareScreen,
  cameraEnabled,
  copyLinkStatus,
  isCameraDisabled,
  isMicrophoneDisabled,
  isParticipantsPanelOpen,
  isSharingScreen,
  isVisible,
  manualCopyValue,
  microphoneEnabled,
  onKeepVisible,
  onCopyLink,
  onLeave,
  onStartShare,
  onToggleCamera,
  onToggleMicrophone,
  onToggleParticipants,
  roomCode,
}: ControlBarProps) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 px-3 pb-3 pt-3 transition duration-300 ease-out sm:px-6 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-[calc(100%-3.25rem)] opacity-95"
      }`}
      onFocus={onKeepVisible}
      onMouseEnter={onKeepVisible}
      onMouseMove={onKeepVisible}
      onTouchStart={onKeepVisible}
    >
      <div className="beam-surface mx-auto flex w-full max-w-5xl flex-col gap-3 rounded-[1.6rem] px-4 py-3">
        <div className="mx-auto h-1 w-14 rounded-full bg-white/12" />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="font-mono text-[11px] text-pink-100">Room {roomCode}</Badge>
            <span className="text-xs text-white/50">
              {isVisible ? "Meeting controls" : "Move cursor to reveal"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button className="h-10 px-4 text-xs" onClick={onCopyLink} variant="ghost">
              {copyLinkStatus === "copied" ? (
                <CheckIcon className="h-4 w-4" />
              ) : (
                <LinkIcon className="h-4 w-4" />
              )}
              {copyLinkStatus === "copied" ? "Copied" : "Copy Link"}
            </Button>
            <Button className="h-10 px-4 text-xs" onClick={onToggleParticipants} variant="secondary">
              <UsersIcon className="h-4 w-4" />
              {isParticipantsPanelOpen ? "Close Panel" : "Participants"}
            </Button>
          </div>
        </div>

        {manualCopyValue ? (
          <div className="flex flex-col gap-2 rounded-[1.2rem] border border-white/10 bg-black/20 p-2.5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-xs text-white/62">
              <CopyIcon className="h-4 w-4" />
              Manual copy
            </div>
            <input
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-xs text-white outline-none"
              readOnly
              value={manualCopyValue}
            />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              aria-label={microphoneEnabled ? "Mute microphone" : "Unmute microphone"}
              className="h-10 w-10"
              disabled={isMicrophoneDisabled}
              onClick={onToggleMicrophone}
              size="icon"
              variant={microphoneEnabled ? "secondary" : "ghost"}
            >
              {microphoneEnabled ? (
                <MicIcon className="h-5 w-5" />
              ) : (
                <MicOffIcon className="h-5 w-5" />
              )}
            </Button>
            <Button
              aria-label={cameraEnabled ? "Turn camera off" : "Turn camera on"}
              className="h-10 w-10"
              disabled={isCameraDisabled}
              onClick={onToggleCamera}
              size="icon"
              variant={cameraEnabled ? "secondary" : "ghost"}
            >
              {cameraEnabled ? (
                <CameraIcon className="h-5 w-5" />
              ) : (
                <CameraOffIcon className="h-5 w-5" />
              )}
            </Button>
            <Button
              className="h-10 px-4 text-xs"
              disabled={!canShareScreen}
              onClick={onStartShare}
              variant={isSharingScreen ? "primary" : "secondary"}
            >
              <ScreenShareIcon className="h-4 w-4" />
              {isSharingScreen ? "Stop Sharing" : "Share Screen"}
            </Button>
          </div>

          <Button className="h-10 px-4 text-xs" onClick={onLeave} variant="danger">
            <LeaveIcon className="h-4 w-4" />
            Leave Room
          </Button>
        </div>
      </div>
    </div>
  );
}
