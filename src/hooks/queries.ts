"use client";

// TanStack Query hooks: single source of server-state access for the UI.

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { apiRoutes } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { LibraryFiltersState } from "@/stores/app-store";
import type {
  CategoryDTO,
  NoteDTO,
  NoteFilters,
  ProfileDTO,
  StatsDTO,
  TagDTO,
} from "@/lib/domain/types";

export const qk = {
  stats: ["stats"] as const,
  notes: (filters: LibraryFiltersState) => ["notes", filters] as const,
  note: (id: string) => ["note", id] as const,
  categories: ["categories"] as const,
  tags: ["tags"] as const,
  profile: ["profile"] as const,
};

function toApiFilters(filters: LibraryFiltersState): NoteFilters {
  return {
    q: filters.q || undefined,
    type: filters.type,
    categoryId: filters.categoryId,
    tagIds: filters.tagIds.length ? filters.tagIds : undefined,
    favorite: filters.favorite || undefined,
    archived: filters.archived,
    sort: filters.sort,
  };
}

export function useStats() {
  return useQuery({ queryKey: qk.stats, queryFn: apiRoutes.stats });
}

export function useNotes(filters: LibraryFiltersState) {
  return useQuery({
    queryKey: qk.notes(filters),
    queryFn: () => apiRoutes.listNotes(toApiFilters(filters)),
    placeholderData: (previous) => previous,
  });
}

export function useNote(id: string | null) {
  return useQuery({
    queryKey: qk.note(id ?? ""),
    queryFn: () => apiRoutes.getNote(id as string),
    enabled: Boolean(id),
  });
}

export function useCategories() {
  return useQuery({ queryKey: qk.categories, queryFn: apiRoutes.listCategories });
}

export function useTags() {
  return useQuery({ queryKey: qk.tags, queryFn: apiRoutes.listTags });
}

export function useProfile() {
  return useQuery({ queryKey: qk.profile, queryFn: apiRoutes.getProfile });
}

export function useInvalidateAll() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries();
}

export function useInvalidateNotes() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["notes"] });
    queryClient.invalidateQueries({ queryKey: ["note"] });
    queryClient.invalidateQueries({ queryKey: qk.stats });
  };
}

type Mutation<TInput, TOutput> = UseMutationResult<TOutput, ApiError, TInput>;

export function useCreateNote(): Mutation<
  Parameters<typeof apiRoutes.createNote>[0],
  NoteDTO
> {
  const invalidate = useInvalidateNotes();
  return useMutation({
    mutationFn: apiRoutes.createNote,
    onSuccess: () => invalidate(),
  });
}

export function useUpdateNote(): Mutation<
  { id: string; patch: Parameters<typeof apiRoutes.updateNote>[1] },
  NoteDTO
> {
  const invalidate = useInvalidateNotes();
  return useMutation({
    mutationFn: ({ id, patch }) => apiRoutes.updateNote(id, patch),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteNote(): Mutation<string, { ok: true }> {
  const invalidate = useInvalidateNotes();
  return useMutation({
    mutationFn: apiRoutes.deleteNote,
    onSuccess: () => invalidate(),
  });
}

export function useCreateCategory(): Mutation<
  Parameters<typeof apiRoutes.createCategory>[0],
  CategoryDTO
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiRoutes.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.categories });
      queryClient.invalidateQueries({ queryKey: qk.stats });
    },
  });
}

export function useUpdateCategory(): Mutation<
  { id: string; patch: Parameters<typeof apiRoutes.updateCategory>[1] },
  CategoryDTO
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }) => apiRoutes.updateCategory(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.categories });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["note"] });
      queryClient.invalidateQueries({ queryKey: qk.stats });
    },
  });
}

export function useDeleteCategory(): Mutation<string, { ok: true }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiRoutes.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.categories });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["note"] });
      queryClient.invalidateQueries({ queryKey: qk.stats });
    },
  });
}

export function useCreateTag(): Mutation<
  Parameters<typeof apiRoutes.createTag>[0],
  TagDTO
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiRoutes.createTag,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.tags }),
  });
}

export function useDeleteTag(): Mutation<string, { ok: true }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiRoutes.deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.tags });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["note"] });
    },
  });
}

export function useUpdateProfile(): Mutation<
  Parameters<typeof apiRoutes.updateProfile>[0],
  ProfileDTO
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiRoutes.updateProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.profile }),
  });
}

export function useResetSeed(): Mutation<
  void,
  { ok: true; counts: { notes: number; categories: number; tags: number } }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRoutes.resetSeed(),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
