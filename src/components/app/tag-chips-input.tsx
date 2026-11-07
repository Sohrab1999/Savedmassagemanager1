"use client";

// S2 — ONE tag-entry UX shared by every capture/edit path (quick capture AND
// the note detail sheet): rendered chips + an always-visible inline field.
// Enter / comma / Persian comma commits (pasting "a,b" yields two chips);
// Backspace on an empty field removes the last chip; the field commits its
// remaining draft on blur so a tag is never silently lost on Save.
// Suggestions (existing tags) are offered via a native datalist — no AI.

import { useId, useRef, useState } from "react";
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

interface TagChipsInputProps {
  /** Controlled chip list (display order preserved). */
  tags: string[];
  onChange: (tags: string[]) => void;
  /** Existing tag names offered as typeahead suggestions. */
  suggestions?: string[];
  /** Overrides the default i18n placeholder. */
  placeholder?: string;
  /** Accessible name for the inline input. */
  ariaLabel?: string;
  id?: string;
  className?: string;
}

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
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

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
  };

  const removeTag = (name: string) => {
    onChange(tags.filter((tag) => tag !== name));
  };

  const removeLast = () => {
    if (tags.length > 0) onChange(tags.slice(0, -1));
  };

  return (
    <div
      role="group"
      onClick={() => inputRef.current?.focus()}
      className={cn(
        "flex min-h-9 w-full cursor-text flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs transition-colors",
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
        list={listId}
        value={draft}
        onChange={(event) => {
          const value = event.target.value;
          // A typed separator commits everything before it immediately.
          if (/[,،]/.test(value)) commitDraft(value, !/[,،]$/.test(value));
          else setDraft(value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === "," || event.key === "،") {
            event.preventDefault();
            commitDraft(draft, false);
          } else if (event.key === "Backspace" && draft === "") {
            removeLast();
          } else if (event.key === "Escape") {
            commitDraft(draft, false);
            inputRef.current?.blur();
          }
        }}
        onBlur={() => commitDraft(draft, false)}
        placeholder={placeholder ?? t("tags.addPlaceholder")}
        aria-label={ariaLabel ?? t("note.detail.tags")}
        className="min-w-24 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
      />
      {suggestions.length > 0 ? (
        <datalist id={listId}>
          {suggestions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      ) : null}
    </div>
  );
}
