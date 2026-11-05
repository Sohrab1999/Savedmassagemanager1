"use client";

// Dual-mode data source: the single gateway used by the UI's query layer.
//
//   • Authenticated (verified Firebase session) → Cloud Firestore repository
//     (real per-UID persistence, see src/services/repository.ts).
//   • No session → the local demo API (sample data over Prisma). This is the
//     explicitly identified development/demo mode; its sample data is shared,
//     device-local and never associated with a user account.

import * as repository from "@/services/repository";
import { getCurrentUser } from "@/services/firebase";
import { apiRoutes } from "@/lib/api";
import type {
  CategoryDTO,
  CreateNoteInput,
  NoteDTO,
  NoteFilters,
  NoteListResponse,
  ProfileDTO,
  StatsDTO,
  TagDTO,
  UpdateNoteInput,
} from "@/domain/types";

export type DataMode = "cloud" | "demo";

/** "cloud" only when a verified Firebase user exists at call time. */
export function currentDataMode(): DataMode {
  return getCurrentUser() ? "cloud" : "demo";
}

export const dataSource = {
  stats: (): Promise<StatsDTO> =>
    getCurrentUser() ? repository.getStats() : apiRoutes.stats(),

  listNotes: (filters: NoteFilters): Promise<NoteListResponse> =>
    getCurrentUser()
      ? repository.listNotes(filters)
      : apiRoutes.listNotes(filters),

  getNote: (id: string): Promise<NoteDTO> =>
    getCurrentUser() ? repository.getNote(id) : apiRoutes.getNote(id),

  createNote: (input: CreateNoteInput): Promise<NoteDTO> =>
    getCurrentUser()
      ? repository.createNote(input)
      : apiRoutes.createNote(input),

  updateNote: (id: string, input: UpdateNoteInput): Promise<NoteDTO> =>
    getCurrentUser()
      ? repository.updateNote(id, input)
      : apiRoutes.updateNote(id, input),

  deleteNote: (id: string): Promise<{ ok: true }> =>
    getCurrentUser()
      ? repository.deleteNote(id)
      : apiRoutes.deleteNote(id),

  restoreNote: (id: string): Promise<{ ok: true }> =>
    getCurrentUser()
      ? repository.restoreNote(id)
      : apiRoutes.restoreNote(id),

  listCategories: (): Promise<{ items: CategoryDTO[] }> =>
    getCurrentUser()
      ? repository.listCategories()
      : apiRoutes.listCategories(),

  createCategory: (input: {
    name: string;
    nameFa?: string | null;
    icon?: string;
    color?: string;
  }): Promise<CategoryDTO> =>
    getCurrentUser()
      ? repository.createCategory(input)
      : apiRoutes.createCategory(input),

  updateCategory: (
    id: string,
    input: { name?: string; nameFa?: string | null; icon?: string; color?: string },
  ): Promise<CategoryDTO> =>
    getCurrentUser()
      ? repository.updateCategory(id, input)
      : apiRoutes.updateCategory(id, input),

  deleteCategory: (id: string): Promise<{ ok: true }> =>
    getCurrentUser()
      ? repository.deleteCategory(id)
      : apiRoutes.deleteCategory(id),

  listTags: (): Promise<{ items: TagDTO[] }> =>
    getCurrentUser() ? repository.listTags() : apiRoutes.listTags(),

  createTag: (input: { name: string }): Promise<TagDTO> =>
    getCurrentUser() ? repository.createTag(input) : apiRoutes.createTag(input),

  deleteTag: (id: string): Promise<{ ok: true }> =>
    getCurrentUser() ? repository.deleteTag(id) : apiRoutes.deleteTag(id),

  getProfile: (): Promise<ProfileDTO> =>
    getCurrentUser() ? repository.getProfile() : apiRoutes.getProfile(),

  updateProfile: (input: {
    displayName?: string;
    username?: string | null;
    locale?: string;
    theme?: string | null;
  }): Promise<ProfileDTO> =>
    getCurrentUser()
      ? repository.updateProfile(input)
      : apiRoutes.updateProfile(input),
};
