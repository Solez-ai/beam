import { ROOM_CODE_CHARSET, ROOM_CODE_LENGTH } from "@/lib/constants";

export function sanitizeRoomCode(input: string) {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function validateRoomCode(input: string) {
  const sanitized = sanitizeRoomCode(input);
  if (sanitized.length !== ROOM_CODE_LENGTH) {
    return false;
  }

  return [...sanitized].every((char) => ROOM_CODE_CHARSET.includes(char));
}

export function generateRoomCode() {
  const bytes = new Uint32Array(ROOM_CODE_LENGTH);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (value) => ROOM_CODE_CHARSET[value % ROOM_CODE_CHARSET.length]).join("");
}

