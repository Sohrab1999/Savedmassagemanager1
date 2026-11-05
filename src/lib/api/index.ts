// Typed endpoint functions consumed by TanStack Query hooks.

import { api } from "./client";
import type {
  CategoryDTO,
  CreateNoteInput,
  NoteDTO,
  NoteFilters,
  NoteListResponse,
  NoteType,
  ProfileDTO,
  StatsDTO,
  TagDTO,
  UpdateNoteInput,
} from "@/lib/domain/types";

function buildNotesQuery(filters: NoteFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.type && filters.type !== "all") params.set("type", filters.type);
  if (filters.categoryId && filters.categoryId !== "all")
    params.set("categoryId", filters.categoryId);
  if (filters.tagIds?.length) params.set("tagIds", filters.tagIds.join(","));
  if (filters.favorite) params.set("favorite", "true");
  if (filters.archived !== undefined)
    params.set("archived", String(filters.archived));
  if (filters.trash) params.set("trash", "true");
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.pageToken) params.set("pageToken", filters.pageToken);
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const apiRoutes = {
  stats: () => api<StatsDTO>("/api/stats"),
  listNotes: (filters: NoteFilters) =>
    api<NoteListResponse>(`/api/notes${buildNotesQuery(filters)}`),
  getNote: (id: string) => api<NoteDTO>(`/api/notes/${id}`),
  createNote: (input: CreateNoteInput) =>
    api<NoteDTO>("/api/notes", { method: "POST", body: JSON.stringify(input) }),
  updateNote: (id: string, input: UpdateNoteInput) =>
    api<NoteDTO>(`/api/notes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  deleteNote: (id: string) =>
    api<{ ok: true }>(`/api/notes/${id}`, { method: "DELETE" }),
  restoreNote: (id: string) =>
    api<{ ok: true }>(`/api/notes/${id}/restore`, { method: "POST" }),

  listCategories: () => api<{ items: CategoryDTO[] }>("/api/categories"),
  createCategory: (input: {
    name: string;
    nameFa?: string | null;
    icon?: string;
    color?: string;
  }) => api<CategoryDTO>("/api/categories", {
    method: "POST",
    body: JSON.stringify(input),
  }),
  updateCategory: (
    id: string,
    input: { name?: string; nameFa?: string | null; icon?: string; color?: string },
  ) => api<CategoryDTO>(`/api/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  }),
  deleteCategory: (id: string) =>
    api<{ ok: true }>(`/api/categories/${id}`, { method: "DELETE" }),

  listTags: () => api<{ items: TagDTO[] }>("/api/tags"),
  createTag: (input: { name: string }) =>
    api<TagDTO>("/api/tags", { method: "POST", body: JSON.stringify(input) }),
  deleteTag: (id: string) =>
    api<{ ok: true }>(`/api/tags/${id}`, { method: "DELETE" }),

  getProfile: () => api<ProfileDTO>("/api/profile"),
  updateProfile: (input: {
    displayName?: string;
    username?: string | null;
    locale?: string;
    theme?: string | null;
  }) => api<ProfileDTO>("/api/profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  }),

  resetSeed: () =>
    api<{ ok: true; counts: { notes: number; categories: number; tags: number } }>(
      "/api/seed",
      { method: "POST" },
    ),

  exportData: async (): Promise<void> => {
    const response = await fetch("/api/export");
    if (!response.ok) throw new Error(`export failed: ${response.status}`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `savedbox-export-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  },
};

export type { NoteType };
