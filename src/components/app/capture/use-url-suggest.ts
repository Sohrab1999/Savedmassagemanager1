"use client";

// F5 (A-3.1) — the URL-in-text SUGGESTION state for the capture dialog.
//
// Contract:
//   • Suggestion only — NEVER blocking, never destructive (D4/P2/N10).
//   • Fires only while the form type is `text` (the S2 title-paste flow owns
//     the title field; this owns the content field) and the WHOLE trimmed
//     content is exactly one http(s) URL (see url-detection.ts).
//   • Dismissal («keep as text») is remembered PER suggested URL: editing to
//     a different URL re-arms the suggestion; clearing the text resets it.

import { useState } from "react";
import { firstUrlInText } from "@/lib/capture/url-detection";

export interface UrlSuggestState {
  /** The suggested URL, or null when nothing is suggested (dismissed,
   * cleared, or the form type is no longer `text`). */
  suggestedUrl: string | null;
  /** Soft dismiss — the save stays exactly as the user typed it. */
  dismiss: () => void;
}

export function useUrlSuggest(
  type: "text" | "link" | "image" | "video" | "file",
  content: string,
): UrlSuggestState {
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  const suggestedUrl = type === "text" ? firstUrlInText(content) : null;

  // Render-phase state adjustment (the established app pattern, e.g. the
  // capture dialog's own open-transition block): re-arm per changed URL.
  if (suggestedUrl !== lastSeen) {
    setLastSeen(suggestedUrl);
    if (!suggestedUrl) setDismissedFor(null);
  }

  const visible = Boolean(suggestedUrl) && suggestedUrl !== dismissedFor;

  return {
    suggestedUrl: visible ? suggestedUrl : null,
    dismiss: () => {
      if (suggestedUrl) setDismissedFor(suggestedUrl);
    },
  };
}
