"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { dictionaries, type I18nKey, type Locale } from "./dictionaries";

const STORAGE_KEY = "savedbox.locale";

// Locale is stored in an external system (localStorage) and read through
// useSyncExternalStore, so there is no SSR mismatch and no
// setState-in-effect. The server snapshot is always `fa`.

type Listener = () => void;
const listeners = new Set<Listener>();

function readStoredLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "fa" || stored === "en" ? stored : "fa";
  } catch {
    return "fa";
  }
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): Locale {
  return readStoredLocale();
}

function getServerSnapshot(): Locale {
  return "fa";
}

function writeLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* private mode etc. */
  }
  for (const listener of listeners) listener();
}

function translate(
  locale: Locale,
  key: I18nKey,
  vars?: Record<string, string | number>,
): string {
  const dict = dictionaries[locale] ?? dictionaries.fa;
  let value = dict[key] ?? dictionaries.fa[key] ?? key;
  if (vars) {
    for (const [name, replacement] of Object.entries(vars)) {
      value = value.replaceAll(`{${name}}`, String(replacement));
    }
  }
  return value;
}

interface I18nContextValue {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: (key: I18nKey, vars?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Sync the external system (document) — allowed effect usage.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "fa" ? "rtl" : "ltr";
  }, [locale]);

  const t = useCallback(
    (key: I18nKey, vars?: Record<string, string | number>) =>
      translate(locale, key, vars),
    [locale],
  );

  const setLocale = useCallback((next: Locale) => writeLocale(next), []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dir: locale === "fa" ? "rtl" : "ltr",
      t,
      setLocale,
    }),
    [locale, t, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
