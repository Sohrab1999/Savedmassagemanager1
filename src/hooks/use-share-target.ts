"use client";

// F1 — Web Share Target intake (client side of the manifest's GET binding).
//
// The installed app receives shared content as a plain `/?title=…&text=…&url=…`
// page load. This hook runs ONCE per page load (AppShell mount), maps the
// query through the shared prefill sanitizer and opens the SAME QuickCapture
// dialog — one-step save, N10 banner and the B6 CTA stay untouched. The query
// is stripped immediately (history.replaceState), so refresh and browser
// back/forward never re-open the dialog from a stale share.
//
// Honest scoping (recorded in the F2/F1 settings card too):
//   • Works in the INSTALLED PWA on Android/desktop Chromium; plain tabs see
//     no share sheet — the deep-link route (F2) is the desktop equivalent.
//   • iOS Safari does not support share targets yet (platform limitation).

import { useEffect } from "react";
import { capturePrefillFromShareParams } from "@/lib/capture/capture-prefill";
import { useAppStore } from "@/stores/app-store";

export function useShareTarget(): void {
  const openCapture = useAppStore((state) => state.openCapture);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get("url");
    const title = params.get("title");
    const text = params.get("text");
    // Only react to a genuinely share-shaped load: at least one of the three
    // target params must carry a value (foreign query params never trigger;
    // empty-string params fall through to a plain capture).
    if (!url && !title && !text) return;
    const prefill = capturePrefillFromShareParams({ url, title, text });
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.hash,
    );
    openCapture(prefill ?? undefined);
    // Idempotent: after the first run the query is gone, so re-runs no-op.
    // (zustand actions are stable references.)
  }, [openCapture]);
}
