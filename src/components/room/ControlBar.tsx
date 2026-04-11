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
import LikeIcon from "@/components/icons/LikeIcon";
import ScanHeartIcon from "@/components/icons/ScanHeartIcon";
import SkullEmoji from "@/components/icons/SkullEmoji";

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
  onSendReaction: (reaction: string) => void;
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
  onSendReaction,
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
      <div className="beam-surface mx-auto flex w-full max-w-5xl flex-col gap-3 rounded-[1.2rem] px-4 py-2 sm:py-3 sm:rounded-[1.6rem]">
        <div className="mx-auto h-1 w-12 rounded-full bg-white/12 sm:hidden" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between sm:w-[280px] sm:justify-start gap-2">
            <Badge className="font-mono text-[11px] text-pink-100">Room {roomCode}</Badge>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button className="h-9 px-3 text-xs" onClick={onCopyLink} variant="ghost">
                {copyLinkStatus === "copied" ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <LinkIcon className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{copyLinkStatus === "copied" ? "Copied" : "Copy"}</span>
              </Button>
              <Button className="h-9 px-3 text-xs" onClick={onToggleParticipants} variant={isParticipantsPanelOpen ? "primary" : "secondary"}>
                <UsersIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Users</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <Button
              aria-label={microphoneEnabled ? "Mute microphone" : "Unmute microphone"}
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full"
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
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full"
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
              className="h-10 px-4 text-xs sm:h-12 sm:px-5 sm:text-sm rounded-full"
              disabled={!canShareScreen}
              onClick={onStartShare}
              variant={isSharingScreen ? "primary" : "secondary"}
            >
              <ScreenShareIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">{isSharingScreen ? "Stop Sharing" : "Share"}</span>
            </Button>
          </div>

          <div className="flex items-center justify-center sm:w-[280px] sm:justify-end gap-2">
            <div className="flex items-center gap-1 sm:gap-2 mr-0 sm:mr-2 px-2 sm:px-3 py-1 sm:py-2 rounded-full border border-white/10 bg-white/5">
              <button aria-label="Like" onClick={() => onSendReaction("like")} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <LikeIcon size={20} className="text-white" />
              </button>
              <button aria-label="Heart" onClick={() => onSendReaction("heart")} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <ScanHeartIcon size={20} className="text-pink-400" />
              </button>
              <button aria-label="Skull" onClick={() => onSendReaction("skull")} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <SkullEmoji size={20} className="text-white" />
              </button>
            </div>
            <Button className="h-10 w-full sm:w-auto px-4 text-xs sm:h-10 rounded-full" onClick={onLeave} variant="danger">
              <LeaveIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Leave Room</span>
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
      </div>
    </div>
  );
}
