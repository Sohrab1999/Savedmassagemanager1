// F5 (A-3.1) — pure URL detection for the capture content field.
//
// Contract (roadmap #4 F5):
//   • Detection is a SUGGESTION only — it never blocks, rewrites or mutates
//     the user's text (D4: type selection is never mandatory; P2/N10: saving
//     stays free).
//   • The matcher is intentionally conservative: the WHOLE trimmed text must
//     be a single http(s) URL. A URL buried inside a longer note is not
//     suggested (no noisy false positives) — the paste-into-title auto-
//     convert (S2) already covers the common whole-paste case, and F5 covers
//     the content-field case with the same exactness spirit as N10 v1.
//   • This regex is the SAME shape the capture dialog itself validates link
//     URLs with, so every accepted suggestion passes the save validation.

const WHOLE_TEXT_URL = /^https?:\/\/\S+$/i;
/** Defense-in-depth length cap for a prefill/suggestion URL. */
export const MAX_CAPTURE_URL_LENGTH = 2048;

/** Returns the URL when the (trimmed) text IS exactly one http(s) URL. */
export function firstUrlInText(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > MAX_CAPTURE_URL_LENGTH) return null;
  return WHOLE_TEXT_URL.test(trimmed) ? trimmed : null;
}

/** Same matcher used by the capture save-validation and the S2 paste flow. */
export function isHttpUrl(text: string): boolean {
  return /^https?:\/\/.+/i.test(text.trim());
}
