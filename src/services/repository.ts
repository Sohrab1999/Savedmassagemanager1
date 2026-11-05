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
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentReference,
} from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDb } from "@/services/firebase";
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

const MAX_NOTES_FETCH = 500;
const VALID_TYPES: NoteType[] = ["text", "link", "image", "video", "file"];

// ---------------------------------------------------------------------------
// S7 — Shared notes snapshot (read consolidation)
//
// `getStats` / `listCategories` / `listTags` / category note-counts all need
// the user's notes. Previously EACH re-downloaded up to 500 docs, so one
// dashboard mount cost up to 3 full reads. The session snapshot below keeps
// ONE copy in memory (per module session) and every write invalidates it, so
// any combination of these views downloads the notes collection at most once
// per freshness window.
// ---------------------------------------------------------------------------

/** Cost guard for the shared snapshot; derived views stay honest because the
 * list path (S1) stops depending on this fetch entirely. */
const SNAPSHOT_MAX_NOTES = 500;
const SNAPSHOT_TTL_MS = 60_000;

interface NotesSnapshot {
  data: NoteDTO[];
  fetchedAt: number;
}

let notesSnapshot: NotesSnapshot | null = null;
let snapshotInFlight: Promise<NoteDTO[]> | null = null;

function invalidateNotesSnapshot(): void {
  notesSnapshot = null;
}

async function getNotesSnapshot(): Promise<NoteDTO[]> {
  if (notesSnapshot && Date.now() - notesSnapshot.fetchedAt < SNAPSHOT_TTL_MS) {
    return notesSnapshot.data;
  }
  // Concurrent callers (e.g. getStats + listCategories on one dashboard mount)
  // must share a single download, not race into two.
  if (!snapshotInFlight) {
    snapshotInFlight = (async () => {
      const root = userRoot(requireUid());
      const snapshot = await getDocs(
        query(root.notes, orderBy("savedAt", "desc"), limit(SNAPSHOT_MAX_NOTES)),
      );
      const data = snapshot.docs.map((entry) => mapNote(entry.id, entry.data()));
      notesSnapshot = { data, fetchedAt: Date.now() };
      return data;
    })().finally(() => {
      snapshotInFlight = null;
    });
  }
  return snapshotInFlight;
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
// Document ↔ DTO mapping
// ---------------------------------------------------------------------------

function asStringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function mapNote(id: string, data: Record<string, unknown>): NoteDTO {
  const doc_ = data as unknown as NoteDoc;
  return {
    id,
    type: VALID_TYPES.includes(doc_.type) ? doc_.type : "text",
    title: doc_.title,
    content: doc_.content ?? null,
    description: doc_.description ?? null,
    url: doc_.url ?? null,
    mediaUrl: doc_.mediaUrl ?? null,
    fileName: doc_.fileName ?? null,
    fileSize: doc_.fileSize ?? null,
    mediaDuration: doc_.mediaDuration ?? null,
    sourceChat: doc_.sourceChat ?? null,
    sourceType: doc_.sourceType ?? "manual",
    categoryId: doc_.categoryId ?? null,
    category: doc_.category ?? null,
    tags: Array.isArray(doc_.tags) ? doc_.tags : [],
    isFavorite: Boolean(doc_.isFavorite),
    isArchived: Boolean(doc_.isArchived),
    savedAt: new Date(doc_.savedAt).toISOString(),
    updatedAt: new Date(doc_.updatedAt).toISOString(),
  };
}

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

// ---------------------------------------------------------------------------
// Shared fetchers / filters (Prisma-service parity)
// ---------------------------------------------------------------------------

/** Full read for the notes list (S1 will replace this path with a
 * server-side paginated query). Kept for exact client-side semantics today. */
async function fetchAllNotes(): Promise<NoteDTO[]> {
  const root = userRoot(requireUid());
  const snapshot = await getDocs(
    query(root.notes, orderBy("savedAt", "desc"), limit(MAX_NOTES_FETCH)),
  );
  return snapshot.docs.map((entry) => mapNote(entry.id, entry.data()));
}

function matchesText(note: NoteDTO, q: string): boolean {
  const haystack = [note.title, note.content, note.description, note.url, note.fileName, note.sourceChat]
    .filter((value): value is string => Boolean(value))
    .join("\n")
    .toLowerCase();
  return haystack.includes(q);
}

function filterAndSort(notes: NoteDTO[], filters: NoteFilters): NoteDTO[] {
  let items = notes;

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
  const root = userRoot(requireUid());
  const snapshot = await getDoc(root.categoryDoc(categoryId));
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as unknown as CategoryDoc;
  return {
    id: snapshot.id,
    slug: data.slug,
    name: data.name,
    nameFa: data.nameFa ?? null,
    icon: data.icon,
    color: data.color,
  };
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
  const refs: TagRefDoc[] = [];
  const missing: string[] = [];

  const existing = await getDocs(query(root.tags, where("name", "in", wanted)));
  const idByName = new Map<string, string>();
  for (const hit of existing.docs) {
    idByName.set((hit.data() as unknown as TagDoc).name, hit.id);
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
// Notes
// ---------------------------------------------------------------------------

export async function listNotes(filters: NoteFilters): Promise<NoteListResponse> {
  const notes = await fetchAllNotes();
  const items = filterAndSort(notes, filters);
  return { items, total: items.length };
}

export async function getNote(id: string): Promise<NoteDTO> {
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
    savedAt: now,
    updatedAt: now,
  };

  const created = await addDoc(root.notes, payload);
  invalidateNotesSnapshot();
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
    savedAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
  };
}

export async function updateNote(id: string, input: UpdateNoteInput): Promise<NoteDTO> {
  const root = userRoot(requireUid());
  const snapshot = await getDoc(root.noteDoc(id));
  if (!snapshot.exists()) throw new NotFoundError("note");
  const existing = mapNote(snapshot.id, snapshot.data());

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
  invalidateNotesSnapshot();
  return {
    ...existing,
    ...patch,
    savedAt: existing.savedAt,
    updatedAt: new Date(updatedAt).toISOString(),
  } as NoteDTO;
}

export async function deleteNote(id: string): Promise<{ ok: true }> {
  const root = userRoot(requireUid());
  const snapshot = await getDoc(root.noteDoc(id));
  if (!snapshot.exists()) throw new NotFoundError("note");
  await deleteDoc(root.noteDoc(id));
  invalidateNotesSnapshot();
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
  const root = userRoot(requireUid());
  const [categorySnap, notes] = await Promise.all([
    getDocs(query(root.categories, orderBy("order", "asc"), limit(200))),
    getNotesSnapshot(),
  ]);

  const counts = new Map<string, number>();
  for (const note of notes) {
    if (note.isArchived || !note.categoryId) continue;
    counts.set(note.categoryId, (counts.get(note.categoryId) ?? 0) + 1);
  }

  return {
    items: categorySnap.docs.map((entry) =>
      mapCategory(entry.id, entry.data(), counts.get(entry.id) ?? 0),
    ),
  };
}

export async function createCategory(input: {
  name: string;
  nameFa?: string | null;
  icon?: string;
  color?: string;
}): Promise<CategoryDTO> {
  const root = userRoot(requireUid());
  const name = input.name.trim() || "Untitled";
  const existing = await getDocs(
    query(root.categories, orderBy("order", "desc"), limit(1)),
  );
  const maxOrder = existing.empty ? 0 : (existing.docs[0].data() as unknown as CategoryDoc).order ?? 0;

  // Slug uniqueness within the user's own categories.
  const all = await getDocs(query(root.categories, limit(200)));
  const taken = new Set(all.docs.map((entry) => (entry.data() as unknown as CategoryDoc).slug));
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
  invalidateNotesSnapshot();
  return mapCategory(created.id, payload, 0);
}

export async function updateCategory(
  id: string,
  input: { name?: string; nameFa?: string | null; icon?: string; color?: string },
): Promise<CategoryDTO> {
  const root = userRoot(requireUid());
  const snapshot = await getDoc(root.categoryDoc(id));
  if (!snapshot.exists()) throw new NotFoundError("category");
  const current = snapshot.data() as unknown as CategoryDoc;

  const patch: Partial<CategoryDoc> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.nameFa !== undefined) patch.nameFa = input.nameFa;
  if (input.icon !== undefined) patch.icon = input.icon;
  if (input.color !== undefined) patch.color = input.color;

  await updateDoc(root.categoryDoc(id), patch);
  const merged: CategoryDoc = { ...current, ...patch };

  // Fan-out: keep the denormalized category reference on notes in sync.
  if (Object.keys(patch).length > 0) {
    const owned = await getDocs(
      query(root.notes, where("categoryId", "==", id), limit(MAX_NOTES_FETCH)),
    );
    const ref: CategoryRefDoc = {
      id,
      slug: merged.slug,
      name: merged.name,
      nameFa: merged.nameFa ?? null,
      icon: merged.icon,
      color: merged.color,
    };
    await batchedUpdate(
      owned.docs.map((entry) => ({ ref: entry.ref, data: { category: ref } })),
    );
    invalidateNotesSnapshot();
  }

  const notes = await getNotesSnapshot();
  const noteCount = notes.filter((note) => !note.isArchived && note.categoryId === id).length;
  return mapCategory(id, merged, noteCount);
}

export async function deleteCategory(id: string): Promise<{ ok: true }> {
  const root = userRoot(requireUid());
  const snapshot = await getDoc(root.categoryDoc(id));
  if (!snapshot.exists()) throw new NotFoundError("category");
  await deleteDoc(root.categoryDoc(id));
  invalidateNotesSnapshot();

  // Fan-out: detach from notes (Prisma service keeps orphaned categoryId; the
  // Firestore model stores the ref inline, so it must be cleared explicitly).
  const owned = await getDocs(
    query(root.notes, where("categoryId", "==", id), limit(MAX_NOTES_FETCH)),
  );
  await batchedUpdate(
    owned.docs.map((entry) => ({
      ref: entry.ref,
      data: { categoryId: null, category: null },
    })),
  );
  invalidateNotesSnapshot();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

export async function listTags(): Promise<{ items: TagDTO[] }> {
  const root = userRoot(requireUid());
  const [tagSnap, notes] = await Promise.all([
    getDocs(query(root.tags, orderBy("name", "asc"), limit(300))),
    getNotesSnapshot(),
  ]);

  const counts = new Map<string, number>();
  for (const note of notes) {
    if (note.isArchived) continue;
    for (const tag of note.tags) {
      counts.set(tag.id, (counts.get(tag.id) ?? 0) + 1);
    }
  }

  return {
    items: tagSnap.docs.map((entry) => ({
      id: entry.id,
      name: (entry.data() as unknown as TagDoc).name,
      noteCount: counts.get(entry.id) ?? 0,
    })),
  };
}

export async function createTag(input: { name: string }): Promise<TagDTO> {
  const root = userRoot(requireUid());
  const name = input.name.trim();
  const existing = await getDocs(query(root.tags, where("name", "==", name), limit(1)));
  if (!existing.empty) {
    const hit = existing.docs[0];
    return { id: hit.id, name: (hit.data() as unknown as TagDoc).name, noteCount: 0 };
  }
  const created = await addDoc(root.tags, { name, createdAt: Date.now() } satisfies TagDoc);
  invalidateNotesSnapshot();
  return { id: created.id, name, noteCount: 0 };
}

export async function deleteTag(id: string): Promise<{ ok: true }> {
  const root = userRoot(requireUid());
  const snapshot = await getDoc(root.tagDoc(id));
  if (!snapshot.exists()) throw new NotFoundError("tag");
  const name = (snapshot.data() as unknown as TagDoc).name;
  await deleteDoc(root.tagDoc(id));
  invalidateNotesSnapshot();

  // Fan-out: strip the reference from notes that still point at this tag.
  const owned = await getDocs(
    query(root.notes, where("tags", "array-contains", { id, name }), limit(MAX_NOTES_FETCH)),
  );
  await batchedUpdate(
    owned.docs.map((entry) => ({
      ref: entry.ref,
      data: { tags: arrayRemove({ id, name }) },
    })),
  );
  invalidateNotesSnapshot();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Stats (parity with the SQL service)
// ---------------------------------------------------------------------------

export async function getStats(): Promise<StatsDTO> {
  const [notes, categoryResult] = await Promise.all([getNotesSnapshot(), listCategories()]);
  const active = notes.filter((note) => !note.isArchived);
  const weekAgo = Date.now() - 7 * 86_400_000;

  const byType: Record<NoteType, number> = { text: 0, link: 0, image: 0, video: 0, file: 0 };
  for (const note of active) {
    if (note.type in byType) byType[note.type] += 1;
  }

  const sortedBySaved = [...active].sort((a, b) => b.savedAt.localeCompare(a.savedAt));

  return {
    total: active.length,
    favorites: active.filter((note) => note.isFavorite).length,
    archived: notes.length - active.length,
    thisWeek: active.filter((note) => new Date(note.savedAt).getTime() >= weekAgo).length,
    byType,
    byCategory: categoryResult.items.map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      nameFa: category.nameFa,
      icon: category.icon,
      color: category.color,
      count: category.noteCount,
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
