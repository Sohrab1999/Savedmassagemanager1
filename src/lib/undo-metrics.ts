"use client";

// S5 — Undo-rate metric (client-side, per Phase-3 KPI: «نرخ حذف‌های Undo-شده
// ثبت و گزارش شود»). Counts deletions and undos in localStorage and reports
// the rate in Settings → About. Deliberately dependency-free and honest: this
// is a per-device indicator, not a cross-device analytics product.

const STORAGE_KEY = "savedbox.undoMetrics";

export interface UndoMetrics {
  /** Total deletes performed (soft deletes → trash). */
  deletions: number;
  /** How many of those were undone via the 7-second toast action or the
   * trash view. */
  undos: number;
}

export function getUndoMetrics(): UndoMetrics {
  if (typeof window === "undefined") return { deletions: 0, undos: 0 };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { deletions: 0, undos: 0 };
    const parsed = JSON.parse(raw) as Partial<UndoMetrics>;
    return {
      deletions: typeof parsed.deletions === "number" ? parsed.deletions : 0,
      undos: typeof parsed.undos === "number" ? parsed.undos : 0,
    };
  } catch {
    return { deletions: 0, undos: 0 };
  }
}

function write(metrics: UndoMetrics): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
  } catch {
    /* private mode — metrics are best-effort by design */
  }
}

/** Records `count` deletions in one call (S6 bulk deletes count each note). */
export function recordDeletion(count = 1): void {
  const current = getUndoMetrics();
  write({ deletions: current.deletions + count, undos: current.undos });
}

/** Records `count` undos in one call (S6 bulk restore counts each note). */
export function recordUndo(count = 1): void {
  const current = getUndoMetrics();
  write({ deletions: current.deletions, undos: current.undos + count });
}
