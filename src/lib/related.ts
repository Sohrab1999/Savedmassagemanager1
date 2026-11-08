// N6 — Related notes (co-occurrence scoring, NO AI).
//
// Personal-knowledge-network discovery: the note detail sheet shows up to 3
// items that genuinely share tags or a category with the open note. The
// scorer is PURE and shared by both backends (demo service + cloud live
// array) so the ranking can never drift between modes.
//
// Honesty rules (owner-ordered):
//  • type overlap ALONE never qualifies — a suggestion must have at least one
//    REAL shared tag or a shared category (quality guard for small libraries);
//  • the feature is labelled «بدون AI» in the UI and the docs — it is a
//    deterministic cache-based join, nothing more;
//  • soft-deleted (trashed) notes are never suggested; archived notes are
//    (they are still part of the knowledge graph — DoD decision).

import type { NoteDTO } from "@/lib/domain/types";

/** Weights: shared tag = high, shared category = medium, shared type = low. */
export const RELATED_WEIGHTS = { tag: 3, category: 2, type: 1 } as const;

/** Default suggestion cap (roadmap card: «حداکثر ۳ پیشنهاد»). */
export const RELATED_LIMIT = 3;

export interface RelatedScore {
  note: NoteDTO;
  score: number;
}

/** Scores every qualifying pool note against `current`, best-first.
 * A note qualifies ONLY with ≥1 shared tag or a shared category. */
export function scoreRelated(current: NoteDTO, pool: NoteDTO[]): RelatedScore[] {
  const tagIds = new Set(current.tags.map((tag) => tag.id));
  const categoryId = current.categoryId ?? null;
  const scores: RelatedScore[] = [];

  for (const note of pool) {
    if (note.id === current.id) continue;
    if (note.deletedAt !== null) continue;

    const sharedTags = note.tags.filter((tag) => tagIds.has(tag.id)).length;
    const sharedCategory = categoryId !== null && note.categoryId === categoryId;
    if (sharedTags === 0 && !sharedCategory) continue;

    const score =
      sharedTags * RELATED_WEIGHTS.tag +
      (sharedCategory ? RELATED_WEIGHTS.category : 0) +
      (note.type === current.type ? RELATED_WEIGHTS.type : 0);
    scores.push({ note, score });
  }

  scores.sort(
    (a, b) =>
      b.score - a.score || b.note.savedAt.localeCompare(a.note.savedAt),
  );
  return scores;
}

/** Top-`limit` related notes for `current`, or [] when nothing genuinely
 * connects (the UI hides the section entirely in that case). */
export function relatedNotes(
  current: NoteDTO,
  pool: NoteDTO[],
  limit: number = RELATED_LIMIT,
): NoteDTO[] {
  return scoreRelated(current, pool)
    .slice(0, limit)
    .map((entry) => entry.note);
}
