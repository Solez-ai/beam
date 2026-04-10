"use client";

import { useEffect, useRef, useState } from "react";
import {
  RECONNECT_ATTEMPTS,
  RECONNECT_BASE_DELAY_MS,
} from "@/lib/constants";
import { getSignalingUrl } from "@/lib/getSignalingUrl";
import type { InboundSignal, OutboundSignal } from "@/types";

type SignalingStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

interface UseSignalingOptions {
  clientInstanceId: string;
  enabled: boolean;
  roomCode: string;
  displayName: string;
  onMessage: (message: InboundSignal) => void;
}

export function useSignaling({
  clientInstanceId,
  displayName,
  enabled,
  onMessage,
  roomCode,
}: UseSignalingOptions) {
  const [status, setStatus] = useState<SignalingStatus>("idle");
  const socketRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const manualCloseRef = useRef(false);
  const queueRef = useRef<OutboundSignal[]>([]);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  function flushQueue(socket: WebSocket) {
    for (const message of queueRef.current) {
      socket.send(JSON.stringify(message));
    }
    queueRef.current = [];
  }

  function connect() {
    if (!enabled) {
      return;
    }

    setStatus(retryCountRef.current > 0 ? "reconnecting" : "connecting");
    const socket = new WebSocket(getSignalingUrl());
    socketRef.current = socket;

    socket.onopen = () => {
      retryCountRef.current = 0;
      setStatus("connected");
      socket.send(
        JSON.stringify({
          type: "join",
          roomCode,
          displayName,
          clientInstanceId,
        } satisfies OutboundSignal),
      );
      flushQueue(socket);
    };

    socket.onmessage = (event) => {
      try {
        onMessageRef.current(JSON.parse(event.data) as InboundSignal);
      } catch {
        onMessageRef.current({
          type: "error",
          message: "A malformed message was received from the signaling server.",
        });
      }
    };

    socket.onerror = () => {
      if (socket.readyState !== WebSocket.CLOSED) {
        socket.close();
      }
    };

    socket.onclose = () => {
      socketRef.current = null;

      if (manualCloseRef.current || !enabled) {
        setStatus("disconnected");
        return;
      }

      if (retryCountRef.current >= RECONNECT_ATTEMPTS) {
        setStatus("disconnected");
        onMessageRef.current({
          type: "error",
          message: "The signaling connection dropped and could not be restored.",
        });
        return;
      }

      const delay = RECONNECT_BASE_DELAY_MS * 2 ** retryCountRef.current;
      retryCountRef.current += 1;
      setStatus("reconnecting");
      reconnectTimerRef.current = window.setTimeout(() => connect(), delay);
    };
  }

  function send(message: OutboundSignal) {
    const payload = JSON.stringify(message);

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(payload);
      return;
    }

    queueRef.current.push(message);
  }

  useEffect(() => {
    if (!enabled) {
      manualCloseRef.current = true;
      socketRef.current?.close();
      socketRef.current = null;
      return;
    }

    manualCloseRef.current = false;
    connect();

    return () => {
      manualCloseRef.current = true;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [clientInstanceId, displayName, enabled, roomCode]);

  return {
    send,
    status,
  };
}
