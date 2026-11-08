"use client";

// S2 — ONE tag-entry UX shared by every capture/edit path (quick capture AND
// the note detail sheet): rendered chips + an always-visible inline field.
// Enter / comma / Persian comma commits (pasting "a,b" yields two chips);
// Backspace on an empty field removes the last chip; the field commits its
// remaining draft on blur so a tag is never silently lost on Save.
//
// QE-tagging — typeahead: suggestions come ONLY from the existing-tags cache
// (no AI). While typing, a filtered list opens under the field, ordered by
// match quality (startsWith first) then usage frequency, and navigable with
// ↑/↓ + Enter (or a click). Replaces the previous native datalist, whose
// behavior was browser-dependent (especially poor on mobile keyboards).

import { useId, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Splits a raw string on ASCII and Persian commas, trimming empties. */
export function splitTagInput(raw: string): string[] {
  return raw
    .split(/[,،]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export interface TagSuggestion {
  name: string;
  /** Usage frequency from the tags cache — drives suggestion ranking. */
  noteCount?: number;
}

interface TagChipsInputProps {
  /** Controlled chip list (display order preserved). */
  tags: string[];
  onChange: (tags: string[]) => void;
  /** Existing tags (cache only) offered as typeahead suggestions. */
  suggestions?: TagSuggestion[];
  /** Overrides the default i18n placeholder. */
  placeholder?: string;
  /** Accessible name for the inline input. */
  ariaLabel?: string;
  id?: string;
  className?: string;
}

const MAX_SUGGESTIONS = 6;

export function TagChipsInput({
  tags,
  onChange,
  suggestions = [],
  placeholder,
  ariaLabel,
  id,
  className,
}: TagChipsInputProps) {
  const { t } = useI18n();
  const [draft, setDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const rawListId = useId();
  // ids are used as DOM ids — strip ":" (valid in React useId, invalid-ish in
  // querySelector contexts and aria-activedescendant lookups).
  const listId = `tags-suggest-${rawListId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const commitDraft = (raw: string, keepLastInField: boolean) => {
    const parts = splitTagInput(raw);
    if (parts.length === 0) return;
    const toAdd = keepLastInField ? parts.slice(0, -1) : parts;
    const remainder = keepLastInField ? (parts[parts.length - 1] ?? "") : "";
    if (toAdd.length > 0) {
      const next = [...tags];
      for (const name of toAdd) {
        // Exact-match dedup (parity with the server-side tag creation, which
        // is case-sensitive by name).
        if (!next.includes(name)) next.push(name);
      }
      if (next.length !== tags.length) onChange(next);
    }
    setDraft(remainder);
    setMenuOpen(false);
    setActiveIndex(0);
  };

  const addTag = (name: string) => {
    if (tags.includes(name)) {
      setDraft("");
      setMenuOpen(false);
      return;
    }
    onChange([...tags, name]);
    setDraft("");
    setMenuOpen(false);
    setActiveIndex(0);
  };

  const removeTag = (name: string) => {
    onChange(tags.filter((tag) => tag !== name));
  };

  const removeLast = () => {
    if (tags.length > 0) onChange(tags.slice(0, -1));
  };

  // QE-tagging — cache-only filtering: draft → ranked suggestions. No network,
  // no AI: the source is the `useTags` cache the caller already holds.
  const filtered = useMemo(() => {
    const query = draft.trim().toLowerCase();
    if (!query) return [];
    const selected = new Set(tags);
    const startsWith: TagSuggestion[] = [];
    const contains: TagSuggestion[] = [];
    for (const suggestion of suggestions) {
      if (selected.has(suggestion.name)) continue;
      const name = suggestion.name.toLowerCase();
      if (name.startsWith(query)) startsWith.push(suggestion);
      else if (name.includes(query)) contains.push(suggestion);
    }
    const byUsage = (a: TagSuggestion, b: TagSuggestion) =>
      (b.noteCount ?? 0) - (a.noteCount ?? 0);
    return [...startsWith.sort(byUsage), ...contains.sort(byUsage)].slice(
      0,
      MAX_SUGGESTIONS,
    );
  }, [draft, suggestions, tags]);

  const open = menuOpen && filtered.length > 0;

  return (
    <div
      role="group"
      onClick={() => inputRef.current?.focus()}
      className={cn(
        "relative flex min-h-9 w-full cursor-text flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs transition-colors",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        className,
      )}
    >
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="gap-1 rounded-full ps-2.5 pe-1"
        >
          {tag}
          <button
            type="button"
            aria-label={t("tags.remove", { name: tag })}
            onClick={(event) => {
              event.stopPropagation();
              removeTag(tag);
            }}
            className="flex size-4 items-center justify-center rounded-full hover:bg-background/60"
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </Badge>
      ))}
      <input
        ref={inputRef}
        id={id}
        value={draft}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          open ? `${listId}-${activeIndex}` : undefined
        }
        autoComplete="off"
        onChange={(event) => {
          const value = event.target.value;
          // A typed separator commits everything before it immediately.
          if (/[,،]/.test(value)) {
            commitDraft(value, !/[,،]$/.test(value));
          } else {
            setDraft(value);
            setMenuOpen(true);
            setActiveIndex(0);
          }
        }}
        onKeyDown={(event) => {
          if (open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            const delta = event.key === "ArrowDown" ? 1 : -1;
            setActiveIndex(
              (current) =>
                (current + delta + filtered.length) % filtered.length,
            );
          } else if (event.key === "Enter" || event.key === "," || event.key === "،") {
            event.preventDefault();
            if (open) {
              addTag(filtered[activeIndex]?.name ?? draft);
            } else {
              commitDraft(draft, false);
            }
          } else if (event.key === "Backspace" && draft === "") {
            removeLast();
          } else if (event.key === "Escape") {
            // First Escape closes the suggestion menu; the second commits and
            // blurs (S2 behavior preserved when no menu is open).
            if (open) {
              setMenuOpen(false);
            } else {
              commitDraft(draft, false);
              inputRef.current?.blur();
            }
          }
        }}
        onBlur={() => commitDraft(draft, false)}
        placeholder={placeholder ?? t("tags.addPlaceholder")}
        aria-label={ariaLabel ?? t("note.detail.tags")}
        className="min-w-24 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
      />
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("tags.suggestions")}
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-44 overflow-y-auto rounded-md border bg-popover p-1 shadow-md"
        >
          {filtered.map((suggestion, index) => (
            <li
              key={suggestion.name}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              // mousedown (not click) keeps focus in the input so the
              // commit-on-blur contract is never triggered by picking.
              onMouseDown={(event) => {
                event.preventDefault();
                addTag(suggestion.name);
              }}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                index === activeIndex ? "bg-accent" : "hover:bg-accent",
              )}
            >
              <span className="min-w-0 flex-1 truncate">{suggestion.name}</span>
              {typeof suggestion.noteCount === "number" ? (
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {suggestion.noteCount}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
