"use client";

// Firebase initialization (TeleVault / Savedbox).
//
// Configuration comes exclusively from NEXT_PUBLIC_* environment variables so
// that no credentials are bundled into source control. The Firebase Web SDK
// config is public by design (it identifies the project, it is not a secret);
// the actual security boundary is Firebase Auth + firestore.rules.
//
// Emulator mode: when NEXT_PUBLIC_FIREBASE_EMULATOR=true the SDK is pointed at
// the local Firebase Emulator Suite (Auth :9099, Firestore :8080). This is the
// explicitly identified development/demo backend; production values are read
// from the same variables once a real Firebase project is configured.

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  type Auth,
  type User,
} from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from "firebase/firestore";

export const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

const EMULATOR_AUTH_PORT = 9099;
const EMULATOR_FIRESTORE_PORT = 8080;

export class FirebaseConfigError extends Error {
  constructor() {
    super(
      "Firebase is not configured: set the NEXT_PUBLIC_FIREBASE_* environment variables.",
    );
    this.name = "FirebaseConfigError";
  }
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId && FIREBASE_CONFIG.appId,
  );
}

export function isEmulatorEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === "true";
}

export function getEmulatorHost(): string {
  return process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || "localhost";
}

let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let initFailure: Error | null = null;

function ensureApp(): FirebaseApp {
  if (!isFirebaseConfigured()) throw new FirebaseConfigError();
  if (getApps().length > 0) return getApp();
  return initializeApp(FIREBASE_CONFIG);
}

function initialize(): { auth: Auth; db: Firestore } {
  const app = ensureApp();
  const auth = getAuth(app);
  const db = getFirestore(app);

  if (isEmulatorEnabled() && typeof window !== "undefined") {
    const host = getEmulatorHost();
    connectAuthEmulator(auth, `http://${host}:${EMULATOR_AUTH_PORT}`, {
      disableWarnings: true,
    });
    connectFirestoreEmulator(db, host, EMULATOR_FIRESTORE_PORT);
  }

  return { auth, db };
}

/** Lazily-initialized Auth singleton. Throws FirebaseConfigError when unconfigured. */
export function getFirebaseAuth(): Auth {
  if (initFailure) throw initFailure;
  if (!authInstance) {
    try {
      authInstance = initialize().auth;
    } catch (error) {
      initFailure = error instanceof Error ? error : new Error(String(error));
      throw initFailure;
    }
  }
  return authInstance;
}

/** Lazily-initialized Firestore singleton. Throws FirebaseConfigError when unconfigured. */
export function getFirestoreDb(): Firestore {
  if (initFailure) throw initFailure;
  if (!dbInstance) {
    try {
      dbInstance = initialize().db;
    } catch (error) {
      initFailure = error instanceof Error ? error : new Error(String(error));
      throw initFailure;
    }
  }
  return dbInstance;
}

/**
 * The verified current user from Firebase Auth state, read at call time.
 * The repository layer derives every data path from this UID — a user id is
 * never accepted as an argument from callers or client input.
 */
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    return getFirebaseAuth().currentUser;
  } catch {
    return null;
  }
}

/** Introspection used by Settings / auth gate to display backend status. */
export function getFirebaseStatus(): {
  configured: boolean;
  emulator: boolean;
  projectId: string;
} {
  return {
    configured: isFirebaseConfigured(),
    emulator: isEmulatorEnabled(),
    projectId: FIREBASE_CONFIG.projectId,
  };
}
