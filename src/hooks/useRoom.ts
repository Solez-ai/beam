"use client";

import { useEffect, useRef, useState } from "react";
import { TOAST_DURATION_MS } from "@/lib/constants";
import { validateRoomCode } from "@/lib/generateRoomCode";
import { usePeerNetwork } from "@/hooks/usePeerNetwork";
import {
  getClientInstanceId,
  getStoredDisplayName,
  setStoredDisplayName,
} from "@/lib/session";
import { siteConfig } from "@/lib/site";
import { useBeamStore } from "@/store/useBeamStore";
import type {
  InboundSignal,
  MediaPermissionState,
  Notice,
  OutboundSignal,
  Participant,
  ParticipantSnapshot,
  ToastTone,
} from "@/types";

interface PendingShareRequest {
  requesterId: string;
  requesterName: string;
}

function createNoticeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function findParticipant(participants: Participant[], peerId: string) {
  return participants.find((participant) => participant.peerId === peerId);
}

function dedupeParticipants(participants: Participant[]) {
  const unique = new Map<string, Participant>();

  for (const participant of participants) {
    unique.set(participant.peerId, participant);
  }

  return [...unique.values()];
}

function buildParticipant(
  snapshot: Partial<ParticipantSnapshot> & Pick<ParticipantSnapshot, "peerId">,
  existing?: Participant,
): Participant {
  return {
    peerId: snapshot.peerId,
    displayName: snapshot.displayName ?? existing?.displayName ?? "Guest",
    isHost: snapshot.isHost ?? existing?.isHost ?? false,
    audioEnabled: snapshot.audioEnabled ?? existing?.audioEnabled ?? false,
    videoEnabled: snapshot.videoEnabled ?? existing?.videoEnabled ?? false,
    isSharingScreen: snapshot.isSharingScreen ?? existing?.isSharingScreen ?? false,
    stream: existing?.stream ?? null,
    connectionState: existing?.connectionState ?? "idle",
    mediaState: existing?.mediaState ?? "unknown",
    isLocal: false,
  };
}

export function useRoom(roomCode: string) {
  const storeDisplayName = useBeamStore((state) => state.displayName);
  const setStoreDisplayName = useBeamStore((state) => state.setDisplayName);
  const isParticipantsPanelOpen = useBeamStore((state) => state.isParticipantsPanelOpen);
  const toggleParticipantsPanel = useBeamStore((state) => state.toggleParticipantsPanel);
  const closeParticipantsPanel = useBeamStore((state) => state.closeParticipantsPanel);
  const copyLinkStatus = useBeamStore((state) => state.copyLinkStatus);
  const setCopyLinkStatus = useBeamStore((state) => state.setCopyLinkStatus);

  const initialDisplayName =
    storeDisplayName.trim() ||
    (typeof window === "undefined" ? "" : getStoredDisplayName().trim());
  const clientInstanceId =
    typeof window === "undefined" ? "" : getClientInstanceId();

  const [resolvedName, setResolvedName] = useState(initialDisplayName);
  const [draftName, setDraftName] = useState(initialDisplayName);
  const [remoteParticipants, setRemoteParticipants] = useState<Participant[]>([]);
  const [selfId, setSelfId] = useState("");
  const [hostId, setHostId] = useState("");
  const [activeSharerId, setActiveSharerId] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [videoAvailable, setVideoAvailable] = useState(true);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [mediaState, setMediaState] = useState<MediaPermissionState>("unknown");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [roomError, setRoomError] = useState("");
  const [manualCopyValue, setManualCopyValue] = useState("");
  const [wasRemoved, setWasRemoved] = useState(false);
  const [pendingShareRequest, setPendingShareRequest] =
    useState<PendingShareRequest | null>(null);
  const [waitingToStartShare, setWaitingToStartShare] = useState(false);

  const isValidRoomCode = validateRoomCode(roomCode);
  const remoteParticipantsRef = useRef<Participant[]>([]);
  const mediaInitRef = useRef(false);
  const cleanupStartedRef = useRef(false);
  const activeVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const microphoneTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const roomSignalRef = useRef<(signal: OutboundSignal) => void>(() => undefined);
  const sendSignalRef = useRef<(signal: Extract<OutboundSignal, { toPeerId: string }>) => void>(
    () => undefined,
  );
  const onMessageRef = useRef<(message: InboundSignal) => Promise<void> | void>(() => undefined);

  useEffect(() => {
    remoteParticipantsRef.current = remoteParticipants;
  }, [remoteParticipants]);

  useEffect(() => {
    if (initialDisplayName && !storeDisplayName.trim()) {
      setStoreDisplayName(initialDisplayName);
    }
  }, [initialDisplayName, setStoreDisplayName, storeDisplayName]);

  function addNotice(message: string, tone: ToastTone = "info") {
    const nextNotice = {
      id: createNoticeId(),
      message,
      tone,
    } satisfies Notice;

    setNotices((current) => [...current, nextNotice]);

    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        setNotices((current) => current.filter((notice) => notice.id !== nextNotice.id));
      }, TOAST_DURATION_MS);
    }
  }

  function updateRemoteParticipant(
    peerId: string,
    updater: (participant: Participant | undefined) => Participant | null,
  ) {
    setRemoteParticipants((current) => {
      const existing = findParticipant(current, peerId);
      const updated = updater(existing);

      if (!updated) {
        return current.filter((participant) => participant.peerId !== peerId);
      }

      if (!existing) {
        return dedupeParticipants([...current, updated]);
      }

      return dedupeParticipants(current.map((participant) =>
        participant.peerId === peerId ? updated : participant,
      ));
    });
  }

  const localStreamRef = useRef<MediaStream | null>(null);

  function syncLocalStream() {
    if (!localStreamRef.current) {
      localStreamRef.current = new MediaStream();
    }

    const preview = localStreamRef.current;
    
    // Remove existing tracks
    for (const track of preview.getTracks()) {
      preview.removeTrack(track);
    }

    if (activeVideoTrackRef.current) {
      preview.addTrack(activeVideoTrackRef.current);
    }
    if (microphoneTrackRef.current) {
      preview.addTrack(microphoneTrackRef.current);
    }

    // Force a re-render by setting state, but keep the same stream object
    // if it has tracks. If it's empty, we can set to null.
    setLocalStream(preview.getTracks().length ? preview : null);
  }

  const peerNetwork = usePeerNetwork({
    clientInstanceId,
    displayName: resolvedName,
    enabled: Boolean(resolvedName && isValidRoomCode),
    roomCode,
    getAudioTrack: () => microphoneTrackRef.current,
    getVideoTrack: () => activeVideoTrackRef.current,
    onMessage: (message) => {
      void onMessageRef.current(message);
    },
    onRemoteStream: (peerId, stream) => {
      updateRemoteParticipant(peerId, (participant) => ({
        ...(participant ?? buildParticipant({ peerId })),
        stream,
      }));
    },
    onConnectionStateChange: (peerId, state) => {
      if (state === "failed") {
        const participant = findParticipant(remoteParticipantsRef.current, peerId);
        if (participant) {
          addNotice(`Connection to ${participant.displayName} failed. Reconnecting...`, "info");
        }
        window.setTimeout(() => {
          peerNetwork.callPeer(peerId);
        }, 1000);
      }

      updateRemoteParticipant(peerId, (participant) => ({
        ...(participant ?? buildParticipant({ peerId })),
        connectionState: state,
      }));
    },
  });

  useEffect(() => {
    roomSignalRef.current = (signal) => peerNetwork.send(signal);
    sendSignalRef.current = (signal) => peerNetwork.send(signal);
  }, [peerNetwork]);

  async function handleStopScreenShare(announce = true) {
    const screenTrack = screenTrackRef.current;
    if (!screenTrack) {
      return;
    }

    screenTrack.onended = null;
    if (screenTrack.readyState !== "ended") {
      screenTrack.stop();
    }

    screenTrackRef.current = null;
    activeVideoTrackRef.current = cameraTrackRef.current;
    setIsSharingScreen(false);
    setActiveSharerId((current) => (current === selfId ? null : current));
    syncLocalStream();
    await peerNetwork.replaceVideoTrack(cameraTrackRef.current);

    if (announce) {
      roomSignalRef.current({ type: "share-ended" });
    }
  }

  async function initializeLocalMedia() {
    if (mediaInitRef.current || !resolvedName || !isValidRoomCode || typeof navigator === "undefined") {
      return;
    }

    mediaInitRef.current = true;

    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaState("unavailable");
      setAudioAvailable(false);
      setVideoAvailable(false);
      setAudioEnabled(false);
      setCameraEnabled(false);
      addNotice("Media devices are unavailable in this browser context.", "danger");
      return;
    }

    const failures: Error[] = [];

    async function tryMedia(
      constraints: MediaStreamConstraints,
      nextState: MediaPermissionState,
    ) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const audioTrack = stream.getAudioTracks()[0] ?? null;
        const videoTrack = stream.getVideoTracks()[0] ?? null;

        microphoneTrackRef.current = audioTrack;
        cameraTrackRef.current = videoTrack;
        activeVideoTrackRef.current = videoTrack;

        setAudioAvailable(Boolean(audioTrack));
        setVideoAvailable(Boolean(videoTrack));
        setAudioEnabled(Boolean(audioTrack?.enabled));
        setCameraEnabled(Boolean(videoTrack?.enabled));
        setMediaState(nextState);
        syncLocalStream();
        await peerNetwork.replaceAudioTrack(audioTrack);
        await peerNetwork.replaceVideoTrack(videoTrack);
        return true;
      } catch (error) {
        failures.push(error as Error);
        return false;
      }
    }

    if (await tryMedia({ video: true, audio: true }, "full")) {
      return;
    }
    if (await tryMedia({ audio: true, video: false }, "audio-only")) {
      return;
    }
    if (await tryMedia({ audio: false, video: true }, "video-only")) {
      return;
    }

    const isUnavailable = failures.some((failure) =>
      ["NotFoundError", "DevicesNotFoundError", "OverconstrainedError"].includes(failure.name),
    );

    setMediaState(isUnavailable ? "unavailable" : "denied");
    setAudioAvailable(false);
    setVideoAvailable(false);
    setAudioEnabled(false);
    setCameraEnabled(false);
    syncLocalStream();
    addNotice(
      isUnavailable
        ? "No camera or microphone was found on this device."
        : "Beam could not access your camera or microphone.",
      "danger",
    );
  }

  async function startScreenShare() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
      addNotice("Screen sharing is not available in this browser.", "danger");
      return;
    }

    if (activeSharerId && activeSharerId !== selfId) {
      roomSignalRef.current({
        type: "share-request",
        requesterId: selfId,
      });
      addNotice("Asked the current presenter to yield the screen.", "info");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
          displaySurface: "monitor",
          frameRate: { ideal: 30 },
          height: { ideal: 1080 },
          width: { ideal: 1920 },
        } as MediaTrackConstraints,
        audio: false,
      });

      const screenTrack = stream.getVideoTracks()[0];
      if (!screenTrack) {
        addNotice("No screen video track was available to share.", "danger");
        return;
      }

      screenTrack.onended = () => {
        void handleStopScreenShare();
      };

      screenTrackRef.current = screenTrack;
      activeVideoTrackRef.current = screenTrack;
      setIsSharingScreen(true);
      setActiveSharerId(selfId);
      syncLocalStream();
      await peerNetwork.replaceVideoTrack(screenTrack);
    } catch {
      addNotice("Screen sharing was cancelled.", "info");
    }
  }

  async function performCleanup(sendLeave = true) {
    if (cleanupStartedRef.current) {
      return;
    }

    cleanupStartedRef.current = true;

    if (sendLeave) {
      try {
        roomSignalRef.current({ type: "leave" });
      } catch {
        // The socket is already gone.
      }
    }

    closeParticipantsPanel();
    peerNetwork.closeAll();
    screenTrackRef.current?.stop();
    cameraTrackRef.current?.stop();
    microphoneTrackRef.current?.stop();
    screenTrackRef.current = null;
    cameraTrackRef.current = null;
    microphoneTrackRef.current = null;
    activeVideoTrackRef.current = null;
    setLocalStream(null);
  }

  async function leaveRoom() {
    await performCleanup(true);
  }

  function submitName(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      return false;
    }

    setStoreDisplayName(trimmed);
    setStoredDisplayName(trimmed);
    setDraftName(trimmed);
    setResolvedName(trimmed);
    return true;
  }

  async function toggleMicrophone() {
    if (!microphoneTrackRef.current) {
      return;
    }

    microphoneTrackRef.current.enabled = !microphoneTrackRef.current.enabled;
    setAudioEnabled(microphoneTrackRef.current.enabled);
    syncLocalStream();
  }

  async function toggleCamera() {
    if (cameraEnabled) {
      if (cameraTrackRef.current) {
        cameraTrackRef.current.stop();
        cameraTrackRef.current = null;
      }
      setCameraEnabled(false);
      if (!isSharingScreen) {
        activeVideoTrackRef.current = null;
        await peerNetwork.replaceVideoTrack(null);
      }
      syncLocalStream();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = stream.getVideoTracks()[0] ?? null;
        cameraTrackRef.current = videoTrack;
        setCameraEnabled(Boolean(videoTrack));
        if (!isSharingScreen) {
          activeVideoTrackRef.current = videoTrack;
          await peerNetwork.replaceVideoTrack(videoTrack);
        }
        syncLocalStream();
      } catch {
        addNotice("Could not access camera.", "danger");
      }
    }
  }

  const [localReaction, setLocalReaction] = useState<string | null>(null);

  async function copyRoomLink() {
    const roomUrl =
      typeof window === "undefined"
        ? `${siteConfig.url}/room/${roomCode}`
        : window.location.href;

    try {
      await navigator.clipboard.writeText(roomUrl);
      setManualCopyValue("");
      setCopyLinkStatus("copied");
      addNotice("Link copied to clipboard.", "success");
      window.setTimeout(() => setCopyLinkStatus("idle"), TOAST_DURATION_MS);
    } catch {
      setManualCopyValue(roomUrl);
      addNotice("Clipboard access is unavailable. Copy the link manually below.", "info");
    }
  }

  async function respondToShareRequest(accepted: boolean) {
    if (!pendingShareRequest) {
      return;
    }

    roomSignalRef.current({
      type: "share-response",
      toPeerId: pendingShareRequest.requesterId,
      accepted,
    });

    if (accepted && isSharingScreen) {
      await handleStopScreenShare();
    }

    setPendingShareRequest(null);
  }

  function sendReaction(reaction: string) {
    roomSignalRef.current({ type: "reaction", reaction });
    
    // Also show locally
    setLocalReaction(reaction);
    window.setTimeout(() => {
      setLocalReaction((current) => (current === reaction ? null : current));
    }, 3000);
  }

  function muteParticipant(peerId: string) {
    roomSignalRef.current({ type: "control-mute", toPeerId: peerId });
  }

  function removeParticipant(peerId: string) {
    roomSignalRef.current({ type: "control-remove", toPeerId: peerId });
  }

  function transferHost(peerId: string) {
    roomSignalRef.current({ type: "control-transfer-host", toPeerId: peerId });
  }

  function stopParticipantShare(peerId: string) {
    roomSignalRef.current({ type: "control-stop-share", toPeerId: peerId });
  }

  useEffect(() => {
    onMessageRef.current = async (message) => {
      switch (message.type) {
        case "room-info": {
          setRoomError("");
          setSelfId(message.selfId);
          setHostId(message.hostId);
          setActiveSharerId(message.activeSharerId);

          const previousPeerIds = new Set(
            remoteParticipantsRef.current.map((participant) => participant.peerId),
          );

          setRemoteParticipants(dedupeParticipants(
            message.participants
              .filter((participant) => participant.peerId !== message.selfId)
              .map((participant) =>
                buildParticipant(
                  participant,
                  findParticipant(remoteParticipantsRef.current, participant.peerId),
                ),
              ),
          ));

          for (const participant of message.participants) {
            if (participant.peerId === message.selfId || previousPeerIds.has(participant.peerId)) {
              continue;
            }

            peerNetwork.callPeer(participant.peerId);
          }
          break;
        }
        case "peer-joined": {
          updateRemoteParticipant(message.participant.peerId, (participant) =>
            buildParticipant(message.participant, participant),
          );
          addNotice(`${message.participant.displayName} joined the room.`, "info");
          // New peer will call us, no need to initiate call here.
          break;
        }
        case "peer-left": {
          peerNetwork.closePeer(message.peerId);
          updateRemoteParticipant(message.peerId, () => null);
          setActiveSharerId((current) => (current === message.peerId ? null : current));
          break;
        }
        case "offer":
        case "answer":
        case "ice-candidate":
          // Handled internally by PeerJS
          break;
        case "host-assigned": {
          setHostId(message.peerId);
          break;
        }
        case "host-changed": {
          setHostId(message.hostId);
          addNotice(
            message.hostId === selfId
              ? "You are now the host."
              : "Host privileges were transferred.",
            "info",
          );
          break;
        }
        case "participant-state": {
          if (message.peerId === selfId) {
            break;
          }

          updateRemoteParticipant(message.peerId, (participant) =>
            buildParticipant(
              {
                peerId: message.peerId,
                audioEnabled: message.audioEnabled,
                videoEnabled: message.videoEnabled,
                isSharingScreen: message.isSharingScreen,
              },
              participant,
            ),
          );

          if (message.isSharingScreen) {
            setActiveSharerId(message.peerId);
          } else {
            setActiveSharerId((current) => (current === message.peerId ? null : current));
          }
          break;
        }
        case "control-mute": {
          if (microphoneTrackRef.current) {
            microphoneTrackRef.current.enabled = false;
          }
          setAudioEnabled(false);
          addNotice("The host muted your microphone.", "info");
          break;
        }
        case "control-remove": {
          setWasRemoved(true);
          addNotice("You were removed from the room.", "danger");
          break;
        }
        case "control-stop-share": {
          await handleStopScreenShare();
          addNotice("The host stopped your screen share.", "info");
          break;
        }
        case "share-request": {
          if (activeSharerId === selfId) {
            setPendingShareRequest({
              requesterId: message.requesterId,
              requesterName: message.requesterName,
            });
          }
          break;
        }
        case "share-response": {
          if (!message.accepted) {
            setWaitingToStartShare(false);
            addNotice("The current presenter declined your screen-share request.", "info");
            break;
          }

          setWaitingToStartShare(true);
          addNotice("Screen sharing will start as soon as the current presenter yields.", "info");
          break;
        }
        case "share-ended": {
          setActiveSharerId((current) => (current === message.peerId ? null : current));
          updateRemoteParticipant(message.peerId, (participant) =>
            participant
              ? {
                  ...participant,
                  isSharingScreen: false,
                }
              : null,
          );
          break;
        }
        case "reaction": {
          updateRemoteParticipant(message.peerId, (participant) =>
            participant ? { ...participant, reaction: message.reaction } : null
          );

          // Auto-clear reaction after 3 seconds
          window.setTimeout(() => {
            updateRemoteParticipant(message.peerId, (participant) =>
              participant && participant.reaction === message.reaction
                ? { ...participant, reaction: null }
                : (participant ?? null)
            );
          }, 3000);
          break;
        }
        case "error": {
          setRoomError(message.message);
          addNotice(message.message, "danger");
          break;
        }
        default:
          break;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSharerId, peerNetwork, selfId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void initializeLocalMedia();
    }, 0);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedName, isValidRoomCode]);

  useEffect(() => {
    if (!selfId || peerNetwork.status !== "connected") {
      return;
    }

    roomSignalRef.current({
      type: "participant-state",
      audioEnabled,
      videoEnabled: isSharingScreen || cameraEnabled,
      isSharingScreen,
    });
  }, [audioEnabled, cameraEnabled, isSharingScreen, selfId, peerNetwork.status]);

  useEffect(() => {
    return () => {
      void performCleanup(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!waitingToStartShare || activeSharerId) {
      return;
    }

    async function startWhenAvailable() {
      setWaitingToStartShare(false);
      await startScreenShare();
    }

    void startWhenAvailable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSharerId, waitingToStartShare]);

  const localParticipant: Participant = {
    peerId: selfId || "local-preview",
    displayName: resolvedName || draftName || "You",
    isHost: Boolean(selfId && selfId === hostId),
    audioEnabled,
    videoEnabled: isSharingScreen || cameraEnabled,
    isSharingScreen,
    stream: localStream,
    connectionState:
      peerNetwork.status === "connected"
        ? "connected"
        : peerNetwork.status === "connecting"
          ? "connecting"
          : "idle",
    mediaState,
    isLocal: true,
    reaction: localReaction,
  };

  const participants = dedupeParticipants(
    remoteParticipants
      .filter(
        (participant) =>
          participant.peerId !== selfId && participant.connectionState === "connected",
      )
      .concat(localParticipant),
  );
  const mediaBanner =
    mediaState === "denied"
      ? "Camera and microphone access were denied. Others cannot see or hear you."
      : mediaState === "unavailable"
        ? "No working media devices were found. Beam will keep you in the room without AV."
        : mediaState === "audio-only"
          ? "Camera access is unavailable, so you joined with microphone only."
          : mediaState === "video-only"
            ? "Microphone access is unavailable, so you joined with camera only."
            : "";

  return {
    activeSharerId,
    audioAvailable,
    canShareScreen:
      typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getDisplayMedia),
    closeParticipantsPanel,
    copyLinkStatus,
    copyRoomLink,
    draftName,
    handleStopScreenShare,
    hostId,
    isNameEntryOpen: !resolvedName,
    isParticipantsPanelOpen,
    isSharingScreen,
    isValidRoomCode,
    leaveRoom,
    manualCopyValue,
    mediaBanner,
    muteParticipant,
    notices,
    participants,
    pendingShareRequest,
    removeParticipant,
    resolvedName,
    respondToShareRequest,
    roomError,
    selfId,
    sendReaction,
    setDraftName,
    socketStatus: peerNetwork.status,
    startScreenShare,
    stopParticipantShare,
    submitName,
    toggleCamera,
    toggleMicrophone,
    toggleParticipantsPanel,
    transferHost,
    videoAvailable,
    wasRemoved,
  };
}
