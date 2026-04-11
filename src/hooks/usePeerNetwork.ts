"use client";

import { useEffect, useRef, useState } from "react";
import type { Peer, DataConnection, MediaConnection } from "peerjs";
import type { ConnectionState, InboundSignal, OutboundSignal, ParticipantSnapshot } from "@/types";

interface UsePeerNetworkOptions {
  clientInstanceId: string;
  displayName: string;
  enabled: boolean;
  roomCode: string;
  getAudioTrack: () => MediaStreamTrack | null;
  getVideoTrack: () => MediaStreamTrack | null;
  onMessage: (message: InboundSignal) => void;
  onRemoteStream: (peerId: string, stream: MediaStream) => void;
  onConnectionStateChange: (peerId: string, state: ConnectionState) => void;
}

export function usePeerNetwork({
  clientInstanceId,
  displayName,
  enabled,
  roomCode,
  getAudioTrack,
  getVideoTrack,
  onMessage,
  onRemoteStream,
  onConnectionStateChange,
}: UsePeerNetworkOptions) {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "disconnected">("idle");
  const peerRef = useRef<Peer | null>(null);
  const isHostRef = useRef(false);
  const hostIdRef = useRef(`beam-room-${roomCode}`);
  const selfIdRef = useRef<string>("");

  const dataConnsRef = useRef<Map<string, DataConnection>>(new Map());
  const mediaConnsRef = useRef<Map<string, MediaConnection>>(new Map());

  const roomStateRef = useRef<{
    participants: Map<string, ParticipantSnapshot>;
    activeSharerId: string | null;
  }>({
    participants: new Map(),
    activeSharerId: null,
  });

  const onMessageRef = useRef(onMessage);
  const onRemoteStreamRef = useRef(onRemoteStream);
  const onConnectionStateChangeRef = useRef(onConnectionStateChange);

  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onRemoteStreamRef.current = onRemoteStream; }, [onRemoteStream]);
  useEffect(() => { onConnectionStateChangeRef.current = onConnectionStateChange; }, [onConnectionStateChange]);

  // Initialization logic
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let destroyed = false;

    async function initPeer() {
      setStatus("connecting");
      const { default: Peer } = await import("peerjs");

      const hostId = `beam-room-${roomCode}`;
      hostIdRef.current = hostId;

      // Try to become host
      const peer = new Peer(hostId);
      
      peer.on("open", (id) => {
        if (destroyed) {
          peer.destroy();
          return;
        }
        isHostRef.current = true;
        selfIdRef.current = id;
        peerRef.current = peer;
        setStatus("connected");
        
        // Host starts with itself in the room
        const selfSnapshot: ParticipantSnapshot = {
          peerId: id,
          displayName,
          isHost: true,
          audioEnabled: false,
          videoEnabled: false,
          isSharingScreen: false
        };
        roomStateRef.current.participants.set(id, selfSnapshot);

        onMessageRef.current({
          type: "room-info",
          selfId: id,
          hostId: id,
          activeSharerId: null,
          participants: [selfSnapshot]
        });
        
        setupPeerListeners(peer);
      });

      peer.on("error", (err: Error & { type?: string }) => {
        if (destroyed) return;
        
        if (err.type === "unavailable-id") {
          // Room exists, join as guest
          const guestPeer = new Peer();
          guestPeer.on("open", (id) => {
            if (destroyed) {
              guestPeer.destroy();
              return;
            }
            isHostRef.current = false;
            selfIdRef.current = id;
            peerRef.current = guestPeer;
            
            setupPeerListeners(guestPeer);
            
            // Connect to host
            const conn = guestPeer.connect(hostId);
            setupDataConn(conn);
          });
        } else {
          console.error("PeerJS error:", err);
          setStatus("disconnected");
          onMessageRef.current({ type: "error", message: "Connection failed." });
        }
      });
    }

    void initPeer();

    return () => {
      destroyed = true;
      peerRef.current?.destroy();
      peerRef.current = null;
      dataConnsRef.current.clear();
      mediaConnsRef.current.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, roomCode, displayName]);

  function setupPeerListeners(peer: Peer) {
    peer.on("connection", (conn) => {
      setupDataConn(conn);
    });

    peer.on("call", (call) => {
      setupMediaConn(call);
      call.answer(createStreamWithDummyTracks());
    });
  }

  function setupDataConn(conn: DataConnection) {
    conn.on("open", () => {
      dataConnsRef.current.set(conn.peer, conn);
      
      if (!isHostRef.current && conn.peer === hostIdRef.current) {
        // We just connected to the host, send join message
        conn.send({
          type: "join",
          roomCode,
          displayName,
          clientInstanceId
        });
        setStatus("connected");
      }
    });

    conn.on("data", (data: unknown) => {
      handleIncomingData(conn.peer, data, conn);
    });

    conn.on("close", () => {
      dataConnsRef.current.delete(conn.peer);
      if (isHostRef.current) {
        roomStateRef.current.participants.delete(conn.peer);
        const leaveMsg = { type: "peer-left", peerId: conn.peer };
        broadcastData(leaveMsg);
      }
      onMessageRef.current({ type: "peer-left", peerId: conn.peer });
      onConnectionStateChangeRef.current(conn.peer, "disconnected");
    });
  }

  function setupMediaConn(call: MediaConnection) {
    mediaConnsRef.current.set(call.peer, call);

    call.on("stream", (remoteStream) => {
      onRemoteStreamRef.current(call.peer, remoteStream);
    });

    call.on("close", () => {
      mediaConnsRef.current.delete(call.peer);
    });

    // Monitor underlying RTCPeerConnection for connection state
    if (call.peerConnection) {
      call.peerConnection.onconnectionstatechange = () => {
        onConnectionStateChangeRef.current(call.peer, call.peerConnection.connectionState as ConnectionState);
      };
    }
  }

  function handleIncomingData(fromPeerId: string, rawData: unknown, conn: DataConnection) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = rawData as Record<string, any>;
    let inbound: InboundSignal | null = null;

    switch (data.type) {
      case "join":
        if (isHostRef.current) {
          const snapshot: ParticipantSnapshot = {
            peerId: fromPeerId,
            displayName: data.displayName,
            isHost: false,
            audioEnabled: false,
            videoEnabled: false,
            isSharingScreen: false
          };
          roomStateRef.current.participants.set(fromPeerId, snapshot);

          // Reply with room info
          conn.send({
            type: "room-info",
            selfId: fromPeerId,
            hostId: hostIdRef.current,
            activeSharerId: roomStateRef.current.activeSharerId,
            participants: Array.from(roomStateRef.current.participants.values())
          });

          // Broadcast to others
          const peerJoinedMsg = { type: "peer-joined", participant: snapshot };
          broadcastData(peerJoinedMsg, fromPeerId);
          
          inbound = peerJoinedMsg as InboundSignal;
        }
        break;

      case "room-info":
        if (!isHostRef.current) {
          // We got room info from host. 
          hostIdRef.current = data.hostId;
          
          // Connect data to all OTHER peers in the room
          for (const p of data.participants) {
            roomStateRef.current.participants.set(p.peerId, p);
            if (p.peerId !== selfIdRef.current && p.peerId !== hostIdRef.current) {
               const newConn = peerRef.current!.connect(p.peerId);
               setupDataConn(newConn);
            }
          }
          
          inbound = data as InboundSignal;
        }
        break;

      case "peer-joined":
        roomStateRef.current.participants.set(data.participant.peerId, data.participant);
        inbound = data as InboundSignal;
        break;

      case "peer-left":
        roomStateRef.current.participants.delete(data.peerId);
        inbound = data as InboundSignal;
        break;

      case "participant-state": {
        const p = roomStateRef.current.participants.get(fromPeerId);
        if (p) {
          p.audioEnabled = data.audioEnabled;
          p.videoEnabled = data.videoEnabled;
          p.isSharingScreen = data.isSharingScreen;
        }
        if (data.isSharingScreen) roomStateRef.current.activeSharerId = fromPeerId;
        else if (roomStateRef.current.activeSharerId === fromPeerId) roomStateRef.current.activeSharerId = null;
        
        inbound = { ...data, peerId: fromPeerId } as InboundSignal;
        break;
      }

      case "control-mute":
      case "control-remove":
      case "control-stop-share":
        inbound = { type: data.type, fromPeerId } as InboundSignal;
        break;

      case "control-transfer-host":
        // Handled via host-changed broadcast below
        break;

      case "host-changed": {
        hostIdRef.current = data.hostId;
        for (const [id, p] of roomStateRef.current.participants.entries()) {
          p.isHost = (id === data.hostId);
        }
        isHostRef.current = (selfIdRef.current === data.hostId);
        inbound = data as InboundSignal;
        break;
      }

      case "share-request":
        inbound = { type: "share-request", requesterId: fromPeerId, requesterName: data.requesterName || "Someone" } as InboundSignal;
        break;

      case "share-response":
        inbound = { type: "share-response", fromPeerId, accepted: data.accepted } as InboundSignal;
        break;

      case "share-ended":
        roomStateRef.current.activeSharerId = null;
        inbound = { type: "share-ended", peerId: fromPeerId } as InboundSignal;
        break;
        
      case "leave":
        roomStateRef.current.participants.delete(fromPeerId);
        inbound = { type: "peer-left", peerId: fromPeerId } as InboundSignal;
        if (isHostRef.current) {
          broadcastData({ type: "peer-left", peerId: fromPeerId }, fromPeerId);
        }
        break;
    }

    if (inbound) {
      onMessageRef.current(inbound);
    }
  }

  function broadcastData(data: unknown, excludePeerId?: string) {
    for (const [id, conn] of dataConnsRef.current.entries()) {
      if (id !== excludePeerId && conn.open) {
        conn.send(data);
      }
    }
  }

  function send(signal: OutboundSignal) {
    // If it's a broadcast signal, send to everyone
    const broadcastTypes = ["participant-state", "share-ended", "leave"];
    if (broadcastTypes.includes(signal.type)) {
      broadcastData(signal);
      
      // Update local state if needed
      if (signal.type === "participant-state") {
        const p = roomStateRef.current.participants.get(selfIdRef.current);
        if (p) {
          p.audioEnabled = signal.audioEnabled;
          p.videoEnabled = signal.videoEnabled;
          p.isSharingScreen = signal.isSharingScreen;
        }
      }
      return;
    }

    // Directed signals
    if ("toPeerId" in signal && signal.toPeerId) {
      const conn = dataConnsRef.current.get(signal.toPeerId);
      if (conn?.open) conn.send(signal);
      
      if (signal.type === "control-transfer-host") {
        // Also broadcast host-changed to everyone
        const hostChanged = { type: "host-changed", hostId: signal.toPeerId };
        broadcastData(hostChanged);
        onMessageRef.current(hostChanged as InboundSignal);
        
        isHostRef.current = false;
        hostIdRef.current = signal.toPeerId;
      }
      return;
    }

    // share-request goes to host
    if (signal.type === "share-request") {
      const hostConn = dataConnsRef.current.get(hostIdRef.current);
      if (hostConn?.open) hostConn.send({ ...signal, requesterName: displayName });
      return;
    }
  }

  function createStreamWithDummyTracks() {
    const stream = new MediaStream();
    let audioTrack = getAudioTrack();
    let videoTrack = getVideoTrack();

    if (!audioTrack) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const dst = ctx.createMediaStreamDestination();
      audioTrack = dst.stream.getAudioTracks()[0];
      audioTrack.enabled = false;
    }
    
    if (!videoTrack) {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      videoTrack = canvas.captureStream().getVideoTracks()[0];
      videoTrack.enabled = false;
    }

    stream.addTrack(audioTrack);
    stream.addTrack(videoTrack);
    return stream;
  }

  function callPeer(peerId: string) {
    if (!peerRef.current) return;
    
    const stream = createStreamWithDummyTracks();
    const call = peerRef.current.call(peerId, stream);
    setupMediaConn(call);
  }

  function replaceAudioTrack(track: MediaStreamTrack | null) {
    for (const call of mediaConnsRef.current.values()) {
      const sender = call.peerConnection?.getSenders().find((s: RTCRtpSender) => s.track?.kind === "audio" || s.track === null);
      if (sender) {
        sender.replaceTrack(track).catch(console.error);
      }
    }
  }

  function replaceVideoTrack(track: MediaStreamTrack | null) {
    for (const call of mediaConnsRef.current.values()) {
      const sender = call.peerConnection?.getSenders().find((s: RTCRtpSender) => s.track?.kind === "video" || s.track === null);
      if (sender) {
        sender.replaceTrack(track).catch(console.error);
      }
    }
  }

  function closePeer(peerId: string) {
    dataConnsRef.current.get(peerId)?.close();
    dataConnsRef.current.delete(peerId);
    
    mediaConnsRef.current.get(peerId)?.close();
    mediaConnsRef.current.delete(peerId);
  }

  function closeAll() {
    for (const id of dataConnsRef.current.keys()) closePeer(id);
    peerRef.current?.destroy();
  }

  return {
    status,
    send,
    callPeer,
    replaceAudioTrack,
    replaceVideoTrack,
    closePeer,
    closeAll
  };
}