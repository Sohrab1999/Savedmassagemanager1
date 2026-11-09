"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bookmark, Loader2, Plus } from "lucide-react";
import { AppHeader } from "@/components/app/header";
import { BottomNav, SidebarNav } from "@/components/app/nav";
import { DashboardView } from "@/components/app/views/dashboard-view";
import { LibraryView } from "@/components/app/views/library-view";
import { CategoriesView } from "@/components/app/views/categories-view";
import { SettingsView } from "@/components/app/views/settings-view";
import { QuickCapture } from "@/components/app/quick-capture";
import { NoteDetailSheet } from "@/components/app/note-detail-sheet";
import { UndoToastHost } from "@/components/app/undo-toast";
import { CommandPalette } from "@/components/app/command-palette";
import { AuthGate } from "@/components/app/auth-gate";
import { useAuth } from "@/hooks/use-auth";
import { useShareTarget } from "@/hooks/use-share-target";
import { realtimeStore } from "@/services/realtime";
import { bindHashNavigation, useAppStore } from "@/stores/app-store";
import { useI18n } from "@/lib/i18n";

function AuthSplash() {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background"
      role="status"
      aria-live="polite"
    >
      <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
        <Bookmark className="size-6" aria-hidden="true" />
      </div>
      <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
    </div>
  );
}

export function AppShell() {
  const view = useAppStore((state) => state.view);
  const setCaptureOpen = useAppStore((state) => state.setCaptureOpen);
  // S6 — the capture FAB must not overlap the bulk-selection action bar.
  const bulkSelectMode = useAppStore((state) => state.bulkSelectMode);
  const { t } = useI18n();
  const { authReady, user, demoMode } = useAuth();
  const queryClient = useQueryClient();
  // F1 — Web Share Target intake (mount-once; opens the capture dialog
  // prefilled when the page load carries `/?title=…&text=…&url=…`).
  // Hooks run BEFORE the early returns below (compiler rule).
  useShareTarget();

  // Browser back/forward support for in-app view switching (single-route SPA)
  // + the F2 `#/capture?…` deep-link intake (bookmarklet).
  useEffect(() => bindHashNavigation(), []);

  // G1 — realtime bridge. ONE session-scoped listener set serves the whole
  // app; this effect owns its lifecycle (start on sign-in, stop on
  // sign-out/UID change/unmount) and forwards store updates into the React
  // Query cache (coalesced) so every view re-renders without refreshes.
  // The refcounted subscription here is the only component-level listener —
  // unmounting cleans it up, so no leak is possible from any view.
  const userUid = user?.uid ?? null;
  useEffect(() => {
    if (!userUid) {
      realtimeStore.stop();
      return;
    }
    realtimeStore.start(userUid);
    let scheduled = false;
    const unsubscribe = realtimeStore.subscribe(() => {
      if (scheduled) return;
      scheduled = true;
      setTimeout(() => {
        scheduled = false;
        void queryClient.invalidateQueries();
      }, 50);
    });
    return () => {
      unsubscribe();
      realtimeStore.stop();
    };
  }, [userUid, queryClient]);

  if (!authReady) {
    return <AuthSplash />;
  }

  // No verified session and no explicit demo opt-in → authentication gate.
  if (!user && !demoMode) {
    return <AuthGate />;
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <AppHeader />

      <div className="flex min-h-0 flex-1">
        <SidebarNav />

        <main
          aria-label={t("app.name")}
          className="scroll-area min-w-0 flex-1 overflow-y-auto"
        >
          <div className="mx-auto w-full max-w-6xl px-3 pb-28 pt-4 sm:px-5 lg:pb-10">
            {view === "dashboard" ? <DashboardView /> : null}
            {view === "library" ? <LibraryView /> : null}
            {view === "categories" ? <CategoriesView /> : null}
            {view === "settings" ? <SettingsView /> : null}
          </div>
        </main>
      </div>

      {/* Mobile floating capture button — hidden during bulk selection (S6):
          capturing and bulk-editing are mutually exclusive flows. */}
      {bulkSelectMode ? null : (
        <button
          type="button"
          aria-label={t("a11y.capture")}
          title={t("a11y.capture")}
          onClick={() => setCaptureOpen(true)}
          className="fixed bottom-[76px] end-4 z-40 flex size-13 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 lg:hidden"
        >
          <Plus className="size-6" aria-hidden="true" />
        </button>
      )}

      <BottomNav />

      {/* Global overlays */}
      <QuickCapture />
      <NoteDetailSheet />
      {/* UX-B3 (T-3) — the unified search/command palette (⌘K, header pill,
          header mobile icon — one surface, three entries). */}
      <CommandPalette />
      {/* UX-A6 (S-7) — the stabilized undo toast host (fixed anchor above
          the mobile bottom nav, assertive live region). */}
      <UndoToastHost />
    </div>
  );
}
