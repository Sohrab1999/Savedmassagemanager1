"use client";

// Type-aware note card used in grid and list layouts.
// N3 — search highlighting: when a query is active, title and snippet are
// rendered with <mark> segments matched through the SAME Persian equivalence
// table as the backend normalization (ك/ک، ي/ی، اعراب، نیم‌فاصله).
// N5 — trash mode: cards show the purge countdown and a per-item
// permanent-delete affordance instead of the favorite star.

import { Check, Play, Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import {
  formatNumber,
  formatRelativeTime,
  domainOf,
  formatDuration,
} from "@/lib/format";
import {
  firstMatchIndex,
  highlightRegexFor,
  splitHighlight,
  type HighlightSegment,
} from "@/lib/persian";
import { localizedCategoryName, tintOf, TYPE_META } from "@/components/app/meta";
import { trashDaysLeft } from "@/lib/domain/types";
import { useUpdateNote } from "@/hooks/queries";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";
import type { NoteDTO } from "@/lib/domain/types";

function FavoriteToggle({ note }: { note: NoteDTO }) {
  const { t } = useI18n();
  const updateNote = useUpdateNote();

  const toggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    updateNote.mutate(
      { id: note.id, patch: { isFavorite: !note.isFavorite } },
      { onError: () => toast.error(t("toast.error")) },
    );
  };

  return (
    <button
      type="button"
      aria-label={t("a11y.favoriteToggle")}
      aria-pressed={note.isFavorite}
      title={t("a11y.favoriteToggle")}
      onClick={toggle}
      className="flex size-8 items-center justify-center rounded-full bg-background/70 backdrop-blur transition-colors hover:bg-background"
    >
      <Star
        className={cn(
          "size-4 transition-colors",
          note.isFavorite
            ? "fill-amber-400 text-amber-500"
            : "text-muted-foreground",
        )}
        aria-hidden="true"
      />
    </button>
  );
}

/** S6 — selection checkbox shown only in bulk-select mode. Stops propagation
 * so toggling never opens the note; keyboard activation is also isolated from
 * the card's own Enter/Space handler. */
function SelectToggle({
  note,
  selected,
  onToggleSelect,
}: {
  note: NoteDTO;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={t("a11y.selectItem", { title: note.title })}
      onClick={(event) => {
        event.stopPropagation();
        onToggleSelect(note.id);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          onToggleSelect(note.id);
        }
      }}
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background/70 backdrop-blur transition-colors hover:bg-background"
    >
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-md border transition-colors",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input bg-background",
        )}
      >
        {selected ? <Check className="size-3.5" aria-hidden="true" /> : null}
      </span>
    </button>
  );
}

function Thumbnail({
  note,
  className,
  variant = "tile",
  highlight = null,
}: {
  note: NoteDTO;
  className?: string;
  /** "tile" = compact square (list rows); "media" = grid media area. */
  variant?: "tile" | "media";
  /** N3 — active search regex, so the UX-A3 excerpt keeps match highlights. */
  highlight?: RegExp | null;
}) {
  const meta = TYPE_META[note.type] ?? TYPE_META.text;
  const Icon = meta.icon;

  if (note.type === "image" && note.mediaUrl) {
    return (
      <img
        src={note.mediaUrl}
        alt={note.title}
        loading="lazy"
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }

  if (note.type === "video") {
    return (
      <div className={cn("relative h-full w-full overflow-hidden", className)}>
        {note.mediaUrl ? (
          <img
            src={note.mediaUrl}
            alt={note.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-accent" />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
          <span className="flex size-10 items-center justify-center rounded-full bg-white/90 shadow">
            <Play className="size-5 text-neutral-900" aria-hidden="true" />
          </span>
        </div>
        {note.mediaDuration ? (
          <span className="absolute bottom-1.5 end-1.5 rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {formatDuration(note.mediaDuration)}
          </span>
        ) : null}
      </div>
    );
  }

  // UX-A3 (S-2) — text notes breathe in grid media areas: a fixed 3-line
  // excerpt of the content replaces the dead «T» glyph, on a soft tinted
  // pattern with a corner type icon. List rows keep the compact icon tile,
  // and content-less notes fall back to the tile so the grid never breaks.
  if (note.type === "text" && variant === "media" && note.content?.trim()) {
    const excerpt = note.content.trim();
    const segments = splitHighlight(excerpt, highlight);
    return (
      <div
        className={cn("relative h-full w-full overflow-hidden", className)}
        style={{ backgroundColor: tintOf(meta.color) }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(-45deg, ${tintOf(
              meta.color,
            )} 0px 6px, transparent 6px 12px)`,
          }}
        />
        <p className="absolute inset-0 flex items-center p-3.5 text-xs leading-5 text-foreground/90">
          <span className="line-clamp-3">
            {renderHighlighted(segments, excerpt)}
          </span>
        </p>
        <span
          aria-hidden="true"
          className="absolute bottom-2 end-2 flex size-6 items-center justify-center rounded-lg bg-background/70 shadow-xs backdrop-blur"
        >
          <Icon className="size-3.5" style={{ color: meta.color }} />
        </span>
      </div>
    );
  }

  // text / link / file → icon tile
  const domain = note.type === "link" ? domainOf(note.url) : null;
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-1",
        className,
      )}
      style={{ backgroundColor: tintOf(meta.color) }}
    >
      <Icon className="size-6" style={{ color: meta.color }} aria-hidden="true" />
      {domain ? (
        <span className="max-w-[80%] truncate text-[10px] text-muted-foreground" dir="ltr">
          {domain}
        </span>
      ) : null}
    </div>
  );
}

function snippetOf(note: NoteDTO): string | null {
  return (
    note.description?.trim() ||
    note.content?.trim() ||
    (note.type === "file" ? note.fileName ?? null : null) ||
    domainOf(note.url)
  );
}

/** N3 — renders a string with <mark> around matched segments. Falls back to
 * the plain string when nothing matched. */
function renderHighlighted(
  segments: HighlightSegment[] | null,
  fallback: string,
) {
  if (!segments) return fallback;
  return segments.map((segment, index) =>
    segment.hit ? (
      <mark
        key={index}
        className="rounded-[2px] bg-amber-200 px-0.5 text-foreground dark:bg-amber-400/30 dark:text-amber-100"
      >
        {segment.text}
      </mark>
    ) : (
      <span key={index}>{segment.text}</span>
    ),
  );
}

/** N5 — «X روز تا پاک‌سازی» countdown for soft-deleted notes. */
function TrashCountdown({
  note,
  className,
}: {
  note: NoteDTO;
  className?: string;
}) {
  const { t, locale } = useI18n();
  const daysLeft = trashDaysLeft(note.deletedAt);
  if (daysLeft === null) return null;
  return (
    <span
      className={cn(
        "shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium leading-4 text-destructive",
        className,
      )}
    >
      {daysLeft === 0
        ? t("library.trash.purgeToday")
        : t("library.trash.purgeIn", {
            n: formatNumber(daysLeft, locale),
          })}
    </span>
  );
}

/** N5 — per-item permanent delete. Stops propagation so it never opens the
 * note; the destructive confirm dialog lives in the library view. */
function PurgeButton({
  note,
  onPurge,
}: {
  note: NoteDTO;
  onPurge?: (id: string) => void;
}) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      aria-label={t("a11y.purgeNote", { title: note.title })}
      title={t("library.trash.purge")}
      onClick={(event) => {
        event.stopPropagation();
        onPurge?.(note.id);
      }}
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background/70 text-muted-foreground backdrop-blur transition-colors hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 className="size-4" aria-hidden="true" />
    </button>
  );
}

/** Up to 2 tag chips + "+N" overflow; renders nothing when the note has no
 *  tags so cards without tags never gain a row (QE4 no-layout-shift rule). */
function TagChips({ note, compact }: { note: NoteDTO; compact?: boolean }) {
  const { locale } = useI18n();
  if (note.tags.length === 0) return null;
  return (
    <div className={cn("flex min-w-0 items-center gap-1", compact && "mt-0.5 flex-1")}>
      {note.tags.slice(0, 2).map((tag) => (
        <span
          key={tag.id}
          title={tag.name}
          className={cn(
            "max-w-24 truncate rounded-full bg-secondary px-1.5 py-0.5 text-[10px] leading-4 text-secondary-foreground",
          )}
        >
          {tag.name}
        </span>
      ))}
      {note.tags.length > 2 ? (
        <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] leading-4 text-muted-foreground">
          +{formatNumber(note.tags.length - 2, locale)}
        </span>
      ) : null}
    </div>
  );
}

/** N3 — search-focused snippet: when the primary snippet does not contain
 * the match but description/content does, show a window around the first
 * match so the hit is actually visible on the card. */
function searchSnippetOf(
  note: NoteDTO,
  highlight: RegExp | null,
): { snippet: string | null; segments: HighlightSegment[] | null } {
  const raw = snippetOf(note);
  if (!highlight || !raw) return { snippet: raw, segments: null };
  if (firstMatchIndex(raw, highlight) >= 0) {
    return { snippet: raw, segments: splitHighlight(raw, highlight) };
  }
  for (const field of [note.description, note.content]) {
    if (!field?.trim()) continue;
    const index = firstMatchIndex(field, highlight);
    if (index < 0) continue;
    const start = Math.max(0, index - 60);
    const end = Math.min(field.length, index + 160);
    const window = `${start > 0 ? "…" : ""}${field
      .slice(start, end)
      .trim()}${end < field.length ? "…" : ""}`;
    return { snippet: window, segments: splitHighlight(window, highlight) };
  }
  return { snippet: raw, segments: null };
}

export function NoteCard({
  note,
  layout,
  onOpen,
  selectionMode = false,
  selected = false,
  onToggleSelect,
  trashMode = false,
  onPurge,
}: {
  note: NoteDTO;
  layout: "grid" | "list";
  onOpen: (id: string) => void;
  /** S6 — bulk-selection affordances. */
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  /** N5 — trash view: countdown chip + per-item purge. */
  trashMode?: boolean;
  onPurge?: (id: string) => void;
}) {
  const { t, locale } = useI18n();
  const searchQuery = useAppStore((state) => state.filters.q);

  // N3 — highlight + search-focused snippet (the React Compiler memoizes
  // these automatically; no manual useMemo).
  const highlight = highlightRegexFor(searchQuery);
  const titleSegments = splitHighlight(note.title, highlight);
  const { snippet, segments: snippetSegments } = searchSnippetOf(note, highlight);

  const categoryColor = note.category?.color;
  // UX-A5 — full strings for native tooltips: every truncated «…» on a card
  // must be recoverable by hover/AT without opening the note.
  const categoryName = note.category
    ? localizedCategoryName(note.category, locale)
    : null;
  const toggleSelect = onToggleSelect ?? (() => undefined);

  if (layout === "list") {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={`${t("a11y.openNote")}: ${note.title}`}
        onClick={() => onOpen(note.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen(note.id);
          }
        }}
        className="flex w-full cursor-pointer items-center gap-3 rounded-xl border bg-card p-2.5 text-start shadow-xs transition-all hover:border-primary/40 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-ring"
      >
        {selectionMode ? (
          <SelectToggle
            note={note}
            selected={selected}
            onToggleSelect={toggleSelect}
          />
        ) : null}
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg">
          <Thumbnail note={note} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" title={note.title}>
            {renderHighlighted(titleSegments, note.title)}
          </p>
          <div className="flex items-center gap-2">
            {snippet ? (
              <p
                className="min-w-0 truncate text-xs text-muted-foreground"
                title={snippet}
              >
                {renderHighlighted(snippetSegments, snippet)}
              </p>
            ) : null}
            {trashMode ? (
              <TrashCountdown note={note} className="ms-auto" />
            ) : (
              <span className="ms-auto shrink-0 text-[10px] text-muted-foreground">
                {formatRelativeTime(note.savedAt, locale)}
              </span>
            )}
          </div>
          <TagChips note={note} compact />
        </div>
        {selectionMode ? null : trashMode ? (
          <PurgeButton note={note} onPurge={onPurge} />
        ) : (
          <FavoriteToggle note={note} />
        )}
      </div>
    );
  }

  // UX-A3 — when the grid media area already shows the content excerpt, the
  // body snippet (for plain text notes it IS the content) would read as a
  // duplicate; the body falls back to the relative-time row instead. Search
  // highlighting survives: the excerpt itself renders <mark> segments.
  const excerptShownInMedia =
    layout === "grid" && note.type === "text" && !!note.content?.trim();

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${t("a11y.openNote")}: ${note.title}`}
      onClick={() => onOpen(note.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(note.id);
        }
      }}
      className="group flex w-full cursor-pointer flex-col overflow-hidden rounded-xl border bg-card text-start shadow-xs transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring"
    >
      <div className="relative h-32 w-full overflow-hidden">
        <Thumbnail note={note} variant="media" highlight={highlight} />
        {selectionMode ? (
          <div className="absolute top-2 start-2">
            <SelectToggle
              note={note}
              selected={selected}
              onToggleSelect={toggleSelect}
            />
          </div>
        ) : (
          <div className="absolute top-2 end-2">
            {trashMode ? (
              <PurgeButton note={note} onPurge={onPurge} />
            ) : (
              <FavoriteToggle note={note} />
            )}
          </div>
        )}
      </div>
      <div className="flex min-h-[86px] flex-1 flex-col gap-1.5 p-3">
        <p className="line-clamp-1 text-sm font-semibold" title={note.title}>
          {renderHighlighted(titleSegments, note.title)}
        </p>
        {snippet && !excerptShownInMedia ? (
          <p
            className="line-clamp-2 text-xs leading-5 text-muted-foreground"
            title={snippet}
          >
            {renderHighlighted(snippetSegments, snippet)}
          </p>
        ) : trashMode ? (
          <TrashCountdown note={note} />
        ) : (
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(note.savedAt, locale)}
          </span>
        )}
        <TagChips note={note} />
        <div className="mt-auto flex items-center gap-2 pt-1.5 text-[11px] text-muted-foreground">
          {note.category ? (
            <span
              className="flex min-w-0 items-center gap-1 rounded-full bg-secondary px-2 py-0.5"
              title={categoryName ?? undefined}
            >
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: categoryColor }}
                aria-hidden="true"
              />
              <span className="truncate">{categoryName}</span>
            </span>
          ) : null}
          {trashMode ? (
            <TrashCountdown note={note} className="ms-auto" />
          ) : (
            <span className="ms-auto shrink-0">
              {formatRelativeTime(note.savedAt, locale)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
