import {
  CLIENT_INSTANCE_STORAGE_KEY,
  DISPLAY_NAME_STORAGE_KEY,
} from "@/lib/constants";

function createClientInstanceId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `beam-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getStoredDisplayName() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.sessionStorage.getItem(DISPLAY_NAME_STORAGE_KEY) ?? "";
}

export function setStoredDisplayName(name: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(DISPLAY_NAME_STORAGE_KEY, name.trim());
}

export function clearStoredDisplayName() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(DISPLAY_NAME_STORAGE_KEY);
}

export function getClientInstanceId() {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.sessionStorage.getItem(CLIENT_INSTANCE_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const nextId = createClientInstanceId();
  window.sessionStorage.setItem(CLIENT_INSTANCE_STORAGE_KEY, nextId);
  return nextId;
}
