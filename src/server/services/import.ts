// N2 — demo import service: merge a Savedbox export payload into the local
// Prisma/SQLite store inside ONE transaction.
//
// Invariants (roadmap #2 N2):
//   • Import NEVER deletes or updates an existing record — it only creates.
//   • Duplicates are skipped (never re-created): key = type|title|url.
//   • Categories match by slug, tags by name (ids are remapped — export ids
//     belong to another device/mode).
//   • Invalid items are skipped and counted, not fatal.
//   • Array caps live in import-schema.ts (data-flood protection).

import { db } from "@/lib/db";
import {
  importCategorySchema,
  importNoteSchema,
  importNoteTagNames,
  type ImportNoteInput,
} from "@/lib/domain/import-schema";
import type { ImportReport } from "@/lib/domain/types";

function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || "category";
}

/** Duplicate key — exact type+title+url equality keeps false positives at
 * zero while still catching genuine re-imports (round-trip = all skipped). */
function duplicateKey(note: { type: string; title: string; url: string | null }): string {
  return `${note.type}\u0000${note.title.trim()}\u0000${note.url ?? ""}`;
}

export class ImportValidationError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

export async function importData(
  payload: { categories?: unknown[]; tags?: unknown[]; notes: unknown[] },
  userId: string,
): Promise<ImportReport> {
  const report: ImportReport = {
    ok: true,
    notesAdded: 0,
    notesSkippedDuplicates: 0,
    notesSkippedInvalid: 0,
    categoriesAdded: 0,
    tagsAdded: 0,
  };

  await db.$transaction(async (tx) => {
    // -- 1. Categories: slug → existing server id; missing ones are created.
    const slugToId = new Map<string, string>();
    const existingCategories = await tx.category.findMany({
      select: { id: true, slug: true },
    });
    for (const category of existingCategories) slugToId.set(category.slug, category.id);

    let maxOrder = await tx.category.aggregate({ _max: { order: true } });
    let nextOrder = (maxOrder._max.order ?? 0) + 1;

    // Export-local category id → server category id (for note remapping).
    const localCategoryIdToSlug = new Map<string, string>();
    const rawCategories = payload.categories ?? [];
    for (const raw of rawCategories) {
      const parsed = importCategorySchema.safeParse(raw);
      if (!parsed.success) continue;
      const input = parsed.data;
      if (input.id) localCategoryIdToSlug.set(input.id, input.slug ?? slugify(input.name));
      const slug = input.slug ?? slugify(input.name);
      if (slugToId.has(slug)) continue;
      const created = await tx.category.create({
        data: {
          slug,
          name: input.name,
          nameFa: input.nameFa ?? null,
          icon: input.icon || "folder",
          color: input.color || "#0d9488",
          order: input.order ?? nextOrder,
        },
        select: { id: true, slug: true },
      });
      nextOrder += 1;
      slugToId.set(created.slug, created.id);
      report.categoriesAdded += 1;
    }

    // -- 2. Tags: union of the payload tag list and every note's tag names;
    // missing names are created up-front (Tag.name is unique).
    const wantedTagNames = new Set<string>();
    for (const raw of payload.tags ?? []) {
      const name = (raw as { name?: unknown })?.name;
      if (typeof name === "string" && name.trim()) wantedTagNames.add(name.trim());
    }
    for (const raw of payload.notes) {
      const parsed = importNoteSchema.safeParse(raw);
      if (!parsed.success) continue;
      for (const name of importNoteTagNames(parsed.data.tags)) {
        wantedTagNames.add(name);
      }
    }
    const existingTags = await tx.tag.findMany({ select: { name: true } });
    const existingTagNames = new Set(existingTags.map((tag) => tag.name));
    const missingTagNames = [...wantedTagNames].filter((name) => !existingTagNames.has(name));
    if (missingTagNames.length > 0) {
      // Names were pre-filtered against existing tags (Tag.name is unique),
      // so a plain createMany cannot collide. (SQLite createMany has no
      // skipDuplicates option — the pre-filter IS the skip.)
      await tx.tag.createMany({
        data: missingTagNames.map((name) => ({ name })),
      });
      report.tagsAdded = missingTagNames.length;
    }

    // -- 3. Notes: validate → dedup → create (never update/delete).
    const existingNotes = await tx.note.findMany({
      where: { deletedAt: null },
      select: { type: true, title: true, url: true },
    });
    const duplicates = new Set(existingNotes.map(duplicateKey));

    for (const raw of payload.notes) {
      const parsed = importNoteSchema.safeParse(raw);
      if (!parsed.success) {
        report.notesSkippedInvalid += 1;
        continue;
      }
      const note: ImportNoteInput = parsed.data;
      const url = note.url || null;
      const key = duplicateKey({ type: note.type, title: note.title, url });
      if (duplicates.has(key)) {
        report.notesSkippedDuplicates += 1;
        continue;
      }

      // Category remapping: payload categoryId → payload category slug →
      // server category id; fallback = the note's embedded category ref.
      let categoryId: string | null = null;
      const localSlug =
        (note.categoryId ? localCategoryIdToSlug.get(note.categoryId) : undefined) ??
        note.category?.slug;
      if (localSlug) categoryId = slugToId.get(localSlug) ?? null;

      const savedAt =
        note.savedAt && !Number.isNaN(Date.parse(note.savedAt))
          ? new Date(note.savedAt)
          : new Date();

      const tagNames = importNoteTagNames(note.tags);
      await tx.note.create({
        data: {
          type: note.type,
          title: note.title,
          content: note.content ?? null,
          description: note.description ?? null,
          url,
          mediaUrl: note.mediaUrl ?? null,
          fileName: note.fileName ?? null,
          fileSize: note.fileSize ?? null,
          mediaDuration: note.mediaDuration ?? null,
          sourceChat: note.sourceChat ?? null,
          sourceType: note.sourceType ?? "manual",
          categoryId,
          isFavorite: note.isFavorite ?? false,
          isArchived: note.isArchived ?? false,
          deletedAt: null,
          savedAt,
          userId,
          tags: {
            create: tagNames.map((name) => ({
              tag: { connectOrCreate: { where: { name }, create: { name } } },
            })),
          },
        },
        select: { id: true },
      });
      duplicates.add(key); // de-duplicate inside the same payload too
      report.notesAdded += 1;
    }
  });

  return report;
}
