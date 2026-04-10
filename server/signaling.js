/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require("http");
const { randomUUID } = require("crypto");
const { WebSocket, WebSocketServer } = require("ws");
const { createRoomRegistry } = require("./roomState");

const PORT = Number(process.env.PORT || 4511);
const registry = createRoomRegistry();
const sockets = new Map();
const socketMeta = new Map();

function send(socket, message) {
  if (socket.readyState !== WebSocket.OPEN) {
    return;
  }

  socket.send(JSON.stringify(message));
}

function broadcast(roomCode, message, excludePeerId = null) {
  for (const [peerId, socket] of sockets.entries()) {
    const meta = socketMeta.get(socket);
    if (!meta || meta.roomCode !== roomCode || peerId === excludePeerId) {
      continue;
    }

    send(socket, message);
  }
}

function relayToPeer(targetPeerId, message) {
  const socket = sockets.get(targetPeerId);
  if (!socket) {
    return false;
  }

  send(socket, message);
  return true;
}

function handleDeparture(peerId) {
  const result = registry.leave(peerId);
  const socket = sockets.get(peerId);
  if (socket) {
    socketMeta.delete(socket);
  }
  sockets.delete(peerId);

  if (!result?.participant) {
    return;
  }

  broadcast(result.roomCode, {
    type: "peer-left",
    peerId,
  });

  if (result.shareEnded) {
    broadcast(result.roomCode, {
      type: "share-ended",
      peerId,
    });
  }

  if (result.nextHostId) {
    broadcast(result.roomCode, {
      type: "host-changed",
      hostId: result.nextHostId,
    });
  }
}

const server = createServer((_, response) => {
  response.writeHead(200, { "Content-Type": "text/plain" });
  response.end("Beam signaling server");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (socket) => {
  const peerId = randomUUID();
  sockets.set(peerId, socket);

  socket.on("message", (raw) => {
    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch {
      send(socket, { type: "error", message: "Invalid signaling payload." });
      return;
    }

    try {
      switch (message.type) {
        case "join": {
          const roomInfo = registry.join(
            message.roomCode,
            peerId,
            message.displayName,
            message.clientInstanceId,
          );
          socketMeta.set(socket, { peerId, roomCode: roomInfo.roomCode });

          if (roomInfo.replacedPeerId) {
            const previousSocket = sockets.get(roomInfo.replacedPeerId);
            if (previousSocket && previousSocket !== socket) {
              sockets.delete(roomInfo.replacedPeerId);
              socketMeta.delete(previousSocket);
              previousSocket.close();
            }

            broadcast(roomInfo.roomCode, {
              type: "peer-left",
              peerId: roomInfo.replacedPeerId,
            });
          }

          send(socket, {
            type: "room-info",
            selfId: peerId,
            hostId: roomInfo.hostId,
            activeSharerId: roomInfo.activeSharerId,
            participants: roomInfo.participants,
          });

          if (roomInfo.hostId === peerId) {
            send(socket, {
              type: "host-assigned",
              peerId,
            });
          }

          broadcast(
            roomInfo.roomCode,
            {
              type: "peer-joined",
              participant: registry.getParticipantSnapshot(peerId),
            },
            peerId,
          );
          break;
        }
        case "offer":
        case "answer":
        case "ice-candidate": {
          relayToPeer(message.toPeerId, {
            ...message,
            fromPeerId: peerId,
          });
          break;
        }
        case "participant-state": {
          const updated = registry.updateParticipantState(peerId, message);
          broadcast(
            updated.roomCode,
            {
              type: "participant-state",
              peerId,
              audioEnabled: updated.participant.audioEnabled,
              videoEnabled: updated.participant.videoEnabled,
              isSharingScreen: updated.participant.isSharingScreen,
            },
            peerId,
          );
          break;
        }
        case "control-mute":
        case "control-remove":
        case "control-stop-share":
        case "control-transfer-host": {
          if (!registry.isHost(peerId)) {
            send(socket, { type: "error", message: "Only the host can perform that action." });
            return;
          }

          if (message.type === "control-transfer-host") {
            const result = registry.transferHost(peerId, message.toPeerId);
            if (!result) {
              send(socket, { type: "error", message: "Host transfer failed." });
              return;
            }

            broadcast(result.roomCode, {
              type: "host-changed",
              hostId: result.hostId,
            });
            break;
          }

          relayToPeer(message.toPeerId, {
            type: message.type,
            fromPeerId: peerId,
          });
          break;
        }
        case "share-request": {
          const currentSharer = registry.getActiveSharer(peerId);
          if (!currentSharer || currentSharer.peerId === peerId) {
            send(socket, {
              type: "error",
              message: "No active sharer is available to yield the screen.",
            });
            return;
          }

          relayToPeer(currentSharer.peerId, {
            type: "share-request",
            requesterId: peerId,
            requesterName: registry.getParticipant(peerId)?.displayName ?? "Guest",
          });
          break;
        }
        case "share-response": {
          relayToPeer(message.toPeerId, {
            type: "share-response",
            fromPeerId: peerId,
            accepted: message.accepted,
          });
          break;
        }
        case "share-ended": {
          const cleared = registry.clearShare(peerId);
          if (!cleared) {
            break;
          }

          broadcast(cleared.roomCode, {
            type: "share-ended",
            peerId,
          });
          break;
        }
        case "leave": {
          socket.close();
          break;
        }
        default:
          send(socket, { type: "error", message: "Unsupported signaling message." });
      }
    } catch (error) {
      send(socket, {
        type: "error",
        message: error instanceof Error ? error.message : "Unexpected signaling error.",
      });
    }
  });

  socket.on("close", () => {
    handleDeparture(peerId);
  });
});

server.listen(PORT, () => {
  console.log(`Beam signaling server listening on port ${PORT}`);
});

server.on("error", (error) => {
  if (error && error.code === "EADDRINUSE") {
    console.error(
      `Beam signaling could not start because port ${PORT} is already in use. Set PORT and NEXT_PUBLIC_SIGNALING_URL to a free port.`,
    );
    return;
  }

  console.error("Beam signaling server failed to start.", error);
});
