// Zod schemas shared by API routes (validation boundary of the backend).

import { z } from "zod";

export const noteTypeSchema = z.enum(["text", "link", "image", "video", "file"]);

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

export const createNoteSchema = z.object({
  type: noteTypeSchema,
  title: z.string().trim().min(1).max(200),
  content: optionalTrimmed(10000),
  description: optionalTrimmed(4000),
  url: httpUrl(2000),
  mediaUrl: z
    .string()
    .trim()
    .max(2000)
    .refine((value) => !value || /^(https?:\/\/|\/)/i.test(value), {
      message: "invalid-url",
    })
    .optional()
    .nullable(),
  fileName: optionalTrimmed(255),
  fileSize: z.number().int().positive().max(2_000_000_000).optional().nullable(),
  mediaDuration: z.number().int().positive().max(86_400).optional().nullable(),
  sourceChat: optionalTrimmed(120),
  sourceType: z.enum(["manual", "telegram"]).default("manual"),
  categoryId: optionalTrimmed(64),
  tagNames: z.array(z.string().trim().min(1).max(60)).max(24).optional(),
});

export const updateNoteSchema = createNoteSchema.partial().extend({
  isFavorite: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

// S6 — bulk operations. Max 500 ids = the Firestore writeBatch ceiling, so one
// request maps to at most one committed batch on both backends.
export const bulkNoteActionSchema = z.enum([
  "categorize",
  "archive",
  "unarchive",
  "delete",
  "restore",
]);

export const bulkNoteSchema = z
  .object({
    ids: z.array(z.string().trim().min(1).max(128)).min(1).max(500),
    action: bulkNoteActionSchema,
    /** categorize: `null` = uncategorize (move to "none"). Ignored otherwise. */
    categoryId: z.string().trim().max(64).nullable().optional(),
  })
  .refine((data) => data.action !== "categorize" || data.categoryId !== undefined, {
    message: "category-required",
  });

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(60),
  nameFa: optionalTrimmed(60),
  icon: z.string().trim().min(1).max(40).default("folder"),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#0d9488"),
  order: z.number().int().min(0).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createTagSchema = z.object({
  name: z.string().trim().min(1).max(60),
});

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  username: optionalTrimmed(60),
  locale: z.enum(["fa", "en"]).optional(),
  theme: z.enum(["light", "dark", "system"]).nullable().optional(),
});
