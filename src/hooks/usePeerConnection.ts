"use client";

import { useEffect, useRef } from "react";
import { rtcConfig } from "@/lib/webrtcConfig";
import type { ConnectionState, OutboundSignal } from "@/types";

interface PeerRecord {
  audioSender: RTCRtpSender;
  isClosed: boolean;
  pc: RTCPeerConnection;
  videoSender: RTCRtpSender;
}

interface UsePeerConnectionOptions {
  getAudioTrack: () => MediaStreamTrack | null;
  getVideoTrack: () => MediaStreamTrack | null;
  onConnectionStateChange: (peerId: string, state: ConnectionState) => void;
  onRemoteStream: (peerId: string, stream: MediaStream) => void;
  onSignal: (signal: Extract<OutboundSignal, { toPeerId: string }>) => void;
}

export function usePeerConnection({
  getAudioTrack,
  getVideoTrack,
  onConnectionStateChange,
  onRemoteStream,
  onSignal,
}: UsePeerConnectionOptions) {
  const peerMapRef = useRef<Map<string, PeerRecord>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const pendingIceRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const onSignalRef = useRef(onSignal);
  const onRemoteStreamRef = useRef(onRemoteStream);
  const onConnectionStateChangeRef = useRef(onConnectionStateChange);

  useEffect(() => {
    onSignalRef.current = onSignal;
  }, [onSignal]);

  useEffect(() => {
    onRemoteStreamRef.current = onRemoteStream;
  }, [onRemoteStream]);

  useEffect(() => {
    onConnectionStateChangeRef.current = onConnectionStateChange;
  }, [onConnectionStateChange]);

  function ensureConnection(peerId: string) {
    const existing = peerMapRef.current.get(peerId);
    if (existing) {
      return existing;
    }

    const pc = new RTCPeerConnection(rtcConfig);
    const audioTransceiver = pc.addTransceiver("audio", { direction: "sendrecv" });
    const videoTransceiver = pc.addTransceiver("video", { direction: "sendrecv" });

    const audioTrack = getAudioTrack();
    const videoTrack = getVideoTrack();

    if (audioTrack) {
      void audioTransceiver.sender.replaceTrack(audioTrack);
    }
    if (videoTrack) {
      void videoTransceiver.sender.replaceTrack(videoTrack);
    }

    pc.onicecandidate = (event) => {
      if (!event.candidate) {
        return;
      }

      onSignalRef.current({
        type: "ice-candidate",
        toPeerId: peerId,
        candidate: event.candidate.toJSON(),
      });
    };

    pc.onconnectionstatechange = () => {
      const nextState: ConnectionState = (() => {
        switch (pc.connectionState) {
          case "connected":
            return "connected";
          case "connecting":
            return "connecting";
          case "failed":
            return "failed";
          case "disconnected":
            return "disconnected";
          default:
            return "idle";
        }
      })();

      onConnectionStateChangeRef.current(peerId, nextState);
    };

    pc.ontrack = (event) => {
      const existingStream = remoteStreamsRef.current.get(peerId) ?? new MediaStream();
      const nextStream = event.streams[0] ?? existingStream;

      if (!event.streams[0] && !nextStream.getTracks().some((track) => track.id === event.track.id)) {
        nextStream.addTrack(event.track);
      }

      remoteStreamsRef.current.set(peerId, nextStream);
      onRemoteStreamRef.current(peerId, nextStream);
    };

    const record = {
      audioSender: audioTransceiver.sender,
      isClosed: false,
      pc,
      videoSender: videoTransceiver.sender,
    } satisfies PeerRecord;

    peerMapRef.current.set(peerId, record);
    return record;
  }

  async function flushQueuedCandidates(peerId: string) {
    const queued = pendingIceRef.current.get(peerId) ?? [];
    if (!queued.length) {
      return;
    }

    const record = ensureConnection(peerId);
    for (const candidate of queued) {
      await record.pc.addIceCandidate(candidate);
    }
    pendingIceRef.current.delete(peerId);
  }

  async function createOffer(peerId: string) {
    const { pc } = ensureConnection(peerId);
    if (pc.signalingState !== "stable") {
      return;
    }
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    onSignalRef.current({
      type: "offer",
      toPeerId: peerId,
      sdp: offer,
    });
  }

  async function handleOffer(peerId: string, sdp: RTCSessionDescriptionInit) {
    const { pc } = ensureConnection(peerId);
    if (pc.signalingState !== "stable") {
      try {
        await pc.setLocalDescription({ type: "rollback" });
      } catch {
        return;
      }
    }
    await pc.setRemoteDescription(sdp);
    await flushQueuedCandidates(peerId);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    onSignalRef.current({
      type: "answer",
      toPeerId: peerId,
      sdp: answer,
    });
  }

  async function handleAnswer(peerId: string, sdp: RTCSessionDescriptionInit) {
    const { pc } = ensureConnection(peerId);
    if (pc.signalingState !== "have-local-offer") {
      return;
    }
    await pc.setRemoteDescription(sdp);
    await flushQueuedCandidates(peerId);
  }

  async function addIceCandidate(peerId: string, candidate: RTCIceCandidateInit) {
    const { pc, isClosed } = ensureConnection(peerId);
    if (isClosed) {
      return;
    }
    if (!pc.remoteDescription) {
      const queued = pendingIceRef.current.get(peerId) ?? [];
      queued.push(candidate);
      pendingIceRef.current.set(peerId, queued);
      return;
    }

    try {
      await pc.addIceCandidate(candidate);
    } catch {
      // Ignore candidates that race with teardown or stale signaling.
    }
  }

  async function replaceAudioTrack(track: MediaStreamTrack | null) {
    for (const record of peerMapRef.current.values()) {
      await record.audioSender.replaceTrack(track);
    }
  }

  async function replaceVideoTrack(track: MediaStreamTrack | null) {
    for (const record of peerMapRef.current.values()) {
      await record.videoSender.replaceTrack(track);
    }
  }

  function closePeer(peerId: string) {
    const record = peerMapRef.current.get(peerId);
    if (!record) {
      return;
    }

    record.pc.ontrack = null;
    record.pc.onicecandidate = null;
    record.pc.onconnectionstatechange = null;
    record.isClosed = true;
    record.pc.close();
    peerMapRef.current.delete(peerId);
    remoteStreamsRef.current.delete(peerId);
    pendingIceRef.current.delete(peerId);
  }

  function closeAll() {
    for (const peerId of [...peerMapRef.current.keys()]) {
      closePeer(peerId);
    }
  }

  return {
    addIceCandidate,
    closeAll,
    closePeer,
    createOffer,
    ensureConnection,
    handleAnswer,
    handleOffer,
    replaceAudioTrack,
    replaceVideoTrack,
  };
}
