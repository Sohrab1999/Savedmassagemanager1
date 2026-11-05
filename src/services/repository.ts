"use client";

// Firestore repository — real persistence for authenticated users.
//
// Data model (strictly per-user isolated):
//   users/{uid}                      → profile document (ProfileDoc)
//   users/{uid}/notes/{noteId}       → NoteDoc
//   users/{uid}/categories/{catId}   → CategoryDoc
//   users/{uid}/tags/{tagId}         → TagDoc
//
// Security invariants:
//   • Every path is derived from the verified Firebase Auth UID
//     (getFirebaseAuth().currentUser) — this module never accepts a user id
//     as a caller-supplied argument, so client input cannot select another
//     user's subtree.
//   • firestore.rules enforce the same ownership server-side; this module's
//     writes are shaped to satisfy those rules exactly (field sets, types,
//     length caps — see firestore.rules).

import {
  addDoc,
  arrayRemove,
  collection,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentReference,
} from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDb } from "@/services/firebase";
import { realtimeStore, mapNote } from "@/services/realtime";
import {
  AuthRequiredError,
  FS_PATHS,
  NotFoundError,
  type CategoryDTO,
  type CategoryDoc,
  type CategoryRefDoc,
  type CreateNoteInput,
  type NoteDTO,
  type NoteDoc,
  type NoteFilters,
  type NoteListResponse,
  type NoteSort,
  type NoteType,
  type ProfileDTO,
  type ProfileDoc,
  type StatsDTO,
  type TagDTO,
  type TagDoc,
  type TagRefDoc,
  type UpdateNoteInput,
} from "@/domain/types";

// ---------------------------------------------------------------------------
// G1 — Live reads via the realtime store
//
// Every read below resolves from the permanent onSnapshot listener set
// (src/services/realtime.ts) instead of issuing one-shot downloads. The
// listener is uncapped (Silent-Loss = 0) and stays warm across view switches,
// so:
//   • Read cost after the initial stream is ~zero (KPI: ≥ 60 % fewer reads).
//   • Every tab/device sees writes within the push round-trip.
//   • Offline, the same arrays are served from the IndexedDB cache.
// The remaining getDoc calls are targeted fallbacks for documents the
// listener has not surfaced yet (e.g. a note created milliseconds ago on
// another client) and the profile document (not in G1's scope).
// ---------------------------------------------------------------------------

const VALID_TYPES: NoteType[] = ["text", "link", "image", "video", "file"];

/** Starts (idempotent) and awaits the live store for the verified session. */
async function liveNotes(): Promise<NoteDTO[]> {
  const uid = requireUid();
  realtimeStore.start(uid);
  await realtimeStore.ensureReady();
  return realtimeStore.notes;
}

// ---------------------------------------------------------------------------
// Verified-identity plumbing
// ---------------------------------------------------------------------------

function requireUid(): string {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new AuthRequiredError();
  return user.uid;
}

// ---------------------------------------------------------------------------
// S8 — Batched writes
//
// Firestore allows at most 500 operations per writeBatch. Fan-outs (category
// rename/delete, tag delete) previously issued one updateDoc per note via
// Promise.all — up to 500 separate writes that could half-fail and leave
// inconsistent denormalized state. Every fan-out now goes through these
// helpers: chunked batches, each chunk ONE committed write-batch operation.
// ---------------------------------------------------------------------------

const MAX_BATCH_OPS = 500;

type UserRoot = ReturnType<typeof userRoot>;

async function batchedUpdate(
  entries: Array<{ ref: DocumentReference; data: Record<string, unknown> }>,
): Promise<void> {
  if (entries.length === 0) return;
  const db = getFirestoreDb();
  for (let start = 0; start < entries.length; start += MAX_BATCH_OPS) {
    const chunk = entries.slice(start, start + MAX_BATCH_OPS);
    const batch = writeBatch(db);
    for (const entry of chunk) batch.update(entry.ref, entry.data);
    await batch.commit();
  }
}

/** Creates missing tags with client-allocated IDs so the batch can return
 * the new refs without re-reading. */
async function batchedCreateTags(
  names: string[],
  root: UserRoot,
): Promise<TagRefDoc[]> {
  const created: TagRefDoc[] = [];
  const db = getFirestoreDb();
  for (let start = 0; start < names.length; start += MAX_BATCH_OPS) {
    const chunk = names.slice(start, start + MAX_BATCH_OPS);
    const batch = writeBatch(db);
    const allocated = chunk.map((name) => {
      const ref = doc(root.tags);
      batch.set(ref, { name, createdAt: Date.now() } satisfies TagDoc);
      return { id: ref.id, name };
    });
    await batch.commit();
    created.push(...allocated);
  }
  return created;
}

function userRoot(uid: string) {
  const db = getFirestoreDb();
  return {
    profile: doc(db, FS_PATHS.users, uid),
    notes: collection(db, FS_PATHS.users, uid, FS_PATHS.notes),
    categories: collection(db, FS_PATHS.users, uid, FS_PATHS.categories),
    tags: collection(db, FS_PATHS.users, uid, FS_PATHS.tags),
    noteDoc: (id: string) => doc(db, FS_PATHS.users, uid, FS_PATHS.notes, id),
    categoryDoc: (id: string) =>
      doc(db, FS_PATHS.users, uid, FS_PATHS.categories, id),
    tagDoc: (id: string) => doc(db, FS_PATHS.users, uid, FS_PATHS.tags, id),
  };
}

// ---------------------------------------------------------------------------
// Document ↔ DTO mapping (note mapping lives in realtime.ts — G1)
// ---------------------------------------------------------------------------

function mapCategory(
  id: string,
  data: CategoryDoc | Record<string, unknown>,
  noteCount: number,
): CategoryDTO {
  const doc_ = data as unknown as CategoryDoc;
  return {
    id,
    slug: doc_.slug,
    name: doc_.name,
    nameFa: doc_.nameFa ?? null,
    icon: doc_.icon,
    color: doc_.color,
    order: doc_.order ?? 0,
    noteCount,
  };
}

function categoryRefFrom(id: string, data: CategoryDoc): CategoryRefDoc {
  return {
    id,
    slug: data.slug,
    name: data.name,
    nameFa: data.nameFa ?? null,
    icon: data.icon,
    color: data.color,
  };
}

// ---------------------------------------------------------------------------
// Shared filters (Prisma-service parity)
// ---------------------------------------------------------------------------

function matchesText(note: NoteDTO, q: string): boolean {
  const haystack = [note.title, note.content, note.description, note.url, note.fileName, note.sourceChat]
    .filter((value): value is string => Boolean(value))
    .join("\n")
    .toLowerCase();
  return haystack.includes(q);
}

function filterAndSort(notes: NoteDTO[], filters: NoteFilters): NoteDTO[] {
  let items = notes;

  // S5 — view selection first: the trash view shows ONLY soft-deleted notes;
  // every other view hides them entirely.
  items = items.filter((note) =>
    filters.trash ? note.deletedAt !== null : note.deletedAt === null,
  );

  if (filters.q?.trim()) {
    const q = filters.q.trim().toLowerCase();
    items = items.filter((note) => matchesText(note, q));
  }
  if (filters.type && filters.type !== "all" && VALID_TYPES.includes(filters.type)) {
    items = items.filter((note) => note.type === filters.type);
  }
  if (filters.categoryId === "none") {
    items = items.filter((note) => note.categoryId === null);
  } else if (filters.categoryId && filters.categoryId !== "all") {
    items = items.filter((note) => note.categoryId === filters.categoryId);
  }
  if (filters.favorite) items = items.filter((note) => note.isFavorite);
  if (filters.archived !== undefined) {
    items = items.filter((note) => note.isArchived === filters.archived);
  }
  if (filters.tagIds?.length) {
    items = items.filter((note) =>
      filters.tagIds!.every((tagId) => note.tags.some((tag) => tag.id === tagId)),
    );
  }

  const sort: NoteSort = filters.sort ?? "newest";
  const sorted = [...items];
  if (sort === "title") sorted.sort((a, b) => a.title.localeCompare(b.title));
  else if (sort === "oldest")
    sorted.sort((a, b) => a.savedAt.localeCompare(b.savedAt));
  else sorted.sort((a, b) => b.savedAt.localeCompare(a.savedAt));

  return sorted;
}

async function loadCategoryRef(categoryId: string): Promise<CategoryRefDoc | null> {
  await liveNotes(); // keeps the live category docs current
  const live = realtimeStore.categoryDocs.find((entry) => entry.id === categoryId);
  if (live) return categoryRefFrom(live.id, live.data);
  // Fallback for a category created milliseconds ago on another client.
  const root = userRoot(requireUid());
  const snapshot = await getDoc(root.categoryDoc(categoryId));
  if (!snapshot.exists()) return null;
  return categoryRefFrom(snapshot.id, snapshot.data() as unknown as CategoryDoc);
}

/** Tag connectOrCreate semantics, mirroring the Prisma service.
 * S8: ONE indexed `in` query resolves all existing names (rules cap a note's
 * tag list at 30, inside Firestore's 30-value disjunction limit) and missing
 * tags are created in a single writeBatch — previously one round-trip per tag. */
async function resolveTagRefs(names: string[]): Promise<TagRefDoc[]> {
  const wanted: string[] = [];
  const seen = new Set<string>();
  for (const raw of names) {
    const name = raw.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    wanted.push(name);
  }
  if (wanted.length === 0) return [];

  const root = userRoot(requireUid());
  await liveNotes(); // keeps the live tag docs current
  const refs: TagRefDoc[] = [];
  const missing: string[] = [];

  const wantedSet = new Set(wanted);
  const idByName = new Map<string, string>();
  for (const entry of realtimeStore.tagDocs) {
    if (wantedSet.has(entry.data.name)) idByName.set(entry.data.name, entry.id);
  }
  for (const name of wanted) {
    const id = idByName.get(name);
    if (id) refs.push({ id, name });
    else missing.push(name);
  }

  if (missing.length > 0) refs.push(...(await batchedCreateTags(missing, root)));
  return refs;
}

// ---------------------------------------------------------------------------
// Notes (S1 pagination presentation over the G1 live store)
//
// The 30-item page contract is unchanged for the UI (Load more, exact total).
// What changed with G1 is WHERE pages come from: the live local array (one
// permanent listener) instead of per-page server queries. The former
// structured-query path (where/orderBy/startAfter/getCountFromServer) was
// removed with the one-shot reads it served — its guarantees survive:
// uncapped data (no silent loss), exact totals, deterministic offset pages,
// and demo-parity sort semantics enforced in filterAndSort.
// ---------------------------------------------------------------------------

const NOTES_PAGE_SIZE = 30;

/** Numeric offset cursor over the live array. */
function decodeOffset(token: string | undefined): number {
  const parsed = Number.parseInt(token ?? "0", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export async function listNotes(filters: NoteFilters): Promise<NoteListResponse> {
  // G1: pages derive from the live store — no per-page network reads. The
  // function stays async so the UI contract (loading → loaded) is unchanged.
  const notes = await liveNotes();
  const sorted = filterAndSort(notes, filters);
  const pageSize = Math.min(Math.max(filters.pageSize ?? NOTES_PAGE_SIZE, 1), 100);
  const offset = decodeOffset(filters.pageToken);
  const items = sorted.slice(offset, offset + pageSize);
  const next = offset + items.length;
  return {
    items,
    total: sorted.length,
    nextCursor: next < sorted.length ? String(next) : null,
  };
}

export async function getNote(id: string): Promise<NoteDTO> {
  await liveNotes();
  const live = realtimeStore.getNoteById(id);
  if (live) return live;
  // Fallback: the listener may not have surfaced a document written
  // milliseconds ago on another client.
  const root = userRoot(requireUid());
  const snapshot = await getDoc(root.noteDoc(id));
  if (!snapshot.exists()) throw new NotFoundError("note");
  return mapNote(snapshot.id, snapshot.data());
}

export async function createNote(input: CreateNoteInput): Promise<NoteDTO> {
  const root = userRoot(requireUid());
  const now = Date.now();
  const tags = await resolveTagRefs(input.tagNames ?? []);
  const category = input.categoryId ? await loadCategoryRef(input.categoryId) : null;

  const payload: NoteDoc = {
    type: VALID_TYPES.includes(input.type) ? input.type : "text",
    title: input.title.trim(),
    content: input.content ?? null,
    description: input.description ?? null,
    url: input.url || null,
    mediaUrl: input.mediaUrl || null,
    fileName: input.fileName ?? null,
    fileSize: input.fileSize ?? null,
    mediaDuration: input.mediaDuration ?? null,
    sourceChat: input.sourceChat ?? null,
    sourceType: input.sourceType ?? "manual",
    categoryId: category ? category.id : null,
    category,
    tags,
    isFavorite: false,
    isArchived: false,
    deletedAt: null,
    savedAt: now,
    updatedAt: now,
  };

  const created = await addDoc(root.notes, payload);
  return {
    id: created.id,
    type: payload.type,
    title: payload.title,
    content: payload.content,
    description: payload.description,
    url: payload.url,
    mediaUrl: payload.mediaUrl,
    fileName: payload.fileName,
    fileSize: payload.fileSize,
    mediaDuration: payload.mediaDuration,
    sourceChat: payload.sourceChat,
    sourceType: payload.sourceType,
    categoryId: payload.categoryId,
    category: payload.category,
    tags: payload.tags,
    isFavorite: payload.isFavorite,
    isArchived: payload.isArchived,
    deletedAt: null,
    savedAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
  };
}

export async function updateNote(id: string, input: UpdateNoteInput): Promise<NoteDTO> {
  const root = userRoot(requireUid());
  await liveNotes();
  let existing = realtimeStore.getNoteById(id);
  if (!existing) {
    // Fallback for documents the listener has not surfaced yet.
    const snapshot = await getDoc(root.noteDoc(id));
    if (!snapshot.exists()) throw new NotFoundError("note");
    existing = mapNote(snapshot.id, snapshot.data());
  }

  const updatedAt = Date.now();
  const patch: Partial<NoteDoc> = { updatedAt };

  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.content !== undefined) patch.content = input.content;
  if (input.description !== undefined) patch.description = input.description;
  if (input.url !== undefined) patch.url = input.url || null;
  if (input.mediaUrl !== undefined) patch.mediaUrl = input.mediaUrl || null;
  if (input.fileName !== undefined) patch.fileName = input.fileName;
  if (input.fileSize !== undefined) patch.fileSize = input.fileSize;
  if (input.mediaDuration !== undefined) patch.mediaDuration = input.mediaDuration;
  if (input.sourceChat !== undefined) patch.sourceChat = input.sourceChat;
  if (input.type !== undefined && VALID_TYPES.includes(input.type)) patch.type = input.type;
  if (input.isFavorite !== undefined) patch.isFavorite = input.isFavorite;
  if (input.isArchived !== undefined) patch.isArchived = input.isArchived;

  if (input.categoryId !== undefined) {
    const category =
      input.categoryId && input.categoryId !== ""
        ? await loadCategoryRef(input.categoryId)
        : null;
    patch.categoryId = category ? category.id : null;
    patch.category = category;
  }

  if (input.tagNames !== undefined) {
    patch.tags = await resolveTagRefs(input.tagNames);
  }

  await updateDoc(root.noteDoc(id), patch);
  return {
    ...existing,
    ...patch,
    savedAt: existing.savedAt,
    updatedAt: new Date(updatedAt).toISOString(),
  } as NoteDTO;
}

/** S5 — soft delete: the note moves to the trash (deletedAt set) and stays
 * recoverable for 7 days (client-side purge lives in realtime.ts). */
export async function deleteNote(id: string): Promise<{ ok: true }> {
  const root = userRoot(requireUid());
  await liveNotes();
  if (!realtimeStore.getNoteById(id)) {
    const snapshot = await getDoc(root.noteDoc(id));
    if (!snapshot.exists()) throw new NotFoundError("note");
  }
  await updateDoc(root.noteDoc(id), {
    deletedAt: Date.now(),
    updatedAt: Date.now(),
  });
  return { ok: true };
}

/** S5 — undo: leaves the trash (deletedAt cleared). */
export async function restoreNote(id: string): Promise<{ ok: true }> {
  const root = userRoot(requireUid());
  await liveNotes();
  if (!realtimeStore.getNoteById(id)) {
    const snapshot = await getDoc(root.noteDoc(id));
    if (!snapshot.exists()) throw new NotFoundError("note");
  }
  await updateDoc(root.noteDoc(id), {
    deletedAt: null,
    updatedAt: Date.now(),
  });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || "category";
}

export async function listCategories(): Promise<{ items: CategoryDTO[] }> {
  const notes = await liveNotes();

  const counts = new Map<string, number>();
  for (const note of notes) {
    if (note.isArchived || note.deletedAt !== null || !note.categoryId) continue;
    counts.set(note.categoryId, (counts.get(note.categoryId) ?? 0) + 1);
  }

  const items = [...realtimeStore.categoryDocs]
    .sort(
      (a, b) =>
        a.data.order - b.data.order || a.data.createdAt - b.data.createdAt,
    )
    .map((entry) => mapCategory(entry.id, entry.data, counts.get(entry.id) ?? 0));
  return { items };
}

export async function createCategory(input: {
  name: string;
  nameFa?: string | null;
  icon?: string;
  color?: string;
}): Promise<CategoryDTO> {
  const root = userRoot(requireUid());
  await liveNotes();
  const name = input.name.trim() || "Untitled";
  const maxOrder = realtimeStore.categoryDocs.reduce(
    (max, entry) => Math.max(max, entry.data.order ?? 0),
    0,
  );

  // Slug uniqueness within the user's own categories.
  const taken = new Set(realtimeStore.categoryDocs.map((entry) => entry.data.slug));
  let slug = slugify(name);
  while (taken.has(slug)) slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;

  const payload: CategoryDoc = {
    slug,
    name,
    nameFa: input.nameFa ?? null,
    icon: input.icon ?? "folder",
    color: input.color ?? "#0d9488",
    order: maxOrder + 1,
    createdAt: Date.now(),
  };
  const created = await addDoc(root.categories, payload);
  return mapCategory(created.id, payload, 0);
}

export async function updateCategory(
  id: string,
  input: { name?: string; nameFa?: string | null; icon?: string; color?: string },
): Promise<CategoryDTO> {
  const root = userRoot(requireUid());
  await liveNotes();
  const live = realtimeStore.categoryDocs.find((entry) => entry.id === id);
  let current: CategoryDoc;
  if (live) {
    current = live.data;
  } else {
    // Fallback for a category created milliseconds ago on another client.
    const snapshot = await getDoc(root.categoryDoc(id));
    if (!snapshot.exists()) throw new NotFoundError("category");
    current = snapshot.data() as unknown as CategoryDoc;
  }

  const patch: Partial<CategoryDoc> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.nameFa !== undefined) patch.nameFa = input.nameFa;
  if (input.icon !== undefined) patch.icon = input.icon;
  if (input.color !== undefined) patch.color = input.color;

  await updateDoc(root.categoryDoc(id), patch);
  const merged: CategoryDoc = { ...current, ...patch };

  // Fan-out (G1): targets come from the live array — read-free and UNCAPPED
  // (the former S8 lookup query stopped at MAX_NOTES_FETCH = 500).
  if (Object.keys(patch).length > 0) {
    const ref = categoryRefFrom(id, merged);
    await batchedUpdate(
      realtimeStore.notes
        .filter((note) => note.categoryId === id)
        .map((note) => ({ ref: root.noteDoc(note.id), data: { category: ref } })),
    );
  }

  const noteCount = realtimeStore.notes.filter(
    (note) => !note.isArchived && note.deletedAt === null && note.categoryId === id,
  ).length;
  return mapCategory(id, merged, noteCount);
}

export async function deleteCategory(id: string): Promise<{ ok: true }> {
  const root = userRoot(requireUid());
  await liveNotes();
  if (!realtimeStore.categoryDocs.some((entry) => entry.id === id)) {
    const snapshot = await getDoc(root.categoryDoc(id));
    if (!snapshot.exists()) throw new NotFoundError("category");
  }
  await deleteDoc(root.categoryDoc(id));

  // Fan-out: detach from notes (Prisma service keeps orphaned categoryId; the
  // Firestore model stores the ref inline, so it must be cleared explicitly).
  await batchedUpdate(
    realtimeStore.notes
      .filter((note) => note.categoryId === id)
      .map((note) => ({
        ref: root.noteDoc(note.id),
        data: { categoryId: null, category: null },
      })),
  );
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

export async function listTags(): Promise<{ items: TagDTO[] }> {
  const notes = await liveNotes();

  const counts = new Map<string, number>();
  for (const note of notes) {
    if (note.isArchived || note.deletedAt !== null) continue;
    for (const tag of note.tags) {
      counts.set(tag.id, (counts.get(tag.id) ?? 0) + 1);
    }
  }

  const items = [...realtimeStore.tagDocs]
    .sort((a, b) => a.data.name.localeCompare(b.data.name))
    .map((entry) => ({
      id: entry.id,
      name: entry.data.name,
      noteCount: counts.get(entry.id) ?? 0,
    }));
  return { items };
}

export async function createTag(input: { name: string }): Promise<TagDTO> {
  await liveNotes();
  const name = input.name.trim();
  const existing = realtimeStore.tagDocs.find((entry) => entry.data.name === name);
  if (existing) {
    return { id: existing.id, name: existing.data.name, noteCount: 0 };
  }
  const root = userRoot(requireUid());
  const created = await addDoc(root.tags, { name, createdAt: Date.now() } satisfies TagDoc);
  return { id: created.id, name, noteCount: 0 };
}

export async function deleteTag(id: string): Promise<{ ok: true }> {
  const root = userRoot(requireUid());
  await liveNotes();
  const live = realtimeStore.tagDocs.find((entry) => entry.id === id);
  let name: string;
  if (live) {
    name = live.data.name;
  } else {
    const snapshot = await getDoc(root.tagDoc(id));
    if (!snapshot.exists()) throw new NotFoundError("tag");
    name = (snapshot.data() as unknown as TagDoc).name;
  }
  await deleteDoc(root.tagDoc(id));

  // Fan-out: strip the reference from notes that still point at this tag.
  await batchedUpdate(
    realtimeStore.notes
      .filter((note) => note.tags.some((tag) => tag.id === id))
      .map((note) => ({
        ref: root.noteDoc(note.id),
        data: { tags: arrayRemove({ id, name }) },
      })),
  );
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Stats (parity with the SQL service)
// ---------------------------------------------------------------------------

export async function getStats(): Promise<StatsDTO> {
  const notes = await liveNotes();
  const live = notes.filter((note) => note.deletedAt === null);
  const active = live.filter((note) => !note.isArchived);
  const weekAgo = Date.now() - 7 * 86_400_000;

  const byType: Record<NoteType, number> = { text: 0, link: 0, image: 0, video: 0, file: 0 };
  for (const note of active) {
    if (note.type in byType) byType[note.type] += 1;
  }

  // Category counts — listCategories semantics computed from the live arrays
  // without an extra round-trip.
  const counts = new Map<string, number>();
  for (const note of active) {
    if (!note.categoryId) continue;
    counts.set(note.categoryId, (counts.get(note.categoryId) ?? 0) + 1);
  }
  const orderedCategories = [...realtimeStore.categoryDocs].sort(
    (a, b) => a.data.order - b.data.order || a.data.createdAt - b.data.createdAt,
  );

  const sortedBySaved = [...active].sort((a, b) => b.savedAt.localeCompare(a.savedAt));

  return {
    total: active.length,
    favorites: active.filter((note) => note.isFavorite).length,
    archived: live.length - active.length,
    thisWeek: active.filter((note) => new Date(note.savedAt).getTime() >= weekAgo).length,
    byType,
    byCategory: orderedCategories.map((entry) => ({
      ...categoryRefFrom(entry.id, entry.data),
      count: counts.get(entry.id) ?? 0,
    })),
    recent: sortedBySaved.slice(0, 5),
  };
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

async function ensureProfileDoc(): Promise<{ uid: string; data: ProfileDoc }> {
  const root = userRoot(requireUid());
  const uid = requireUid();
  const snapshot = await getDoc(root.profile);
  if (snapshot.exists()) {
    return { uid, data: snapshot.data() as unknown as ProfileDoc };
  }

  const authUser = getFirebaseAuth().currentUser;
  const fallbackName =
    authUser?.displayName ||
    (authUser?.email ? authUser.email.split("@")[0] : "User");
  let locale = "fa";
  try {
    locale = window.localStorage.getItem("savedbox.locale") === "en" ? "en" : "fa";
  } catch {
    /* private mode */
  }

  const now = Date.now();
  const created: ProfileDoc = {
    displayName: fallbackName,
    username: null,
    locale,
    theme: null,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(root.profile, created);
  return { uid, data: created };
}

export async function getProfile(): Promise<ProfileDTO> {
  const { uid, data } = await ensureProfileDoc();
  return {
    id: uid,
    displayName: data.displayName,
    username: data.username ?? null,
    locale: data.locale,
    theme: data.theme ?? null,
  };
}

export async function updateProfile(
  input: Partial<{ displayName: string; username: string | null; locale: string; theme: string | null }>,
): Promise<ProfileDTO> {
  const { uid, data } = await ensureProfileDoc();
  const patch: Partial<ProfileDoc> = { updatedAt: Date.now() };
  if (input.displayName !== undefined) patch.displayName = input.displayName.trim() || data.displayName;
  if (input.username !== undefined) patch.username = input.username;
  if (input.locale !== undefined) patch.locale = input.locale;
  if (input.theme !== undefined) patch.theme = input.theme;

  await updateDoc(userRoot(uid).profile, patch);
  const merged: ProfileDoc = { ...data, ...patch };
  return {
    id: uid,
    displayName: merged.displayName,
    username: merged.username ?? null,
    locale: merged.locale,
    theme: merged.theme ?? null,
  };
}
