"use client";

import { create } from "zustand";

interface BeamStore {
  displayName: string;
  isParticipantsPanelOpen: boolean;
  copyLinkStatus: "idle" | "copied";
  setDisplayName: (displayName: string) => void;
  toggleParticipantsPanel: () => void;
  closeParticipantsPanel: () => void;
  setCopyLinkStatus: (status: "idle" | "copied") => void;
}

export const useBeamStore = create<BeamStore>((set) => ({
  displayName: "",
  isParticipantsPanelOpen: false,
  copyLinkStatus: "idle",
  setDisplayName: (displayName) => set({ displayName }),
  toggleParticipantsPanel: () =>
    set((state) => ({
      isParticipantsPanelOpen: !state.isParticipantsPanelOpen,
    })),
  closeParticipantsPanel: () => set({ isParticipantsPanelOpen: false }),
  setCopyLinkStatus: (copyLinkStatus) => set({ copyLinkStatus }),
}));

