"use client";

// N7 — Resurfacing micro-events (client-side, per the roadmap §9 KPI: «نرخ
// کلیک کارت بازکشف ≥ ۱۵٪»). Counts card impressions and item clicks in
// localStorage and reports the rate in Settings. Deliberately dependency-free
// and honest: a per-device indicator, not a cross-device analytics product.
// An impression is counted at most ONCE per candidate note per page session so
// the 2-second demo polling can never inflate the denominator.

const STORAGE_KEY = "savedbox.resurfaceMetrics";

export interface ResurfaceMetrics {
  /** How many times a resurfacing card became visible with a candidate. */
  impressions: number;
  /** How many of those led to opening the suggested item. */
  clicks: number;
}

export function getResurfaceMetrics(): ResurfaceMetrics {
  if (typeof window === "undefined") return { impressions: 0, clicks: 0 };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { impressions: 0, clicks: 0 };
    const parsed = JSON.parse(raw) as Partial<ResurfaceMetrics>;
    return {
      impressions: typeof parsed.impressions === "number" ? parsed.impressions : 0,
      clicks: typeof parsed.clicks === "number" ? parsed.clicks : 0,
    };
  } catch {
    return { impressions: 0, clicks: 0 };
  }
}

function write(metrics: ResurfaceMetrics): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
  } catch {
    /* private mode — metrics are best-effort by design */
  }
}

/** One impression per candidate note per session (de-duplicated here). */
const seenImpressions = new Set<string>();

export function recordResurfaceImpression(noteId: string): void {
  if (typeof window === "undefined" || seenImpressions.has(noteId)) return;
  seenImpressions.add(noteId);
  const current = getResurfaceMetrics();
  write({ impressions: current.impressions + 1, clicks: current.clicks });
}

export function recordResurfaceClick(noteId: string): void {
  if (typeof window === "undefined") return;
  const current = getResurfaceMetrics();
  write({ impressions: current.impressions, clicks: current.clicks + 1 });
}
