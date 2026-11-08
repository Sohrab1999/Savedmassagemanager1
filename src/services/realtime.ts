"use client";

// G1 — Realtime store (Cloud mode).
//
// ONE set of permanent Firestore listeners per signed-in session replaces
// every one-shot read that existed before (the S7 TTL snapshot, the S1
// structured pages, and the dedicated stats/categories/tags reads):
//
//   • The Library (all filter/sort/pagination paths) derives from the live
//     notes array — one UNCAPPED stream, so Silent-Loss = 0 still holds.
//   • Dashboard stats, categories and tags are joins over the same arrays.
//   • Writes surface immediately via Firestore latency compensation, then
//     confirm — every other tab/device sees them within the push round-trip
//     (< 1 s in practice), no refresh anywhere.
//
// Offline (IndexedDB persistence — see firebase.ts): onSnapshot keeps serving
// from cache, writes queue locally and reconcile when the connection returns.
//
// Lifecycle contract: the listeners are SESSION-scoped on purpose (the
// library must stay "always alive" across view switches). Component-level
// safety comes from the single bridge subscription mounted in app-shell.tsx,
// which unsubscribes on unmount/UID change/sign-out. No per-component
// listener is ever created, so unmounting any view cannot leak one.

import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  writeBatch,
} from "firebase/firestore";
import { getFirestoreDb } from "@/services/firebase";
import {
  FS_PATHS,
  TRASH_RETENTION_MS,
  type CategoryDoc,
  type NoteDTO,
  type NoteDoc,
  type TagDoc,
} from "@/domain/types";
import { NOTE_TYPES } from "@/lib/domain/types";

/** S5 — soft-deleted notes are purged for real after this window. Single
 * source of truth moved to the shared domain types (N5 countdown UI uses it
 * too); re-exported here for existing consumers. */
export { TRASH_RETENTION_MS } from "@/domain/types";

const MAX_BATCH_OPS = 500;

export interface RealtimeCategoryDoc {
  id: string;
  data: CategoryDoc;
}

export interface RealtimeTagDoc {
  id: string;
  data: TagDoc;
}

function asStringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** Firestore NoteDoc → shared NoteDTO (single source of the mapping). */
export function mapNote(id: string, data: Record<string, unknown>): NoteDTO {
  const doc_ = data as unknown as NoteDoc;
  return {
    id,
    type: NOTE_TYPES.includes(doc_.type) ? doc_.type : "text",
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
    deletedAt:
      typeof doc_.deletedAt === "number"
        ? new Date(doc_.deletedAt).toISOString()
        : null,
    savedAt: new Date(doc_.savedAt).toISOString(),
    updatedAt: new Date(doc_.updatedAt).toISOString(),
  };
}

type Listener = () => void;

class RealtimeStore {
  private uid: string | null = null;
  private unsubs: Array<() => void> = [];
  private listeners = new Set<Listener>();
  private readyWaiters: Array<() => void> = [];
  private version = 0;
  /** One trash-purge sweep per session (client-side purge; a server-side
   * scheduled purge is a Cloud-Go-Live backlog item). */
  private purgeDone = false;
  private firstNotesSnapshot = false;

  /** Live arrays — treated as immutable snapshots by readers. */
  notes: NoteDTO[] = [];
  categoryDocs: RealtimeCategoryDoc[] = [];
  tagDocs: RealtimeTagDoc[] = [];
  /** True while a listener set is attached for the current UID. */
  started = false;

  // -- React-facing subscription (bridge in app-shell) ---------------------

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getVersion(): number {
    return this.version;
  }

  get activeUid(): string | null {
    return this.uid;
  }

  // -- lifecycle ------------------------------------------------------------

  /** Starts (or re-targets) the listeners. Idempotent per UID. */
  start(uid: string): void {
    if (this.started && this.uid === uid) return;
    this.stop();

    this.uid = uid;
    this.started = true;
    this.firstNotesSnapshot = false;
    this.purgeDone = false;
    this.notes = [];
    this.categoryDocs = [];
    this.tagDocs = [];

    const db = getFirestoreDb();
    const notesQuery = query(
      collection(db, FS_PATHS.users, uid, FS_PATHS.notes),
      orderBy("savedAt", "desc"),
    );

    const unsubNotes = onSnapshot(
      notesQuery,
      (snapshot) => {
        this.notes = snapshot.docs.map((entry) =>
          mapNote(entry.id, entry.data()),
        );
        this.firstNotesSnapshot = true;
        this.settleReady();
        void this.purgeExpiredTrash(uid);
        this.emit();
      },
      (error) => {
        console.error("[realtime] notes listener error:", error);
        this.firstNotesSnapshot = true; // unblock readers; UI shows the error/empty state
        this.settleReady();
        this.emit();
      },
    );

    const unsubCategories = onSnapshot(
      collection(db, FS_PATHS.users, uid, FS_PATHS.categories),
      (snapshot) => {
        this.categoryDocs = snapshot.docs.map((entry) => ({
          id: entry.id,
          data: entry.data() as unknown as CategoryDoc,
        }));
        this.emit();
      },
      (error) => {
        console.error("[realtime] categories listener error:", error);
        this.emit();
      },
    );

    const unsubTags = onSnapshot(
      collection(db, FS_PATHS.users, uid, FS_PATHS.tags),
      (snapshot) => {
        this.tagDocs = snapshot.docs.map((entry) => ({
          id: entry.id,
          data: entry.data() as unknown as TagDoc,
        }));
        this.emit();
      },
      (error) => {
        console.error("[realtime] tags listener error:", error);
        this.emit();
      },
    );

    this.unsubs = [unsubNotes, unsubCategories, unsubTags];
  }

  /** Detaches every listener (sign-out / UID change / app teardown). */
  stop(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
    this.uid = null;
    this.started = false;
    this.firstNotesSnapshot = false;
    this.notes = [];
    this.categoryDocs = [];
    this.tagDocs = [];
    this.settleReady();
    this.emit();
  }

  /** Resolves once the first notes snapshot of the active session arrived
   * (from server OR from the offline cache). Repository reads await this so
   * the UI's loading states stay meaningful. */
  ensureReady(): Promise<void> {
    if (this.started && this.firstNotesSnapshot) return Promise.resolve();
    return new Promise((resolve) => {
      this.readyWaiters.push(resolve);
    });
  }

  getNoteById(id: string): NoteDTO | null {
    return this.notes.find((note) => note.id === id) ?? null;
  }

  // -- internals ------------------------------------------------------------

  private settleReady(): void {
    const waiters = this.readyWaiters;
    this.readyWaiters = [];
    for (const resolve of waiters) resolve();
  }

  private emit(): void {
    this.version += 1;
    for (const listener of this.listeners) listener();
  }

  /** S5 — lazy client-side purge: notes soft-deleted more than 7 days ago are
   * hard-deleted once per session, in batches. Runs off the live array, so it
   * never issues an extra read. */
  private async purgeExpiredTrash(uid: string): Promise<void> {
    if (this.purgeDone) return;
    const now = Date.now();
    const expired = this.notes.filter(
      (note) =>
        note.deletedAt !== null &&
        now - new Date(note.deletedAt).getTime() > TRASH_RETENTION_MS,
    );
    this.purgeDone = true;
    if (expired.length === 0) return;

    const db = getFirestoreDb();
    for (let start = 0; start < expired.length; start += MAX_BATCH_OPS) {
      const chunk = expired.slice(start, start + MAX_BATCH_OPS);
      const batch = writeBatch(db);
      for (const note of chunk) {
        batch.delete(doc(db, FS_PATHS.users, uid, FS_PATHS.notes, note.id));
      }
      try {
        await batch.commit();
      } catch (error) {
        console.error("[realtime] trash purge batch failed:", error);
      }
    }
  }
}

export const realtimeStore = new RealtimeStore();
