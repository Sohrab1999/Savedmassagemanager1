"use client";

// F6 (A-3.3) — the related-items BACK BAR of the note detail sheet.
//
// Contract (roadmap #4 F6 DoD):
//   • Visible ONLY while the sheet is deeper than its session root
//     (opening related items in a row); ONE tap returns EXACTLY to the first
//     item of the session — the state lives in the store
//     (detailRootId / returnToDetailRoot), not in component state, so it
//     survives the loading shimmer of the swapped note.
//   • Keyboard: a real <button> — Tab/Enter work identically on desktop.
//   • B2 stays intact: the swapped note still opens VIEW-first (the store
//     clears the B6 flag on every related/back navigation).
//   • The directional arrow carries `rtl:-scale-x-100` (UX-B7 contract —
//     LTR: points left; RTL: flips to point right = back in both locales).

import { ArrowLeft } from "lucide-react";
import { useNote } from "@/hooks/queries";
import { useI18n } from "@/lib/i18n";
import { useAppStore } from "@/stores/app-store";

export function DetailBackBar() {
  const { t } = useI18n();
  const rootId = useAppStore((state) => state.detailRootId);
  const detailNoteId = useAppStore((state) => state.detailNoteId);
  const returnToDetailRoot = useAppStore((state) => state.returnToDetailRoot);
  // Cached (the root was visited to arrive here) — no extra fetch pressure.
  const rootQuery = useNote(rootId);
  const rootTitle = rootQuery.data?.title;

  if (!rootId || rootId === detailNoteId) return null;

  return (
    <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <button
        type="button"
        onClick={returnToDetailRoot}
        aria-label={t("note.detail.backToRootAria")}
        className="flex min-h-11 w-full items-center gap-1.5 px-4 py-2 text-start text-xs font-medium text-primary transition-colors hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-ring"
      >
        <ArrowLeft
          className="size-4 shrink-0 rtl:-scale-x-100"
          aria-hidden="true"
        />
        <span className="truncate">
          {rootTitle
            ? t("note.detail.backToRoot", { title: rootTitle })
            : t("note.detail.backToRootAria")}
        </span>
      </button>
    </div>
  );
}
