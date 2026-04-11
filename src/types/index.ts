export type ConnectionState =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed";

export type MediaPermissionState =
  | "unknown"
  | "full"
  | "audio-only"
  | "video-only"
  | "denied"
  | "unavailable";

export type ToastTone = "success" | "danger" | "info";

export interface Notice {
  id: string;
  message: string;
  tone?: ToastTone;
}

export interface ParticipantSnapshot {
  peerId: string;
  displayName: string;
  isHost: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
  isSharingScreen: boolean;
}

export interface Participant extends ParticipantSnapshot {
  stream: MediaStream | null;
  connectionState: ConnectionState;
  mediaState: MediaPermissionState;
  isLocal: boolean;
  reaction?: string | null;
}

export interface OutboundSignalMap {
  join: {
    type: "join";
    roomCode: string;
    displayName: string;
    clientInstanceId: string;
  };
  offer: {
    type: "offer";
    toPeerId: string;
    sdp: RTCSessionDescriptionInit;
  };
  answer: {
    type: "answer";
    toPeerId: string;
    sdp: RTCSessionDescriptionInit;
  };
  "ice-candidate": {
    type: "ice-candidate";
    toPeerId: string;
    candidate: RTCIceCandidateInit;
  };
  "participant-state": {
    type: "participant-state";
    audioEnabled: boolean;
    videoEnabled: boolean;
    isSharingScreen: boolean;
  };
  "control-mute": {
    type: "control-mute";
    toPeerId: string;
  };
  "control-remove": {
    type: "control-remove";
    toPeerId: string;
  };
  "control-stop-share": {
    type: "control-stop-share";
    toPeerId: string;
  };
  "control-transfer-host": {
    type: "control-transfer-host";
    toPeerId: string;
  };
  "share-request": {
    type: "share-request";
    requesterId: string;
  };
  "share-response": {
    type: "share-response";
    toPeerId: string;
    accepted: boolean;
  };
  "share-ended": {
    type: "share-ended";
  };
  reaction: {
    type: "reaction";
    reaction: string;
  };
  leave: {
    type: "leave";
  };
}

export type OutboundSignal = OutboundSignalMap[keyof OutboundSignalMap];

export type InboundSignal =
  | {
      type: "room-info";
      selfId: string;
      hostId: string;
      activeSharerId: string | null;
      participants: ParticipantSnapshot[];
    }
  | {
      type: "peer-joined";
      participant: ParticipantSnapshot;
    }
  | {
      type: "peer-left";
      peerId: string;
    }
  | {
      type: "offer";
      fromPeerId: string;
      sdp: RTCSessionDescriptionInit;
    }
  | {
      type: "answer";
      fromPeerId: string;
      sdp: RTCSessionDescriptionInit;
    }
  | {
      type: "ice-candidate";
      fromPeerId: string;
      candidate: RTCIceCandidateInit;
    }
  | {
      type: "host-assigned";
      peerId: string;
    }
  | {
      type: "host-changed";
      hostId: string;
    }
  | {
      type: "participant-state";
      peerId: string;
      audioEnabled: boolean;
      videoEnabled: boolean;
      isSharingScreen: boolean;
    }
  | {
      type: "control-mute";
      fromPeerId: string;
    }
  | {
      type: "control-remove";
      fromPeerId: string;
    }
  | {
      type: "control-stop-share";
      fromPeerId: string;
    }
  | {
      type: "share-request";
      requesterId: string;
      requesterName: string;
    }
  | {
      type: "share-response";
      fromPeerId: string;
      accepted: boolean;
    }
  | {
      type: "share-ended";
      peerId: string;
    }
  | {
      type: "reaction";
      peerId: string;
      reaction: string;
    }
  | {
      type: "error";
      message: string;
    };
