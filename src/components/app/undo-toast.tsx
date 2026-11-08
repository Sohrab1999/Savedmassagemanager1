"use client";

// UX-A6 (S-7) — the stabilized undo toast. Deletion is a high-stress event;
// the rescue window must be dependable: an assertive live region (role=status
// + aria-live=assertive), a FIXED anchor (above the mobile bottom nav and
// clear of the capture FAB; bottom-center on desktop), a ≥ 8-second window
// made visible by a depleting progress bar, and a ≥ 44px undo button.
//
// Why not sonner: ordinary toasts keep using sonner, but its <section> is
// hard-wired to aria-live="polite" (verified in node_modules/sonner dist) and
// its bottom-center anchor collides with the mobile bottom nav — the exact
// S-7 diagnosis. The undo contract therefore gets its own host.
//
// P6 — the undo-rate KPI is untouched: recordDeletion/recordUndo callers are
// exactly where they were; this component is UI-only and knows nothing about
// the metric.

import { useCallback, useEffect, useRef, useState } from "react";
import { Undo2, X } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { useI18n } from "@/lib/i18n";

/** The rescue-window floor (UX-A6 DoD): never shorter than 8 seconds. */
export const UNDO_TOAST_MIN_MS = 8000;

export interface UndoToastPayload {
  message: string;
  undoLabel: string;
  onUndo: () => void;
  /** Rescue window in ms — clamped to UNDO_TOAST_MIN_MS. */
  duration?: number;
}

type Listener = (payload: UndoToastPayload) => void;
const listeners = new Set<Listener>();

/** Open the undo toast. A second call replaces the current one (fresh
 * timer + animation), so rapid successive deletes never stack windows. */
export function showUndoToast(payload: UndoToastPayload): void {
  const normalized: UndoToastPayload = {
    ...payload,
    duration: Math.max(
      payload.duration ?? UNDO_TOAST_MIN_MS,
      UNDO_TOAST_MIN_MS,
    ),
  };
  for (const listener of listeners) listener(normalized);
}

interface ActiveToast extends UndoToastPayload {
  id: number;
}

export function UndoToastHost() {
  const { t } = useI18n();
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const timerRef = useRef<number | null>(null);
  // S6 — the bulk action bar owns the bottom-[74px] anchor while it is open;
  // the undo toast steps up above it instead of covering it.
  const bulkSelectMode = useAppStore((state) => state.bulkSelectMode);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearTimer();
    setToast(null);
  }, [clearTimer]);

  useEffect(() => {
    const listener: Listener = (payload) => {
      clearTimer();
      setToast({ ...payload, id: Date.now() });
      timerRef.current = window.setTimeout(() => setToast(null), payload.duration);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      clearTimer();
    };
  }, [clearTimer]);

  if (!toast) return null;

  const anchor = bulkSelectMode
    ? "bottom-[136px] lg:bottom-4"
    : "bottom-[74px] lg:bottom-4";

  return (
    // Fixed anchor — the whole point of S-7: never pushed by content, never
    // a moving target. Mobile: start-aligned above the bottom nav, with an
    // end inset that keeps it clear of the capture FAB. Desktop: centered.
    <div
      className={`pointer-events-none fixed inset-x-0 z-40 flex justify-start ps-3 pe-[76px] lg:justify-center lg:pe-3 ${anchor}`}
    >
      <div
        key={toast.id}
        role="status"
        aria-live="assertive"
        aria-atomic="true"
        className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg lg:w-auto"
      >
        <div className="flex items-center gap-1.5 p-2 pe-1.5">
          <p className="min-w-0 flex-1 text-sm font-medium">{toast.message}</p>
          {/* UX-A6 DoD — the undo affordance is a full 44px-tall touch target. */}
          <button
            type="button"
            onClick={() => {
              dismiss();
              toast.onUndo();
            }}
            className="flex h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Undo2 className="size-4" aria-hidden="true" />
            <span className="whitespace-nowrap">{toast.undoLabel}</span>
          </button>
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={dismiss}
            className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        {/* The visible rescue window: depletes over exactly `duration` ms so
            the user can SEE the 8-second contract instead of guessing. The
            key on the wrapper remounts this element per toast, restarting
            the animation. Origin flips with the reading direction. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-primary/60 rtl:origin-right"
          style={{
            animation: `savedbox-undo-countdown ${toast.duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}
