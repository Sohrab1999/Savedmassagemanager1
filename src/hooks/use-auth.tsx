"use client";

// Firebase Authentication provider.
//
// Exposes the verified session (or null), initialization/loading state, and
// sign-in / sign-up / sign-out actions. Error codes are translated into i18n
// keys (auth.errors.*) by the caller. When Firebase is not configured for the
// deployment, the provider still boots so the explicitly-labeled demo mode
// remains available.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile as fbUpdateProfile,
  type User,
} from "firebase/auth";
import {
  getFirebaseAuth,
  isEmulatorEnabled,
  isFirebaseConfigured,
} from "@/services/firebase";

const DEMO_KEY = "savedbox.demo";

export class AuthUiError extends Error {
  /** i18n key under auth.errors.* */
  key: string;
  constructor(key: string) {
    super(key);
    this.name = "AuthUiError";
    this.key = key;
  }
}

const ERROR_KEYS: Record<string, string> = {
  "auth/invalid-email": "auth.errors.invalid-email",
  "auth/missing-password": "auth.errors.weak-password",
  "auth/weak-password": "auth.errors.weak-password",
  "auth/email-already-in-use": "auth.errors.email-already-in-use",
  "auth/invalid-credential": "auth.errors.invalid-credential",
  "auth/user-not-found": "auth.errors.invalid-credential",
  "auth/wrong-password": "auth.errors.invalid-credential",
  "auth/too-many-requests": "auth.errors.too-many-requests",
  "auth/network-request-failed": "auth.errors.network-request-failed",
  "auth/operation-not-allowed": "auth.errors.operation-not-allowed",
};

function toAuthUiError(error: unknown): AuthUiError {
  if (error instanceof AuthUiError) return error;
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  return new AuthUiError(ERROR_KEYS[code] ?? "auth.errors.default");
}

interface AuthContextValue {
  /** Verified Firebase user, or null (demo/gate). */
  user: User | null;
  /** True until the first auth-state resolution of this page load. */
  authLoading: boolean;
  /** True once it is safe to render auth-dependent UI. */
  authReady: boolean;
  /** Whether the deployment carries Firebase env configuration. */
  configured: boolean;
  /** Whether the Firebase Emulator Suite is the active backend. */
  emulator: boolean;
  /** Explicit demo mode (sample data, local API, no account). */
  demoMode: boolean;
  mode: "cloud" | "demo";
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  enterDemo: () => void;
  exitDemo: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const emulator = isEmulatorEnabled();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(configured);
  const [mounted, setMounted] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Resolve demo flag after mount (keeps SSR output deterministic).
  useEffect(() => {
    setMounted(true);
    try {
      setDemoMode(window.localStorage.getItem(DEMO_KEY) === "1");
    } catch {
      /* private mode */
    }
  }, []);

  useEffect(() => {
    if (!configured) {
      setAuthLoading(false);
      return;
    }
    try {
      const auth = getFirebaseAuth();
      const unsubscribe = onAuthStateChanged(auth, (next) => {
        setUser(next);
        setAuthLoading(false);
      });
      unsubscribeRef.current = unsubscribe;
      return () => {
        unsubscribe();
        unsubscribeRef.current = null;
      };
    } catch {
      setAuthLoading(false);
    }
  }, [configured]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
    } catch (error) {
      throw toAuthUiError(error);
    }
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName?: string) => {
      try {
        const credential = await createUserWithEmailAndPassword(
          getFirebaseAuth(),
          email,
          password,
        );
        if (displayName?.trim()) {
          await fbUpdateProfile(credential.user, {
            displayName: displayName.trim(),
          });
        }
      } catch (error) {
        throw toAuthUiError(error);
      }
    },
    [],
  );

  const signOutUser = useCallback(async () => {
    try {
      await fbSignOut(getFirebaseAuth());
    } catch (error) {
      throw toAuthUiError(error);
    } finally {
      try {
        window.localStorage.removeItem(DEMO_KEY);
      } catch {
        /* private mode */
      }
      setDemoMode(false);
      setUser(null);
    }
  }, []);

  const enterDemo = useCallback(() => {
    try {
      window.localStorage.setItem(DEMO_KEY, "1");
    } catch {
      /* private mode */
    }
    setDemoMode(true);
  }, []);

  const exitDemo = useCallback(() => {
    try {
      window.localStorage.removeItem(DEMO_KEY);
    } catch {
      /* private mode */
    }
    setDemoMode(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      authLoading: authLoading || !mounted,
      authReady: mounted && !authLoading,
      configured,
      emulator,
      demoMode,
      mode: user ? "cloud" : "demo",
      signIn,
      signUp,
      signOutUser,
      enterDemo,
      exitDemo,
    }),
    [
      user,
      authLoading,
      mounted,
      configured,
      emulator,
      demoMode,
      signIn,
      signUp,
      signOutUser,
      enterDemo,
      exitDemo,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
