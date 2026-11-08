"use client";

// N6 — «مرتبط‌ها» section of the note detail sheet: up to 3 items with a
// GENUINE shared tag or category (deterministic co-occurrence — NO AI, and
// the section says so). UX-A7 sweep: the zero state is EXPLICIT — a friendly
// EmptyState instead of silent absence — while staying honest: suggestions
// only exist when they are REAL. Clicking a row swaps the open sheet to that
// item (openNote contract).

import { useI18n } from "@/lib/i18n";
import { formatRelativeTime } from "@/lib/format";
import { localizedCategoryName, tintOf, TYPE_META } from "@/components/app/meta";
import { EmptyState } from "@/components/app/states";
import { useRelatedNotes } from "@/hooks/queries";
import { useAppStore } from "@/stores/app-store";

export function RelatedNotes({ currentId }: { currentId: string }) {
  const { t, locale } = useI18n();
  const openNote = useAppStore((state) => state.openNote);
  const relatedQuery = useRelatedNotes(currentId);
  const related = relatedQuery.data;

  // Still loading → the section is absent (never a fake placeholder).
  if (!related) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          {t("note.related.title")}
        </p>
        <span
          className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] leading-4 text-secondary-foreground"
          title={t("note.related.noAi")}
        >
          {t("note.related.noAi")}
        </span>
      </div>
      {related.length === 0 ? (
        // UX-A7 — the honest zero state, through the ONE shared EmptyState
        // (compact: the sheet is a narrow column).
        <EmptyState
          className="px-4 py-6"
          title={t("note.related.empty.title")}
          description={t("note.related.empty.desc")}
        />
      ) : (
        <ul className="space-y-1.5">
        {related.map((item) => {
          const meta = TYPE_META[item.type] ?? TYPE_META.text;
          const Icon = meta.icon;
          // UX-A5 (S-4) — the truncated meta line gets full-text access via
          // native tooltip; the row button title covers the (also truncated)
          // item title. No «…» without a path to the full string.
          const metaText = `${
            item.category
              ? localizedCategoryName(item.category, locale)
              : t(TYPE_META[item.type].labelKey)
          } · ${formatRelativeTime(item.savedAt, locale)}`;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => openNote(item.id)}
                aria-label={`${t("a11y.openNote")}: ${item.title}`}
                title={item.title}
                className="flex w-full items-center gap-2.5 rounded-lg border bg-card p-2 text-start transition-colors hover:border-primary/40 hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-ring"
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: tintOf(meta.color) }}
                  aria-hidden="true"
                >
                  <Icon className="size-4" style={{ color: meta.color }} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium" title={item.title}>
                    {item.title}
                  </span>
                  <span
                    className="block truncate text-[10px] text-muted-foreground"
                    title={metaText}
                  >
                    {metaText}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
        </ul>
      )}
    </div>
  );
}
