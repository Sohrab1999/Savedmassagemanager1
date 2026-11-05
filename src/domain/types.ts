// Firestore document schemas for the TeleVault data layer.
//
// Shared domain DTOs (used by both the API layer and the UI) are re-exported
// unchanged from src/lib/domain/types.ts. The *Doc interfaces below describe
// the exact shape of documents stored under `users/{uid}/…` in Cloud
// Firestore; timestamps are epoch-milliseconds (number) so that
// firestore.rules can validate them without casts.

export * from "@/lib/domain/types";

import type {
  CategoryDTO,
  NoteType,
  ProfileDTO,
} from "@/lib/domain/types";

/** Firestore collection names (always nested under the owner's UID). */
export const FS_PATHS = {
  users: "users",
  notes: "notes",
  categories: "categories",
  tags: "tags",
} as const;

export interface TagRefDoc {
  id: string;
  name: string;
}

export interface CategoryRefDoc {
  id: string;
  slug: string;
  name: string;
  nameFa: string | null;
  icon: string;
  color: string;
}

export interface NoteDoc {
  type: NoteType;
  title: string;
  content: string | null;
  description: string | null;
  url: string | null;
  mediaUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  mediaDuration: number | null;
  sourceChat: string | null;
  sourceType: "manual" | "telegram";
  categoryId: string | null;
  category: CategoryRefDoc | null;
  tags: TagRefDoc[];
  isFavorite: boolean;
  isArchived: boolean;
  /** S5 — soft delete: epoch-ms of the moment the note moved to the trash;
   * null while live. Optional so pre-G1 documents stay valid (rules keep the
   * field optional). */
  deletedAt?: number | null;
  savedAt: number;
  updatedAt: number;
}

export interface CategoryDoc {
  slug: string;
  name: string;
  nameFa: string | null;
  icon: string;
  color: string;
  order: number;
  createdAt: number;
}

export interface TagDoc {
  name: string;
  createdAt: number;
}

export interface ProfileDoc {
  displayName: string;
  username: string | null;
  locale: string;
  theme: string | null;
  createdAt: number;
  updatedAt: number;
}

/** Convenience aliases so the repository and rules stay name-aligned. */
export type { CategoryDTO, NoteType, ProfileDTO };

/** Error thrown by repository calls when no verified session exists. */
export class AuthRequiredError extends Error {
  constructor() {
    super("auth-required");
    this.name = "AuthRequiredError";
  }
}

/** Error thrown when a referenced document does not exist (API 404 parity). */
export class NotFoundError extends Error {
  constructor(kind: string) {
    super(`${kind}-not-found`);
    this.name = "NotFoundError";
  }
}
