// Security rules verification against the Firebase Emulator Suite.
//
// Usage:  bun scripts/rules-test.ts   (Firestore emulator must run on :8080)
//
// Verifies, directly against firestore.rules:
//   • Unauthenticated access is rejected everywhere.
//   • User B cannot read or write user A's profile / notes / categories / tags.
//   • The owner can create, read, update and delete their own documents.
//   • Malformed or out-of-contract documents (bad types, oversized fields,
//     forbidden shapes) are rejected by the rules.

import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { setDoc, doc, getDoc, updateDoc, deleteDoc, collection, addDoc } from "firebase/firestore";

const PORT = Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8080);
const HOST = "127.0.0.1";
const PROJECT_ID = `rules-test-${Date.now()}`;

const ALICE = "alice-uid-111";
const BOB = "bob-uid-222";

const validNote = (overrides: Record<string, unknown> = {}) => ({
  type: "text",
  title: "Hello",
  content: "world",
  description: null,
  url: null,
  mediaUrl: null,
  fileName: null,
  fileSize: null,
  mediaDuration: null,
  sourceChat: null,
  sourceType: "manual",
  categoryId: null,
  category: null,
  tags: [],
  isFavorite: false,
  isArchived: false,
  savedAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

const validCategory = (overrides: Record<string, unknown> = {}) => ({
  slug: "work",
  name: "Work",
  nameFa: null,
  icon: "folder",
  color: "#0d9488",
  order: 1,
  createdAt: Date.now(),
  ...overrides,
});

const validProfile = (overrides: Record<string, unknown> = {}) => ({
  displayName: "Alice",
  username: null,
  locale: "fa",
  theme: null,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean, detail?: unknown) {
  if (ok) {
    passed += 1;
    console.log(`  ✔ ${name}`);
  } else {
    failed += 1;
    console.error(`  ✘ ${name}`, detail ?? "");
  }
}

async function run() {
  const rules = readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");
  const env: RulesTestEnvironment = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules, host: HOST, port: PORT },
  });

  try {
    const db = (uid?: string) =>
      (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore();

    // Seed a valid note directly as Alice (bypassing rules) for cross-user tests.
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `users/${ALICE}/notes/note-1`), validNote());
      await setDoc(doc(ctx.firestore(), `users/${ALICE}/categories/cat-1`), validCategory());
      await setDoc(doc(ctx.firestore(), `users/${ALICE}/tags/tag-1`), { name: "work", createdAt: Date.now() });
      await setDoc(doc(ctx.firestore(), `users/${ALICE}`), validProfile());
    });

    console.log("\n[1] Unauthenticated access");
    check("read note denied", await assertFails(getDoc(doc(db(), `users/${ALICE}/notes/note-1`))));
    check("create note denied", await assertFails(addDoc(collection(db(), `users/${ALICE}/notes`), validNote())));
    check("read profile denied", await assertFails(getDoc(doc(db(), `users/${ALICE}`))));

    console.log("\n[2] Cross-user isolation (Bob → Alice's data)");
    check("Bob read Alice note denied", await assertFails(getDoc(doc(db(BOB), `users/${ALICE}/notes/note-1`))));
    check("Bob list Alice notes denied", await assertFails(getDocsSafe(collection(db(BOB), `users/${ALICE}/notes`))));
    check("Bob update Alice note denied", await assertFails(updateDoc(doc(db(BOB), `users/${ALICE}/notes/note-1`), { title: "hacked" })));
    check("Bob delete Alice note denied", await assertFails(deleteDoc(doc(db(BOB), `users/${ALICE}/notes/note-1`))));
    check("Bob write into Alice notes denied", await assertFails(addDoc(collection(db(BOB), `users/${ALICE}/notes`), validNote())));
    check("Bob read Alice category denied", await assertFails(getDoc(doc(db(BOB), `users/${ALICE}/categories/cat-1`))));
    check("Bob update Alice profile denied", await assertFails(updateDoc(doc(db(BOB), `users/${ALICE}`), { displayName: "hacked" })));
    check("Bob delete Alice profile denied", await assertFails(deleteDoc(doc(db(BOB), `users/${ALICE}`))));
    check("Bob read outside users/* denied", await assertFails(getDoc(doc(db(BOB), "some/other/collection/doc"))));

    console.log("\n[3] Owner CRUD (Alice)");
    const aliceDb = db(ALICE);
    check("Alice reads own profile", await assertSucceeds(getDoc(doc(aliceDb, `users/${ALICE}`))).then(() => true));
    check("Alice reads own note", await assertSucceeds(getDoc(doc(aliceDb, `users/${ALICE}/notes/note-1`))).then(() => true));
    check("Alice creates valid note", await assertSucceeds(addDoc(collection(aliceDb, `users/${ALICE}/notes`), validNote())).then(() => true));
    const created = await addDoc(collection(aliceDb, `users/${ALICE}/notes`), validNote());
    check(
      "Alice updates own note",
      await assertSucceeds(updateDoc(doc(aliceDb, `users/${ALICE}/notes/${created.id}`), { title: "Updated", updatedAt: Date.now() })).then(() => true),
    );
    check(
      "Alice deletes own note",
      await assertSucceeds(deleteDoc(doc(aliceDb, `users/${ALICE}/notes/${created.id}`))).then(() => true),
    );
    check("Alice creates valid category", await assertSucceeds(addDoc(collection(aliceDb, `users/${ALICE}/categories`), validCategory())).then(() => true));
    check("Alice creates valid tag", await assertSucceeds(addDoc(collection(aliceDb, `users/${ALICE}/tags`), { name: "urgent", createdAt: Date.now() })).then(() => true));
    check("Alice deletes own tag", await assertSucceeds(deleteDoc(doc(aliceDb, `users/${ALICE}/tags/tag-1`))).then(() => true));
    check("Alice updates own profile", await assertSucceeds(updateDoc(doc(aliceDb, `users/${ALICE}`), { displayName: "Alice A.", updatedAt: Date.now() })).then(() => true));
    check("Alice cannot delete own profile doc", await assertFails(deleteDoc(doc(aliceDb, `users/${ALICE}`))));

    console.log("\n[4] Document structure validation (owner, still rejected)");
    check("invalid note type rejected", await assertFails(addDoc(collection(aliceDb, `users/${ALICE}/notes`), validNote({ type: "hacked" }))));
    check("empty title rejected", await assertFails(addDoc(collection(aliceDb, `users/${ALICE}/notes`), validNote({ title: "" }))));
    check("oversized title rejected", await assertFails(addDoc(collection(aliceDb, `users/${ALICE}/notes`), validNote({ title: "x".repeat(201) }))));
    check("oversized content rejected", await assertFails(addDoc(collection(aliceDb, `users/${ALICE}/notes`), validNote({ content: "x".repeat(100_001) }))));
    check("savedAt as string rejected", await assertFails(addDoc(collection(aliceDb, `users/${ALICE}/notes`), validNote({ savedAt: "now" }))));
    check("isFavorite as string rejected", await assertFails(addDoc(collection(aliceDb, `users/${ALICE}/notes`), validNote({ isFavorite: "yes" }))));
    check("sourceType out of enum rejected", await assertFails(addDoc(collection(aliceDb, `users/${ALICE}/notes`), validNote({ sourceType: "sms" }))));
    check("unexpected extra field rejected", await assertFails(addDoc(collection(aliceDb, `users/${ALICE}/notes`), validNote({ ownerUid: BOB }))));
    check("tags over 30 rejected", await assertFails(addDoc(collection(aliceDb, `users/${ALICE}/notes`), validNote({ tags: Array.from({ length: 31 }, (_, i) => ({ id: `t${i}`, name: `t${i}` })) }))));
    check("30 tags accepted", await assertSucceeds(addDoc(collection(aliceDb, `users/${ALICE}/notes`), validNote({ tags: Array.from({ length: 30 }, (_, i) => ({ id: `t${i}`, name: `t${i}` })) }))).then(() => true));
    check("categoryId without category ref rejected", await assertFails(addDoc(collection(aliceDb, `users/${ALICE}/notes`), validNote({ categoryId: "cat-1", category: null }))));
    check("malformed category ref rejected", await assertFails(addDoc(collection(aliceDb, `users/${ALICE}/notes`), validNote({ categoryId: "c", category: { id: "c" } }))));
    check("far-future updatedAt rejected", await assertFails(addDoc(collection(aliceDb, `users/${ALICE}/notes`), validNote({ updatedAt: Date.now() + 30 * 86_400_000 }))));
    check("mutating savedAt on update rejected", await assertFails(updateDoc(doc(aliceDb, `users/${ALICE}/notes/note-1`), { savedAt: 1, updatedAt: Date.now() })));
    check("invalid category icon type rejected", await assertFails(addDoc(collection(aliceDb, `users/${ALICE}/categories`), validCategory({ icon: 42 }))));
    check("tag update rejected (immutable)", await assertFails(updateDoc(doc(aliceDb, `users/${ALICE}/tags/tag-1`), { name: "renamed" })));
    check("profile with bad locale type rejected", await assertFails(setDoc(doc(db(BOB), `users/${BOB}`), validProfile({ locale: 42 }))));

    console.log(`\nResult: ${passed} passed, ${failed} failed (project: ${PROJECT_ID})`);
    if (failed > 0) process.exitCode = 1;
  } finally {
    await env.cleanup();
  }
}

async function getDocsSafe(ref: ReturnType<typeof collection>) {
  const { getDocs } = await import("firebase/firestore");
  return getDocs(ref);
}

run().catch((error) => {
  console.error("rules-test crashed:", error);
  process.exitCode = 1;
});
