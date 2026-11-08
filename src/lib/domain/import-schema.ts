// N2 — JSON import validation (the counterpart of the /api/export format).
//
// SHARED module: used by BOTH the demo backend (POST /api/import) and the
// cloud repository (client-side pre-validation before batched writes), so
// both backends enforce the exact same acceptance rules.
//
// Two export shapes must be accepted (honest device/mode migration):
//   • Demo export  (/api/export):        { app: "savedbox", version: 1, categories: raw[],
//                                         tags: raw[], notes: raw[] & { tags: string[] } }
//   • Cloud export (Settings → Export):  { source: "firestore", categories: CategoryDTO[],
//                                         tags: TagDTO[], notes: NoteDTO[] (tags: TagRef[]) }
//
// Guardrails against a hostile/fabricated file (roadmap #2 N2 risk): hard
// array caps + a required Savedbox marker + per-item strict validation.
// Invalid ITEMS are skipped and counted (the report), not fatal — a corrupt
// FILE (wrong marker, missing notes array, oversized) is a causal 400.

import { z } from "zod";

// Array caps — data-flood protection (Firestore per-UID quota stays sane;
// the demo SQLite import stays inside one transaction comfortably).
export const IMPORT_MAX_NOTES = 1000;
export const IMPORT_MAX_CATEGORIES = 200;
export const IMPORT_MAX_TAGS = 500;

const optionalTrimmed = (max: number) =>
  z.string().trim().max(max).optional().nullable();

const httpUrl = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((value) => !value || /^https?:\/\/.+/i.test(value), {
      message: "invalid-url",
    })
    .optional()
    .nullable();

export const importCategorySchema = z.object({
  id: z.string().trim().max(128).optional(),
  slug: z.string().trim().min(1).max(80).optional(),
  name: z.string().trim().min(1).max(60),
  nameFa: optionalTrimmed(60),
  icon: z.string().trim().max(40).optional(),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  order: z.number().int().min(0).optional(),
});

export const importTagSchema = z.object({
  id: z.string().trim().max(128).optional(),
  name: z.string().trim().min(1).max(60),
});

/** Tag entries appear as plain names (demo export) or {id,name} refs
 * (cloud NoteDTO) — both accepted, normalized to names. */
const tagEntry = z.union([
  z.string().trim().min(1).max(60),
  z.object({ name: z.string().trim().min(1).max(60) }),
]);

const isoDate = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: "invalid-date" });

export const importNoteSchema = z.object({
  type: z.enum(["text", "link", "image", "video", "file"]),
  title: z.string().trim().min(1).max(200),
  content: optionalTrimmed(10000),
  description: optionalTrimmed(4000),
  url: httpUrl(2000),
  // Cloud exports carry Storage download URLs; demo exports /api/files/…
  // paths — both are accepted as-is (metadata, never executed).
  mediaUrl: z.string().trim().max(2000).optional().nullable(),
  fileName: optionalTrimmed(255),
  fileSize: z.number().int().positive().max(2_000_000_000).optional().nullable(),
  mediaDuration: z.number().int().positive().max(86_400).optional().nullable(),
  sourceChat: optionalTrimmed(120),
  sourceType: z.enum(["manual", "telegram"]).optional(),
  isFavorite: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  // Exports cover the LIVE library only (trashed notes are on their 7-day
  // way out) — a non-null deletedAt is therefore always file corruption.
  deletedAt: z.null().optional(),
  savedAt: isoDate.optional(),
  tags: z.array(tagEntry).max(30).optional(),
  categoryId: z.string().trim().max(128).optional().nullable(),
  category: z
    .object({
      id: z.string().trim().max(128).optional(),
      slug: z.string().trim().min(1).max(80).optional(),
      name: z.string().trim().max(60).optional(),
    })
    .optional(),
});

export const importPayloadSchema = z
  .object({
    app: z.literal("savedbox").optional(),
    source: z.literal("firestore").optional(),
    version: z.number().optional(),
    exportedAt: z.string().optional(),
    profile: z.unknown().optional(),
    categories: z.array(z.unknown()).max(IMPORT_MAX_CATEGORIES).optional(),
    tags: z.array(z.unknown()).max(IMPORT_MAX_TAGS).optional(),
    notes: z.array(z.unknown()).min(1).max(IMPORT_MAX_NOTES),
  })
  .refine((data) => data.app === "savedbox" || data.source === "firestore", {
    message: "not-a-savedbox-export",
  });

export type ImportCategoryInput = z.infer<typeof importCategorySchema>;
export type ImportNoteInput = z.infer<typeof importNoteSchema>;

/** Normalizes a note's tag entries to plain trimmed names. */
export function importNoteTagNames(
  tags: Array<string | { name: string }> | undefined,
): string[] {
  if (!tags) return [];
  const names: string[] = [];
  for (const entry of tags) {
    const name = (typeof entry === "string" ? entry : entry.name).trim();
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}
