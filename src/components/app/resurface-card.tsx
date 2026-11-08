"use client";

// N7 — resurfacing card (v1): «از ذخیره‌های قدیمی‌تان». Exactly ONE card,
// shown only when a candidate exists AND the user has not turned the feature
// off in Settings (persistent per-device toggle — resurface-store). Zero
// external notifications, ever (owner warning respected). Candidates are the
// OLDEST saves ≥30 days (v1 semantics: no lastOpenedAt field — recorded DoD
// decision; the copy stays honest about "older saves", not "never opened").
// Clicking the item opens its sheet and records the click micro-event (the
// §9 KPI base); «یکی دیگر» walks the oldest-first pool.

import { useEffect, useState } from "react";
import { History, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { formatRelativeTime } from "@/lib/format";
import {
  recordResurfaceClick,
  recordResurfaceImpression,
} from "@/lib/resurface-metrics";
import { useResurfaceCandidates } from "@/hooks/queries";
import { useAppStore } from "@/stores/app-store";
import { useResurfaceStore } from "@/stores/resurface-store";

export function ResurfaceCard() {
  const { t, locale } = useI18n();
  const enabled = useResurfaceStore((state) => state.enabled);
  const hydrated = useResurfaceStore((state) => state.hydrated);
  const hydrate = useResurfaceStore((state) => state.hydrate);
  const openNote = useAppStore((state) => state.openNote);
  const candidatesQuery = useResurfaceCandidates();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const candidates = candidatesQuery.data?.items ?? [];
  const candidate =
    candidates.length > 0 ? candidates[index % candidates.length] : null;

  // KPI micro-event: one impression per candidate per session (de-duplicated
  // inside the metrics util, so the 2 s demo poll cannot inflate it).
  const candidateId = candidate?.id ?? null;
  useEffect(() => {
    if (candidateId) recordResurfaceImpression(candidateId);
  }, [candidateId]);

  // The toggle lives in Settings; while it is off (or not yet hydrated) the
  // card is absent — never a placeholder.
  if (!hydrated || !enabled || !candidate) return null;

  return (
    <section
      aria-label={t("dashboard.resurface.title")}
      className="rounded-xl border border-primary/30 bg-primary/5 p-4"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <History className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{t("dashboard.resurface.title")}</p>
          <p className="truncate text-xs text-muted-foreground">
            {t("dashboard.resurface.hint")}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 gap-1.5 text-xs text-muted-foreground"
          aria-label={t("a11y.resurface.another")}
          onClick={() => setIndex((current) => current + 1)}
        >
          <RefreshCw className="size-3.5" aria-hidden="true" />
          {t("dashboard.resurface.another")}
        </Button>
      </div>
      <button
        type="button"
        onClick={() => {
          recordResurfaceClick(candidate.id);
          openNote(candidate.id);
        }}
        aria-label={`${t("a11y.openNote")}: ${candidate.title}`}
        className="mt-3 flex w-full items-center gap-2.5 rounded-lg border bg-card p-2.5 text-start transition-colors hover:border-primary/40 hover:shadow-xs focus-visible:outline-2 focus-visible:outline-ring"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">
            {candidate.title}
          </span>
          <span className="block text-[11px] text-muted-foreground">
            {t("dashboard.resurface.savedAgo", {
              ago: formatRelativeTime(candidate.savedAt, locale),
            })}
          </span>
        </span>
      </button>
    </section>
  );
}
