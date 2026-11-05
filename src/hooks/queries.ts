"use client";

// TanStack Query hooks: single source of server-state access for the UI.
//
// Every read/write dispatches through `dataSource`, which targets the real
// Cloud Firestore repository when a verified Firebase session exists and the
// local demo API (sample data) otherwise. Cache keys are scoped by the
// verified UID so different users never share cached entries.

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { dataSource, currentDataMode } from "@/services/data-source";
import { getCurrentUser } from "@/services/firebase";
import { ApiError } from "@/lib/api/client";
import type { LibraryFiltersState } from "@/stores/app-store";
import type {
  CategoryDTO,
  NoteDTO,
  NoteFilters,
  ProfileDTO,
  TagDTO,
} from "@/lib/domain/types";

/** Cache scope: the verified UID (cloud) or the demo bucket. */
function scopeKey(): string {
  return getCurrentUser()?.uid ?? "demo";
}

export const qk = {
  stats: () => ["stats", scopeKey()] as const,
  notes: (filters: LibraryFiltersState) => ["notes", scopeKey(), filters] as const,
  note: (id: string) => ["note", scopeKey(), id] as const,
  categories: () => ["categories", scopeKey()] as const,
  tags: () => ["tags", scopeKey()] as const,
  profile: () => ["profile", scopeKey()] as const,
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
  return useQuery({ queryKey: qk.stats(), queryFn: () => dataSource.stats() });
}

/** S1 — paginated notes list. One 30-item page per queryFn call; the UI appends
 * pages via fetchNextPage ("load more"). Filter changes reset automatically
 * because the filters object is part of the cache key. NOTE: no
 * `placeholderData` here — keeping the previous InfiniteData across filter
 * changes renders stale accumulated pages and duplicates keys. */
export function useNotes(filters: LibraryFiltersState) {
  return useInfiniteQuery({
    queryKey: qk.notes(filters),
    queryFn: ({ pageParam }) =>
      dataSource.listNotes({ ...toApiFilters(filters), pageToken: pageParam || undefined }),
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useNote(id: string | null) {
  return useQuery({
    queryKey: qk.note(id ?? ""),
    queryFn: () => dataSource.getNote(id as string),
    enabled: Boolean(id),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: qk.categories(),
    queryFn: () => dataSource.listCategories(),
  });
}

export function useTags() {
  return useQuery({ queryKey: qk.tags(), queryFn: () => dataSource.listTags() });
}

export function useProfile() {
  return useQuery({
    queryKey: qk.profile(),
    queryFn: () => dataSource.getProfile(),
  });
}

export function useDataMode() {
  return currentDataMode();
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
    queryClient.invalidateQueries({ queryKey: ["stats"] });
    // S7: category/tag note-counts are derived from the same notes data, so
    // any note mutation can change them (create with tags, archive, delete…).
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["tags"] });
  };
}

type Mutation<TInput, TOutput> = UseMutationResult<TOutput, ApiError, TInput>;

export function useCreateNote(): Mutation<
  Parameters<typeof dataSource.createNote>[0],
  NoteDTO
> {
  const invalidate = useInvalidateNotes();
  return useMutation({
    mutationFn: dataSource.createNote,
    onSuccess: () => invalidate(),
  });
}

export function useUpdateNote(): Mutation<
  { id: string; patch: Parameters<typeof dataSource.updateNote>[1] },
  NoteDTO
> {
  const invalidate = useInvalidateNotes();
  return useMutation({
    mutationFn: ({ id, patch }) => dataSource.updateNote(id, patch),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteNote(): Mutation<string, { ok: true }> {
  const invalidate = useInvalidateNotes();
  return useMutation({
    mutationFn: dataSource.deleteNote,
    onSuccess: () => invalidate(),
  });
}

export function useCreateCategory(): Mutation<
  Parameters<typeof dataSource.createCategory>[0],
  CategoryDTO
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dataSource.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useUpdateCategory(): Mutation<
  { id: string; patch: Parameters<typeof dataSource.updateCategory>[1] },
  CategoryDTO
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }) => dataSource.updateCategory(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["note"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useDeleteCategory(): Mutation<string, { ok: true }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dataSource.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["note"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useCreateTag(): Mutation<
  Parameters<typeof dataSource.createTag>[0],
  TagDTO
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dataSource.createTag,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tags"] }),
  });
}

export function useDeleteTag(): Mutation<string, { ok: true }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dataSource.deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["note"] });
    },
  });
}

export function useUpdateProfile(): Mutation<
  Parameters<typeof dataSource.updateProfile>[0],
  ProfileDTO
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dataSource.updateProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useResetSeed(): Mutation<
  void,
  { ok: true; counts: { notes: number; categories: number; tags: number } }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiResetSeed(),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

/** Sample-data reset is demo-only; refuse it for authenticated users. */
async function apiResetSeed() {
  if (getCurrentUser()) {
    throw new ApiError(403, "demo-mode-only");
  }
  const { apiRoutes } = await import("@/lib/api");
  return apiRoutes.resetSeed();
}
