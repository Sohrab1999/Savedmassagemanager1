"use client";

// Type-aware note card used in grid and list layouts.

import { Play, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { formatRelativeTime, domainOf, formatDuration } from "@/lib/format";
import { localizedCategoryName, TYPE_META } from "@/components/app/meta";
import { useUpdateNote } from "@/hooks/queries";
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

function Thumbnail({ note, className }: { note: NoteDTO; className?: string }) {
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

  // text / link / file → icon tile
  const domain = note.type === "link" ? domainOf(note.url) : null;
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-1",
        className,
      )}
      style={{ backgroundColor: `${meta.color}14` }}
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

export function NoteCard({
  note,
  layout,
  onOpen,
}: {
  note: NoteDTO;
  layout: "grid" | "list";
  onOpen: (id: string) => void;
}) {
  const { t, locale } = useI18n();
  const snippet = snippetOf(note);
  const categoryColor = note.category?.color;

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
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg">
          <Thumbnail note={note} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{note.title}</p>
          <div className="flex items-center gap-2">
            {snippet ? (
              <p className="min-w-0 truncate text-xs text-muted-foreground">{snippet}</p>
            ) : null}
            <span className="ms-auto shrink-0 text-[10px] text-muted-foreground">
              {formatRelativeTime(note.savedAt, locale)}
            </span>
          </div>
        </div>
        <FavoriteToggle note={note} />
      </div>
    );
  }

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
        <Thumbnail note={note} />
        <div className="absolute top-2 end-2">
          <FavoriteToggle note={note} />
        </div>
      </div>
      <div className="flex min-h-[86px] flex-1 flex-col gap-1.5 p-3">
        <p className="line-clamp-1 text-sm font-semibold">{note.title}</p>
        {snippet ? (
          <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
            {snippet}
          </p>
        ) : (
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(note.savedAt, locale)}
          </span>
        )}
        <div className="mt-auto flex items-center gap-2 pt-1.5 text-[11px] text-muted-foreground">
          {note.category ? (
            <span className="flex min-w-0 items-center gap-1 rounded-full bg-secondary px-2 py-0.5">
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: categoryColor }}
                aria-hidden="true"
              />
              <span className="truncate">
                {localizedCategoryName(note.category, locale)}
              </span>
            </span>
          ) : null}
          <span className="ms-auto shrink-0">
            {formatRelativeTime(note.savedAt, locale)}
          </span>
        </div>
      </div>
    </div>
  );
}
