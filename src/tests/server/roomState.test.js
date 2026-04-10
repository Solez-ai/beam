import { describe, expect, it } from "vitest";
import roomState from "../../../server/roomState.js";

const { createRoomRegistry } = roomState;

describe("roomState", () => {
  it("assigns the first participant as host", () => {
    const registry = createRoomRegistry();
    const result = registry.join("AB23PQ", "peer-1", "Samin");

    expect(result.hostId).toBe("peer-1");
    expect(result.participants).toHaveLength(1);
    expect(result.participants[0].isHost).toBe(true);
  });

  it("transfers host when the current host leaves", () => {
    const registry = createRoomRegistry();
    registry.join("AB23PQ", "peer-1", "Samin");
    registry.join("AB23PQ", "peer-2", "Alex");

    const departure = registry.leave("peer-1");

    expect(departure.nextHostId).toBe("peer-2");
    expect(registry.getRoom("AB23PQ").hostId).toBe("peer-2");
  });

  it("validates host transfer operations", () => {
    const registry = createRoomRegistry();
    registry.join("AB23PQ", "peer-1", "Samin");
    registry.join("AB23PQ", "peer-2", "Alex");

    expect(registry.transferHost("peer-2", "peer-1")).toBeNull();
    expect(registry.transferHost("peer-1", "peer-2").hostId).toBe("peer-2");
  });

  it("rejects a second active screen share", () => {
    const registry = createRoomRegistry();
    registry.join("AB23PQ", "peer-1", "Samin");
    registry.join("AB23PQ", "peer-2", "Alex");
    registry.updateParticipantState("peer-1", {
      audioEnabled: true,
      videoEnabled: true,
      isSharingScreen: true,
    });

    expect(() =>
      registry.updateParticipantState("peer-2", {
        audioEnabled: true,
        videoEnabled: true,
        isSharingScreen: true,
      }),
    ).toThrow("Another participant is already sharing");
  });

  it("removes the room when the final participant leaves", () => {
    const registry = createRoomRegistry();
    registry.join("AB23PQ", "peer-1", "Samin");
    registry.leave("peer-1");

    expect(registry.getRoom("AB23PQ")).toBeNull();
  });
});
