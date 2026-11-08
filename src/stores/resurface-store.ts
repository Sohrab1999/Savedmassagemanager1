"use client";

// N7 — Resurfacing preference («خاموشی ماندگار» per the owner-ordered card).
// A per-device toggle persisted in localStorage — deliberately NOT a profile
// field: v1 keeps the data schema untouched (recorded DoD decision). The
// default is ON; hydrate() syncs the persisted value after mount (SSR-safe:
// the server snapshot is always the deterministic default).

import { create } from "zustand";

const STORAGE_KEY = "savedbox.resurface.enabled";

interface ResurfaceState {
  /** Server snapshot: enabled (deterministic; hydrated from localStorage
   * after mount — no hydration mismatch). */
  enabled: boolean;
  hydrated: boolean;
  hydrate: () => void;
  setEnabled: (enabled: boolean) => void;
}

function readPersisted(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw !== "0";
  } catch {
    return true;
  }
}

export const useResurfaceStore = create<ResurfaceState>((set, get) => ({
  enabled: true,
  hydrated: false,
  hydrate: () => {
    if (get().hydrated || typeof window === "undefined") return;
    set({ enabled: readPersisted(), hydrated: true });
  },
  setEnabled: (enabled) => {
    set({ enabled, hydrated: true });
    try {
      window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
    } catch {
      /* private mode — preference is best-effort */
    }
  },
}));
