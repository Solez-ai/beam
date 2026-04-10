import { beforeEach, describe, expect, it } from "vitest";
import {
  clearStoredDisplayName,
  getStoredDisplayName,
  setStoredDisplayName,
} from "@/lib/session";

describe("session storage helpers", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("writes and reads the Beam display name", () => {
    setStoredDisplayName("Samin");
    expect(getStoredDisplayName()).toBe("Samin");
  });

  it("clears the stored display name", () => {
    setStoredDisplayName("Beam");
    clearStoredDisplayName();
    expect(getStoredDisplayName()).toBe("");
  });
});

