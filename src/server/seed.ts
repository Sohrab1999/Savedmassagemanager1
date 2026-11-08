// Seed service: deterministic reset to the realistic sample content.
// Used by POST /api/seed and scripts/seed.ts.

import { db } from "@/lib/db";
import { seedCategories, seedNotes, seedTags } from "./seed-data";

export interface SeedCounts {
  notes: number;
  categories: number;
  tags: number;
}

export async function resetSeed(options?: { extraNotes?: number }): Promise<SeedCounts> {
  await db.noteTag.deleteMany();
  await db.note.deleteMany();
  await db.tag.deleteMany();
  await db.category.deleteMany();
  await db.user.deleteMany();

  await db.user.create({
    data: { displayName: "سهراب", username: "sohrab", locale: "fa" },
  });

  const categoryIdBySlug = new Map<string, string>();
  for (const category of seedCategories) {
    const created = await db.category.create({ data: { ...category } });
    categoryIdBySlug.set(category.slug, created.id);
  }

  const tagIdByName = new Map<string, string>();
  for (const name of seedTags) {
    const created = await db.tag.create({ data: { name } });
    tagIdByName.set(name, created.id);
  }

  let noteCount = 0;
  for (const note of seedNotes) {
    const { categorySlug, tagNames, minutesAgo, ...fields } = note;
    await db.note.create({
      data: {
        ...fields,
        savedAt: new Date(Date.now() - minutesAgo * 60_000),
        categoryId: categorySlug ? (categoryIdBySlug.get(categorySlug) ?? null) : null,
        tags: {
          create: tagNames
            .map((name) => ({ tagId: tagIdByName.get(name) }))
            .filter((row): row is { tagId: string } => Boolean(row.tagId)),
        },
      },
    });
    noteCount += 1;
  }

  // S1 — scale scenario (demo-only, opt-in via POST /api/seed {extraNotes}):
  // deterministic filler notes so pagination/search correctness can be verified
  // at 600+ items without polluting the default sample (default = none).
  const extraNotes = Math.min(Math.max(Math.trunc(options?.extraNotes ?? 0), 0), 1000);
  const fillerTypes = ["text", "link", "image", "video", "file"] as const;
  for (let i = 1; i <= extraNotes; i += 1) {
    const type = fillerTypes[i % fillerTypes.length];
    const marker = i % 7 === 0 ? " نمونه‌جستجو" : "";
    await db.note.create({
      data: {
        type,
        title: `یادداشت آزمایشی ${i}${marker}`,
        content:
          type === "text"
            ? `متن آزمایشی شمارهٔ ${i} برای سناریوی مقیاس.${marker}`
            : null,
        url: type === "link" ? `https://example.com/item/${i}` : null,
        mediaUrl: type === "image" ? `https://example.com/img/${i}.jpg` : null,
        sourceType: "manual",
        savedAt: new Date(Date.now() - (i * 137) % (90 * 24 * 60) * 60_000),
        categoryId:
          i % 3 === 0
            ? (categoryIdBySlug.get(seedCategories[i % seedCategories.length].slug) ?? null)
            : null,
        isFavorite: i % 11 === 0,
        isArchived: i % 13 === 0,
      },
    });
    noteCount += 1;
  }

  return {
    notes: noteCount,
    categories: seedCategories.length,
    tags: seedTags.length,
  };
}
