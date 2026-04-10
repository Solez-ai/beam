const ROOM_CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_CODE_LENGTH = 6;

function isValidRoomCode(roomCode) {
  return (
    typeof roomCode === "string" &&
    roomCode.length === ROOM_CODE_LENGTH &&
    [...roomCode].every((char) => ROOM_CODE_CHARSET.includes(char))
  );
}

function createRoomRegistry() {
  const rooms = new Map();
  const peerToRoom = new Map();

  function toPublicParticipant(participant) {
    return {
      peerId: participant.peerId,
      displayName: participant.displayName,
      isHost: participant.isHost,
      audioEnabled: participant.audioEnabled,
      videoEnabled: participant.videoEnabled,
      isSharingScreen: participant.isSharingScreen,
    };
  }

  function getRoom(roomCode) {
    return rooms.get(roomCode) ?? null;
  }

  function getParticipant(peerId) {
    const roomCode = peerToRoom.get(peerId);
    if (!roomCode) {
      return null;
    }

    const room = rooms.get(roomCode);
    if (!room) {
      return null;
    }

    return room.participants.get(peerId) ?? null;
  }

  function getRoomByPeer(peerId) {
    const roomCode = peerToRoom.get(peerId);
    return roomCode ? rooms.get(roomCode) ?? null : null;
  }

  function join(roomCode, peerId, displayName, clientInstanceId) {
    if (!isValidRoomCode(roomCode)) {
      throw new Error("Invalid room code");
    }

    const normalizedRoomCode = roomCode.toUpperCase();
    const room =
      rooms.get(normalizedRoomCode) ??
      {
        activeSharerId: null,
        hostId: "",
        participants: new Map(),
        roomCode: normalizedRoomCode,
      };

    const existingParticipant = clientInstanceId
      ? [...room.participants.values()].find(
          (participant) =>
            participant.clientInstanceId === clientInstanceId && participant.peerId !== peerId,
        )
      : null;

    if (existingParticipant) {
      room.participants.delete(existingParticipant.peerId);
      peerToRoom.delete(existingParticipant.peerId);

      if (room.hostId === existingParticipant.peerId) {
        room.hostId = peerId;
      }

      if (room.activeSharerId === existingParticipant.peerId) {
        room.activeSharerId = peerId;
      }
    }

    const participant = {
      peerId,
      clientInstanceId,
      displayName,
      isHost: existingParticipant ? existingParticipant.isHost : room.participants.size === 0,
      audioEnabled: existingParticipant ? existingParticipant.audioEnabled : false,
      videoEnabled: existingParticipant ? existingParticipant.videoEnabled : false,
      isSharingScreen: existingParticipant ? existingParticipant.isSharingScreen : false,
    };

    room.participants.set(peerId, participant);
    if (!room.hostId) {
      room.hostId = peerId;
      participant.isHost = true;
    }

    rooms.set(normalizedRoomCode, room);
    peerToRoom.set(peerId, normalizedRoomCode);

    return {
      activeSharerId: room.activeSharerId,
      hostId: room.hostId,
      participants: [...room.participants.values()].map(toPublicParticipant),
      replacedPeerId: existingParticipant?.peerId ?? null,
      roomCode: normalizedRoomCode,
    };
  }

  function leave(peerId) {
    const roomCode = peerToRoom.get(peerId);
    if (!roomCode) {
      return null;
    }

    const room = rooms.get(roomCode);
    if (!room) {
      peerToRoom.delete(peerId);
      return null;
    }

    const participant = room.participants.get(peerId);
    room.participants.delete(peerId);
    peerToRoom.delete(peerId);

    let nextHostId = null;
    if (room.hostId === peerId) {
      nextHostId = [...room.participants.keys()][0] ?? null;
      room.hostId = nextHostId ?? "";
      for (const value of room.participants.values()) {
        value.isHost = value.peerId === nextHostId;
      }
    }

    let shareEnded = false;
    if (room.activeSharerId === peerId) {
      room.activeSharerId = null;
      shareEnded = true;
    }

    if (room.participants.size === 0) {
      rooms.delete(roomCode);
    }

    return {
      nextHostId,
      participant,
      roomCode,
      shareEnded,
      stillExists: room.participants.size > 0,
    };
  }

  function updateParticipantState(peerId, state) {
    const participant = getParticipant(peerId);
    const room = getRoomByPeer(peerId);
    if (!participant || !room) {
      return null;
    }

    participant.audioEnabled = state.audioEnabled;
    participant.videoEnabled = state.videoEnabled;
    participant.isSharingScreen = state.isSharingScreen;

    if (state.isSharingScreen) {
      if (room.activeSharerId && room.activeSharerId !== peerId) {
        throw new Error("Another participant is already sharing");
      }
      room.activeSharerId = peerId;
    } else if (room.activeSharerId === peerId) {
      room.activeSharerId = null;
    }

    return {
      activeSharerId: room.activeSharerId,
      participant: { ...participant },
      roomCode: room.roomCode,
    };
  }

  function clearShare(peerId) {
    const participant = getParticipant(peerId);
    const room = getRoomByPeer(peerId);
    if (!participant || !room) {
      return null;
    }

    participant.isSharingScreen = false;
    if (room.activeSharerId === peerId) {
      room.activeSharerId = null;
    }

    return {
      roomCode: room.roomCode,
      activeSharerId: room.activeSharerId,
      participant: { ...participant },
    };
  }

  function transferHost(fromPeerId, toPeerId) {
    const room = getRoomByPeer(fromPeerId);
    if (!room || room.hostId !== fromPeerId) {
      return null;
    }

    const nextHost = room.participants.get(toPeerId);
    if (!nextHost) {
      return null;
    }

    room.hostId = toPeerId;
    for (const participant of room.participants.values()) {
      participant.isHost = participant.peerId === toPeerId;
    }

    return {
      hostId: room.hostId,
      roomCode: room.roomCode,
    };
  }

  function isHost(peerId) {
    const room = getRoomByPeer(peerId);
    return Boolean(room && room.hostId === peerId);
  }

  function getActiveSharer(peerId) {
    const room = getRoomByPeer(peerId);
    if (!room || !room.activeSharerId) {
      return null;
    }

    return room.participants.get(room.activeSharerId) ?? null;
  }

  function getRoomCodeForPeer(peerId) {
    return peerToRoom.get(peerId) ?? null;
  }

  return {
    clearShare,
    getActiveSharer,
    getParticipant,
    getParticipantSnapshot(peerId) {
      const participant = getParticipant(peerId);
      return participant ? toPublicParticipant(participant) : null;
    },
    getRoom,
    getRoomCodeForPeer,
    isHost,
    isValidRoomCode,
    join,
    leave,
    transferHost,
    updateParticipantState,
  };
}

module.exports = {
  createRoomRegistry,
  isValidRoomCode,
};
