import { describe, expect, it, vi } from "vitest";
import {
  generateRoomCode,
  sanitizeRoomCode,
  validateRoomCode,
} from "@/lib/generateRoomCode";

describe("generateRoomCode", () => {
  it("creates a six-character code from Beam's allowed charset", () => {
    vi.spyOn(globalThis.crypto, "getRandomValues").mockImplementation((buffer) => {
      const view = buffer as Uint32Array;
      view.set([0, 1, 2, 3, 4, 5]);
      return buffer;
    });

    expect(generateRoomCode()).toBe("ABCDEF");
  });
});

describe("room code validation", () => {
  it("uppercases and strips unsupported characters", () => {
    expect(sanitizeRoomCode("ab-12pq")).toBe("AB12PQ");
  });

  it("accepts valid Beam room codes", () => {
    expect(validateRoomCode("AB23PQ")).toBe(true);
  });

  it("rejects invalid length or unsupported characters", () => {
    expect(validateRoomCode("SHORT")).toBe(false);
    expect(validateRoomCode("ABC1O2")).toBe(false);
  });
});

