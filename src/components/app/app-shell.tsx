"use client";

import { useEffect } from "react";
import { Bookmark, Loader2, Plus } from "lucide-react";
import { AppHeader } from "@/components/app/header";
import { BottomNav, SidebarNav } from "@/components/app/nav";
import { DashboardView } from "@/components/app/views/dashboard-view";
import { LibraryView } from "@/components/app/views/library-view";
import { CategoriesView } from "@/components/app/views/categories-view";
import { SettingsView } from "@/components/app/views/settings-view";
import { QuickCapture } from "@/components/app/quick-capture";
import { NoteDetailSheet } from "@/components/app/note-detail-sheet";
import { AuthGate } from "@/components/app/auth-gate";
import { useAuth } from "@/hooks/use-auth";
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
  const { t } = useI18n();
  const { authReady, user, demoMode } = useAuth();

  // Browser back/forward support for in-app view switching (single-route SPA).
  useEffect(() => bindHashNavigation(), []);

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

      {/* Mobile floating capture button */}
      <button
        type="button"
        aria-label={t("a11y.capture")}
        title={t("a11y.capture")}
        onClick={() => setCaptureOpen(true)}
        className="fixed bottom-[76px] end-4 z-40 flex size-13 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 lg:hidden"
      >
        <Plus className="size-6" aria-hidden="true" />
      </button>

      <BottomNav />

      {/* Global overlays */}
      <QuickCapture />
      <NoteDetailSheet />
    </div>
  );
}
