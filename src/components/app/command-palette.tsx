"use client";

/**
 * UX-B3 (T-3) — THE one search/command surface (⌘K).
 *
 * Merges the header search and the library search into a single pattern:
 * every entry point (the header desktop pill, the header mobile icon and the
 * global ⌘K/Ctrl+K shortcut) opens THIS palette; typing offers the
 * library-search action plus live item results — both flowing through the
 * same listNotes path the library itself uses. Keyboard-first: open with
 * ⌘K, navigate with ↑/↓, commit with Enter, dismiss with Escape.
 */

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import {
  ArrowLeftRight,
  Bookmark,
  Eraser,
  FolderOpen,
  LayoutDashboard,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { currentDataMode, dataSource } from "@/services/data-source";
import { TYPE_META } from "@/components/app/meta";
import { useI18n } from "@/lib/i18n";
import { useAppStore } from "@/stores/app-store";
import { useMounted } from "@/hooks/use-mounted";
import type { NoteDTO } from "@/lib/domain/types";

/** Max item rows offered in the palette (a jump-off point, not a search page). */
const PALETTE_ITEMS = 8;

export function CommandPalette() {
  const { t, locale, setLocale } = useI18n();
  const open = useAppStore((state) => state.paletteOpen);
  const setPaletteOpen = useAppStore((state) => state.setPaletteOpen);
  const setView = useAppStore((state) => state.setView);
  const setCaptureOpen = useAppStore((state) => state.setCaptureOpen);
  const openNote = useAppStore((state) => state.openNote);
  const setFilters = useAppStore((state) => state.setFilters);
  const resetFilters = useAppStore((state) => state.resetFilters);
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  // Global ⌘K / Ctrl+K — keyboard-first entry (works over any view/overlay).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        const store = useAppStore.getState();
        store.setPaletteOpen(!store.paletteOpen);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  // Debounce the item search (same cadence as the library input).
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  // A fresh palette always starts from an empty query — render-phase state
  // adjustment (React-documented pattern; no setState inside an effect).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuery("");
      setDebouncedQ("");
    }
  }

  // Live item search — the SAME listNotes path the library uses; trashed
  // items stay out of the palette (they are reachable via the trash filter).
  const itemsQuery = useQuery({
    queryKey: ["palette-search", currentDataMode(), debouncedQ],
    queryFn: () =>
      dataSource.listNotes({
        q: debouncedQ || undefined,
        type: "all",
        categoryId: "all",
        archived: false,
        trash: false,
        sort: "newest",
      }),
    enabled: open && debouncedQ.length > 0,
  });
  const foundItems: NoteDTO[] = itemsQuery.data?.items?.slice(0, PALETTE_ITEMS) ?? [];

  /** Close first, then run — overlays never linger over a changed view. */
  const run = (action: () => void) => {
    setPaletteOpen(false);
    action();
  };

  const views = [
    { view: "dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { view: "library", label: t("nav.library"), icon: Bookmark },
    { view: "categories", label: t("nav.categories"), icon: FolderOpen },
    { view: "settings", label: t("nav.settings"), icon: Settings },
  ] as const;

  return (
    <CommandDialog
      open={open}
      onOpenChange={setPaletteOpen}
      title={t("palette.open")}
      description={t("palette.placeholder")}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={t("palette.placeholder")}
        aria-label={t("a11y.search")}
      />
      <CommandList>
        <CommandEmpty>{t("palette.noResults")}</CommandEmpty>

        {/* Library search action — merges the header search INTO the library
            pattern: the typed query becomes the library's layer-1 filter. */}
        {query.trim() ? (
          <CommandGroup heading={t("common.search")}>
            <CommandItem
              value={`${t("palette.searchInLibrary", { q: query.trim() })}`}
              onSelect={() => {
                const q = query.trim();
                run(() => {
                  setView("library");
                  setFilters({ q });
                });
              }}
            >
              <Search className="text-muted-foreground" aria-hidden="true" />
              <span className="truncate">
                {t("palette.searchInLibrary", { q: query.trim() })}
              </span>
            </CommandItem>
          </CommandGroup>
        ) : null}

        <CommandGroup heading={t("palette.views")}>
          {views.map((item) => (
            <CommandItem
              key={item.view}
              value={`${item.label} ${item.view}`}
              onSelect={() => run(() => setView(item.view))}
            >
              <item.icon className="text-muted-foreground" aria-hidden="true" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading={t("palette.actions")}>
          <CommandItem
            onSelect={() => run(() => setCaptureOpen(true))}
            value={`${t("dashboard.quickCapture")} capture`}
          >
            <Plus className="text-muted-foreground" aria-hidden="true" />
            <span>{t("dashboard.quickCapture")}</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))
            }
            value={`${t("a11y.themeToggle")} theme`}
          >
            {mounted && resolvedTheme === "dark" ? (
              <Sun className="text-muted-foreground" aria-hidden="true" />
            ) : (
              <Moon className="text-muted-foreground" aria-hidden="true" />
            )}
            <span>{t("a11y.themeToggle")}</span>
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => setLocale(locale === "fa" ? "en" : "fa"))}
            value={`${t("a11y.languageToggle")} language`}
          >
            <ArrowLeftRight className="text-muted-foreground" aria-hidden="true" />
            <span>{t("a11y.languageToggle")}</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(() => {
                setView("library");
                resetFilters();
              })
            }
            value={`${t("library.clearFilters")} clear`}
          >
            <Eraser className="text-muted-foreground" aria-hidden="true" />
            <span>{t("library.clearFilters")}</span>
          </CommandItem>
        </CommandGroup>

        {debouncedQ && foundItems.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading={t("palette.items")}>
              {foundItems.map((note) => {
                const meta = TYPE_META[note.type] ?? TYPE_META.text;
                const Icon = meta.icon;
                return (
                  <CommandItem
                    key={note.id}
                    value={note.title}
                    onSelect={() => run(() => openNote(note.id))}
                  >
                    <Icon
                      className="shrink-0"
                      style={{ color: meta.color }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate">{note.title}</span>
                    <span className="ms-2 hidden shrink-0 text-[10px] text-muted-foreground sm:block">
                      {t(meta.labelKey)}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
