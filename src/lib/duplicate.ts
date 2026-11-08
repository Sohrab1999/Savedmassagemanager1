// N10 — capture-time duplicate detection (soft warning, NO AI, NO blocking).
//
// Owner card: pasting a link that is already saved shows a soft banner
// («این آیتم در «…» ذخیره شده — مشاهده») and saving again stays free. The v1
// false-positive mitigation is owner-ordered: EXACT matches only — a
// canonicalized-URL equality and an N3-normalized title equality. No
// substring/fuzzy matching, no auto-deletion, and the result never blocks a
// capture.
//
// This module is client+server safe (dependency-free except the N3 folder):
// the demo service (server/services/notes.ts) and the cloud repository
// (services/repository.ts, over the G1 live array) BOTH funnel through
// `findDuplicate` — the single matching source for the two backends, mirroring
// the lib/related.ts precedent.

import { normalizePersian } from "./persian";
import type { DuplicateCheckInput, DuplicateMatchOn, NoteDTO } from "@/lib/domain/types";

/** A duplicate hit: the existing note the new capture collides with, and
 * which field produced the match (URL wins over title when both match). */
export interface DuplicateHit {
  note: NoteDTO;
  matchOn: DuplicateMatchOn;
}

/** Query parameters that only TRACK a click, never identify the page.
 * Stripped during canonicalization so «the same article with a Telegram /
 * campaign stamp» is still recognized as the same item (deterministic, not
 * fuzzy — v1 stays owner-exact on everything else). */
const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "fbclid",
  "gclid",
  "igshid",
  "ref_src",
  "ref_url",
  "si", // YouTube share stamp
];

/** Canonical comparison form of a URL, or null when the input is not an
 * http(s) URL. Documented canonical form (the owner can audit every rule):
 *   • scheme kept (http vs https stay distinct — conservative-exact);
 *   • host lower-cased, one leading "www." dropped;
 *   • trailing slashes stripped ("/" path → empty);
 *   • hash dropped; tracking params dropped; remaining query pairs sorted.
 * Everything else (path, query values, port) must be IDENTICAL to match. */
export function normalizeUrlForCompare(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return null;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const port = parsed.port ? `:${parsed.port}` : "";
  const path = parsed.pathname.replace(/\/+$/, "");
  const params = [...parsed.searchParams.entries()]
    .filter(([key]) => !TRACKING_PARAMS.includes(key.toLowerCase()))
    .sort(([a], [b]) => a.localeCompare(b));
  const qs = new URLSearchParams(params).toString();
  return `${parsed.protocol}//${host}${port}${path}${qs ? `?${qs}` : ""}`;
}

/** Finds the existing note a new capture collides with, if any.
 *
 * Rules (v1, recorded decisions):
 *   • trashed candidates are skipped — a deleted item is not library
 *     pollution (re-saving from the trash is a restore flow, not a duplicate);
 *   • archived candidates ARE included — archived items still live in the
 *     library and re-saving them is exactly the accidental duplicate case;
 *   • URL match (canonicalized equality) wins over title match;
 *   • title match = N3-folded EXACT equality (Arabic ی/ي/ك variants fold, so
 *     «راهنماى …» matches «راهنمای …» — the owner DoD forbids Persian/Arabic
 *     false negatives; the N3 rule "compare-only, never rewrite" holds);
 *   • several matches → the newest saved one (deterministic + most relevant).
 * Returns null when nothing matches — the UI then renders nothing at all. */
export function findDuplicate(
  candidates: NoteDTO[],
  input: DuplicateCheckInput,
): DuplicateHit | null {
  const normalizedUrl = input.url ? normalizeUrlForCompare(input.url) : null;
  const normalizedTitle = input.title ? normalizePersian(input.title) : "";

  if (normalizedUrl) {
    const urlMatches = candidates.filter(
      (note) =>
        !note.deletedAt &&
        note.url !== null &&
        normalizeUrlForCompare(note.url) === normalizedUrl,
    );
    if (urlMatches.length > 0) {
      const newest = urlMatches.reduce((a, b) => (a.savedAt >= b.savedAt ? a : b));
      return { note: newest, matchOn: "url" };
    }
  }

  if (normalizedTitle) {
    const titleMatches = candidates.filter(
      (note) =>
        !note.deletedAt &&
        note.title.trim() !== "" &&
        normalizePersian(note.title) === normalizedTitle,
    );
    if (titleMatches.length > 0) {
      const newest = titleMatches.reduce((a, b) => (a.savedAt >= b.savedAt ? a : b));
      return { note: newest, matchOn: "title" };
    }
  }

  return null;
}
