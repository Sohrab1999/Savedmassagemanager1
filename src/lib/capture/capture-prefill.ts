// F1 + F2 — pure parsing/sanitizing of EXTERNAL capture-channel payloads
// (the PWA Web Share Target GET query and the `#/capture` bookmarklet
// deep-link). Both channels feed the SAME one-step capture flow — they only
// prefill fields; nothing is ever executed, fetched or HTML-rendered from
// these values (XSS: React escapes text values; no innerHTML anywhere).
//
// Canonicalization (one place, both channels):
//   • `url` — kept ONLY if it is a plain http(s) URL (same shape the capture
//     dialog validates); capped at 2048 chars. Invalid URLs are DROPPED, not
//     fixed (the hash/query is untrusted input — same rule as the S3 hash).
//   • `text` — when no explicit url exists and the text itself is exactly one
//     http(s) URL (the common Android share shape: the URL lives inside the
//     text), it is MOVED to url. Otherwise text stays content text.
//   • `title` — trimmed, capped (the dialog enforces the real cap).
//   • Length caps everywhere: oversized fields are truncated, never rejected
//     (the save step remains the single validation boundary).

import { firstUrlInText, MAX_CAPTURE_URL_LENGTH } from "@/lib/capture/url-detection";

export interface CapturePrefill {
  source: "share" | "deeplink";
  url?: string;
  title?: string;
  text?: string;
}

const MAX_TITLE_LENGTH = 200;
const MAX_TEXT_LENGTH = 4000;

function sanitizeUrl(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > MAX_CAPTURE_URL_LENGTH) return undefined;
  return /^https?:\/\/\S+$/i.test(trimmed) ? trimmed : undefined;
}

function sanitizeText(raw: string | null | undefined, cap: number): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  return trimmed.length > cap ? trimmed.slice(0, cap) : trimmed;
}

/** `#/capture?…` query string → prefill (possibly all-empty: plain dialog). */
export function parseCaptureQuery(query: string): CapturePrefill {
  const params = new URLSearchParams(query);
  const prefill: CapturePrefill = {
    source: "deeplink",
    url: sanitizeUrl(params.get("url")),
    title: sanitizeText(params.get("title"), MAX_TITLE_LENGTH),
    text: sanitizeText(params.get("text"), MAX_TEXT_LENGTH),
  };
  if (!prefill.url) {
    // No explicit (valid) URL: a text that IS a URL becomes the URL — the
    // Android-style share shape. Remaining text (if any) stays text.
    const moved = firstUrlInText(prefill.text ?? "");
    if (moved) {
      prefill.url = moved;
      prefill.text = moved === (prefill.text ?? "").trim() ? undefined : prefill.text;
    }
  }
  return prefill;
}

/** Web Share Target GET params (`/?title=…&text=…&url=…`) → prefill, or
 * `null` when nothing share-shaped is present (plain dialog, never forced). */
export function capturePrefillFromShareParams(params: {
  url: string | null;
  title: string | null;
  text: string | null;
}): CapturePrefill | null {
  const prefill: CapturePrefill = {
    source: "share",
    url: sanitizeUrl(params.url),
    title: sanitizeText(params.title, MAX_TITLE_LENGTH),
    text: sanitizeText(params.text, MAX_TEXT_LENGTH),
  };
  if (!prefill.url) {
    const moved = firstUrlInText(prefill.text ?? "");
    if (moved) {
      prefill.url = moved;
      prefill.text = moved === (prefill.text ?? "").trim() ? undefined : prefill.text;
    }
  }
  if (!prefill.url && !prefill.title && !prefill.text) return null;
  return prefill;
}

/** Pure mapping prefill → capture-form fields (F1/F2 → the existing flow). */
export interface PrefillFormPatch {
  type: "link" | "text";
  title: string;
  url: string;
  content: string;
  linkDetected: boolean;
}

export function prefillFormPatch(prefill: CapturePrefill | null): PrefillFormPatch | null {
  if (!prefill) return null;
  const url = prefill.url ?? "";
  const title = prefill.title ?? "";
  const text = prefill.text ?? "";
  // An all-empty payload (e.g. `#/capture` with no params) is NOT a prefill —
  // the dialog must look exactly like the plain FAB entry (F2 DoD).
  if (!url && !title && !text) return null;
  return {
    type: url ? "link" : "text",
    title,
    url,
    content: text,
    linkDetected: Boolean(url),
  };
}
