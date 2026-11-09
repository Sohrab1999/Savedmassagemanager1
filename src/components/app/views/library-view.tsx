"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  Check,
  CheckCheck,
  ChevronDown,
  Filter,
  FolderOpen,
  Inbox,
  LayoutGrid,
  List,
  ListChecks,
  Loader2,
  Plus,
  Search,
  SearchX,
  Square,
  Star,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EmptyState, ErrorState, GridSkeleton, ListSkeleton } from "@/components/app/states";
import { NoteCard } from "@/components/app/note-card";
import { iconByName, localizedCategoryName, TYPE_META } from "@/components/app/meta";
import { showUndoToast } from "@/components/app/undo-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useBulkNotes,
  useEmptyTrash,
  useNotes,
  useCategories,
  useTags,
} from "@/hooks/queries";
import { recordDeletion, recordUndo } from "@/lib/undo-metrics";
import { useI18n } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";
import { NOTE_TYPES } from "@/lib/domain/types";
import { useAppStore } from "@/stores/app-store";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { CategoryDTO, NoteDTO, TagDTO } from "@/lib/domain/types";
import type { Locale } from "@/lib/i18n/dictionaries";

export function LibraryView() {
  const { t, locale } = useI18n();
  const filters = useAppStore((state) => state.filters);
  const setFilters = useAppStore((state) => state.setFilters);
  const resetFilters = useAppStore((state) => state.resetFilters);
  const openNote = useAppStore((state) => state.openNote);
  const setCaptureOpen = useAppStore((state) => state.setCaptureOpen);
  // S6 — bulk-selection mode (store-scoped so the mobile FAB can hide).
  const bulkSelectMode = useAppStore((state) => state.bulkSelectMode);
  const setBulkSelectMode = useAppStore((state) => state.setBulkSelectMode);

  const notesQuery = useNotes(filters);
  const categoriesQuery = useCategories();
  const tagsQuery = useTags();
  const bulkNotes = useBulkNotes();
  // N5 — permanent trash management.
  const emptyTrash = useEmptyTrash();

  const [searchInput, setSearchInput] = useState(filters.q);
  // UX-B3 (T-3) — external surfaces (the ⌘K palette's library-search action)
  // may change `filters.q` while this view is mounted; the local input must
  // mirror the store or the debounce below would RESURRECT the stale local
  // query over the externally-applied one. Render-phase state adjustment
  // (the React-documented pattern — no setState inside an effect).
  const [lastStoreQ, setLastStoreQ] = useState(filters.q);
  if (filters.q !== lastStoreQ) {
    setLastStoreQ(filters.q);
    setSearchInput(filters.q);
  }
  // UX-B1 — the unified Filter entry: desktop popover / mobile bottom-sheet.
  const isMobile = useIsMobile();
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // The categorize Select resets to its placeholder after every action.
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  // UX-B4 (T-4) — ONE-time bulk coach-mark. Shows once when the library has
  // enough items to make bulk work meaningful; ANY dismissal (button, outside
  // click, entering bulk mode) persists the flag so it never nags again.
  const [bulkCoachOpen, setBulkCoachOpen] = useState(false);
  // N5 — pending permanent-delete targets: a single note (causal confirm) or
  // the whole trash (MANDATORY two-step confirm: 1 = scope, 2 = final).
  const [purgeTarget, setPurgeTarget] = useState<NoteDTO | null>(null);
  const [emptyStep, setEmptyStep] = useState<0 | 1 | 2>(0);

  // Leaving this view (unmount) always ends bulk selection.
  useEffect(() => {
    return () => setBulkSelectMode(false);
  }, [setBulkSelectMode]);

  const exitSelection = useCallback(() => {
    setBulkSelectMode(false);
    setSelectedIds(new Set());
    setBulkCategoryId("");
  }, [setBulkSelectMode]);

  // UX-B4 (T-4) — dismissing the coach-mark in ANY way is sticky forever.
  const dismissBulkCoach = useCallback(() => {
    setBulkCoachOpen(false);
    try {
      localStorage.setItem("savedbox.bulk.coach.v1", "1");
    } catch {
      /* storage unavailable (private mode) — the coach simply may re-appear;
         never worth blocking the flow over. */
    }
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /** S6 — ONE batched write per action on both backends (demo: one Prisma
   * statement; cloud: one committed writeBatch). Bulk delete keeps the S5
   * undo contract: the UX-A6 stabilized undo toast (≥ 8 s, assertive, fixed
   * anchor) restores the whole batch. */
  const runBulk = useCallback(
    (
      action: "categorize" | "archive" | "unarchive" | "delete" | "restore",
      categoryId?: string | null,
      ids?: string[],
    ) => {
      const targetIds = ids ?? [...selectedIds];
      if (targetIds.length === 0) return;
      bulkNotes.mutate(
        { ids: targetIds, action, categoryId },
        {
          onSuccess: (result) => {
            const countLabel = formatNumber(result.updated, locale);
            if (action === "delete") {
              recordDeletion(result.updated);
              const undoIds = targetIds;
              // UX-A6 (S-7) — the stabilized undo toast replaces the sonner
              // toast: assertive live region, fixed anchor, ≥ 8 s window and
              // a 44px undo button. KPI wiring (recordDeletion/recordUndo)
              // is untouched (P6).
              showUndoToast({
                message: t("library.bulk.trashedToast", { n: countLabel }),
                undoLabel: t("common.restore"),
                onUndo: () => {
                  bulkNotes.mutate(
                    { ids: undoIds, action: "restore" },
                    {
                      onSuccess: (restored) => {
                        recordUndo(restored.updated);
                        toast.success(
                          t("library.bulk.restoredToast", {
                            n: formatNumber(restored.updated, locale),
                          }),
                        );
                      },
                      onError: () => toast.error(t("toast.error")),
                    },
                  );
                },
              });
            } else {
              const key =
                action === "categorize"
                  ? "library.bulk.categorizedToast"
                  : action === "archive"
                    ? "library.bulk.archivedToast"
                    : action === "unarchive"
                      ? "library.bulk.unarchivedToast"
                      : "library.bulk.restoredToast";
              toast.success(t(key, { n: countLabel }));
            }
            setSelectedIds(new Set());
            setBulkCategoryId("");
          },
          onError: () => toast.error(t("toast.error")),
        },
      );
    },
    [bulkNotes, locale, selectedIds, t],
  );

  // Debounce search into the store so the query doesn't run per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.q) setFilters({ q: searchInput });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, filters.q, setFilters]);

  // S4-verification fix: resetFilters alone leaves `searchInput` behind, and
  // the debounce above immediately resurrects the cleared q. Clear both.
  const handleResetFilters = useCallback(() => {
    setSearchInput("");
    resetFilters();
  }, [resetFilters]);

  const hasActiveFilters =
    filters.q !== "" ||
    filters.type !== "all" ||
    filters.categoryId !== "all" ||
    filters.tagIds.length > 0 ||
    filters.favorite ||
    filters.archived ||
    filters.trash;

  const toggleTag = useCallback(
    (tagId: string) => {
      const next = filters.tagIds.includes(tagId)
        ? filters.tagIds.filter((id) => id !== tagId)
        : [...filters.tagIds, tagId];
      setFilters({ tagIds: next });
    },
    [filters.tagIds, setFilters],
  );

  const items = useMemo(
    () => notesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [notesQuery.data],
  );
  const total = notesQuery.data?.pages[0]?.total ?? 0;
  const categories = categoriesQuery.data?.items ?? [];
  const tags = tagsQuery.data?.items ?? [];
  const remaining = Math.max(total - items.length, 0);

  // UX-B4 (T-4) — open the coach-mark once, shortly after the library has
  // items worth bulk-editing. Entering bulk mode (or any dismissal) latches
  // the flag, so this never fires again afterwards.
  useEffect(() => {
    if (bulkSelectMode) return;
    if (items.length < 3) return;
    try {
      if (localStorage.getItem("savedbox.bulk.coach.v1") === "1") return;
    } catch {
      return;
    }
    const timer = setTimeout(() => setBulkCoachOpen(true), 900);
    return () => clearTimeout(timer);
  }, [bulkSelectMode, items.length]);

  // UX-B4 (T-4) — safe exit: Escape ends bulk selection, but ONLY when no
  // modal owns the keystroke (confirm dialogs / capture / sheet / palette
  // render [role=dialog]; their Escape must close THEM, never wipe the
  // user's selection from beneath them).
  useEffect(() => {
    if (!bulkSelectMode) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (document.querySelector("[role='dialog']")) return;
      exitSelection();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [bulkSelectMode, exitSelection]);

  // UX-B4 (T-4) — select-all / deselect-all over the CURRENTLY VISIBLE items
  // (respecting active filters): the full select → apply → exit flow in the
  // count-bearing action bar, never touching items outside the view.
  const allSelected = items.length > 0 && items.every((note) => selectedIds.has(note.id));
  const toggleSelectAll = useCallback(() => {
    setSelectedIds((current) =>
      items.length > 0 && items.every((note) => current.has(note.id))
        ? new Set<string>()
        : new Set(items.map((note) => note.id)),
    );
  }, [items]);

  /** N5 — permanent delete of ONE trashed note. Never feeds the S5 undo
   * metric (irreversible) and carries its own causal confirm dialog. */
  const confirmPurge = () => {
    const target = purgeTarget;
    setPurgeTarget(null);
    if (!target) return;
    bulkNotes.mutate(
      { ids: [target.id], action: "purge" },
      {
        onSuccess: (result) =>
          toast.success(
            t("library.trash.purgedToast", {
              n: formatNumber(result.updated, locale),
            }),
          ),
        onError: () => toast.error(t("toast.error")),
      },
    );
  };

  /** N5 — empty the trash after the two-step confirmation completes. */
  const confirmEmptyTrash = () => {
    emptyTrash.mutate(undefined, {
      onSuccess: (result) =>
        toast.success(
          t("library.trash.emptyDoneToast", {
            n: formatNumber(result.deleted, locale),
          }),
        ),
      onError: () => toast.error(t("toast.error")),
    });
  };

  /** N5 — NoteCard reports a purge REQUEST by id; resolve it to the note so
   * the causal dialog can name the exact item before anything is deleted. */
  const handlePurgeRequest = (id: string) => {
    setPurgeTarget(items.find((note) => note.id === id) ?? null);
  };

  const isDefaultFilters =
    !hasActiveFilters && filters.sort === "newest";

  // QE5 — active-filter count (sort/layout are preferences, not filters).
  const activeFilterCount =
    (filters.q ? 1 : 0) +
    (filters.type !== "all" ? 1 : 0) +
    (filters.categoryId !== "all" ? 1 : 0) +
    filters.tagIds.length +
    (filters.favorite ? 1 : 0) +
    (filters.archived ? 1 : 0) +
    (filters.trash ? 1 : 0);

  const activeCategory =
    filters.categoryId === "all"
      ? null
      : categories.find((category) => category.id === filters.categoryId);
  const activeCategoryLabel =
    filters.categoryId === "none"
      ? t("common.none")
      : activeCategory
        ? localizedCategoryName(activeCategory, locale)
        : filters.categoryId;

  // UX-B1 — count of filters that live INSIDE the Filter panel (the badge on
  // the entry button). q/type live on their own layers; the FULL active count
  // remains the QE5 bar's job.
  const panelFilterCount =
    (filters.favorite ? 1 : 0) +
    (filters.categoryId !== "all" ? 1 : 0) +
    filters.tagIds.length;

  // One shared trigger for both the desktop Popover and the mobile Drawer.
  const filterTrigger = (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "h-8 shrink-0 gap-1.5 rounded-full text-xs",
        panelFilterCount > 0 && "border-primary/60 bg-primary/10 text-primary",
      )}
      aria-label={
        panelFilterCount > 0
          ? `${t("a11y.filtersButton")} — ${t("library.activeFilters.count", {
              n: formatNumber(panelFilterCount, locale),
            })}`
          : t("a11y.filtersButton")
      }
    >
      <Filter className="size-3.5" aria-hidden="true" />
      {t("library.filters.button")}
      {panelFilterCount > 0 ? (
        <span
          className="flex size-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
          aria-hidden="true"
        >
          {formatNumber(panelFilterCount, locale)}
        </span>
      ) : null}
      <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
    </Button>
  );

  const renderBody = () => {
    if (notesQuery.isLoading && !notesQuery.data) {
      return filters.layout === "grid" ? <GridSkeleton /> : <ListSkeleton rows={7} />;
    }
    if (notesQuery.isError) {
      return (
        <ErrorState
          onRetry={() => notesQuery.refetch()}
          message={undefined}
        />
      );
    }
    if (items.length === 0) {
      if (filters.trash) {
        // N5 — an explicit, non-silent empty-trash state (mirrors the N1
        // inbox zero-state rule).
        return (
          <EmptyState
            icon={Trash2}
            title={t("library.trash.empty.title")}
            description={t("library.trash.empty.desc")}
          />
        );
      }
      // UX-A7 — the empty sweep: each zero state names its own cause in the
      // inbox's friendly tone, all through the ONE shared EmptyState.
      // Priority: trash > search echo > category echo > generic filters >
      // the default capture invitation.
      if (filters.q) {
        return (
          <EmptyState
            icon={SearchX}
            title={t("library.search.empty.title")}
            description={t("library.search.empty.desc", { q: filters.q })}
            action={
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                {t("library.clearFilters")}
              </Button>
            }
          />
        );
      }
      if (filters.categoryId !== "all" && filters.categoryId !== "none") {
        const CategoryIcon = activeCategory
          ? iconByName(activeCategory.icon)
          : FolderOpen;
        return (
          <EmptyState
            icon={CategoryIcon}
            title={t("library.category.empty.title")}
            description={t("library.category.empty.desc", {
              name: activeCategoryLabel,
            })}
            action={
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                {t("library.clearFilters")}
              </Button>
            }
          />
        );
      }
      return isDefaultFilters ? (
        <EmptyState
          title={t("library.empty.title")}
          description={t("library.empty.desc")}
          action={
            <Button onClick={() => setCaptureOpen(true)}>
              <Plus className="size-4" aria-hidden="true" />
              {t("dashboard.quickCapture")}
            </Button>
          }
        />
      ) : (
        <EmptyState
          title={t("library.noResults.title")}
          description={t("library.noResults.desc")}
          action={
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              {t("library.clearFilters")}
            </Button>
          }
        />
      );
    }
    return filters.layout === "grid" ? (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            layout="grid"
            onOpen={openNote}
            selectionMode={bulkSelectMode}
            selected={selectedIds.has(note.id)}
            onToggleSelect={toggleSelect}
            trashMode={filters.trash}
            onPurge={handlePurgeRequest}
          />
        ))}
      </div>
    ) : (
      <div className="space-y-2">
        {items.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            layout="list"
            onOpen={openNote}
            selectionMode={bulkSelectMode}
            selected={selectedIds.has(note.id)}
            onToggleSelect={toggleSelect}
            trashMode={filters.trash}
            onPurge={handlePurgeRequest}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-bold sm:text-xl">{t("library.title")}</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {t("library.resultsCount", { n: formatNumber(total, locale) })}
          </span>
          {filters.trash && total > 0 ? (
            /* N5 — one batched write empties the whole trash; the button is
               only the entry to the MANDATORY two-step confirmation below. */
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-destructive/30 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={emptyTrash.isPending}
              onClick={() => setEmptyStep(1)}
            >
              {emptyTrash.isPending ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="size-3.5" aria-hidden="true" />
              )}
              {t("library.trash.emptyTrashCount", {
                n: formatNumber(total, locale),
              })}
            </Button>
          ) : null}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-muted-foreground start-3"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder={t("library.searchPlaceholder")}
          aria-label={t("a11y.search")}
          className="h-10 ps-9"
        />
        {searchInput ? (
          /* UX-A9 — icon-only buttons carry aria-label AND a visible tooltip. */
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={t("library.search.clear")}
                onClick={() => setSearchInput("")}
                className="absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground end-2"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{t("library.search.clear")}</TooltipContent>
          </Tooltip>
        ) : null}
      </div>

      {/* UX-B1 (T-1/T-6) — three-layer toolbar architecture:
          layer 1: always-visible search (above);
          layer 2: the five content-type chips (+ All) — the only chips kept
                   in the open row;
          layer 3: ONE «Filters» entry (desktop popover / mobile bottom-sheet)
                   holding the state toggles + category + tags, next to the
                   always-visible stable controls (sort / layout / bulk — QE2). */}
      <div className="scroll-area -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {/* Layer 2 — type chips */}
        <FilterChip
          active={filters.type === "all"}
          onClick={() => setFilters({ type: "all" })}
          label={t("common.all")}
        />
        {NOTE_TYPES.map((type) => {
          const meta = TYPE_META[type];
          const Icon = meta.icon;
          const active = filters.type === type;
          return (
            <FilterChip
              key={type}
              active={active}
              onClick={() => setFilters({ type })}
              icon={<Icon className="size-3.5" style={{ color: meta.color }} aria-hidden="true" />}
              label={t(meta.labelKey)}
            />
          );
        })}
      </div>

      {/* Layer 3 — filter entry + stable controls (QE2: never scrolled away) */}
      <div className="flex flex-wrap items-center gap-1.5">
        {isMobile ? (
          <Drawer open={filterOpen} onOpenChange={setFilterOpen}>
            <DrawerTrigger asChild>{filterTrigger}</DrawerTrigger>
            <DrawerContent className="max-h-[85dvh]">
              <DrawerHeader className="pb-2">
                <DrawerTitle className="flex items-center justify-center gap-2 text-sm">
                  {t("library.filters.button")}
                  {panelFilterCount > 0 ? (
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {formatNumber(panelFilterCount, locale)}
                    </span>
                  ) : null}
                </DrawerTitle>
              </DrawerHeader>
              <div className="scroll-area max-h-[55dvh] overflow-y-auto px-4 pb-2">
                <FilterPanelContent
                  categories={categories}
                  tags={tags}
                  locale={locale}
                />
              </div>
              <DrawerFooter className="flex-row gap-2 border-t pt-3">
                <Button
                  variant="outline"
                  className="h-10 flex-1 text-xs"
                  onClick={handleResetFilters}
                >
                  {t("common.clearAll")}
                </Button>
                <Button
                  className="h-10 flex-1 text-xs"
                  onClick={() => setFilterOpen(false)}
                >
                  {t("library.filters.apply")}
                </Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        ) : (
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>{filterTrigger}</PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-3">
              <FilterPanelContent
                categories={categories}
                tags={tags}
                locale={locale}
              />
              {panelFilterCount > 0 ? (
                <div className="mt-3 border-t pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-full text-xs text-muted-foreground"
                    onClick={handleResetFilters}
                  >
                    {t("common.clearAll")}
                  </Button>
                </div>
              ) : null}
            </PopoverContent>
          </Popover>
        )}

        <span className="h-6 w-px shrink-0 bg-border" aria-hidden="true" />

        {/* Sort */}
        <Select
          value={filters.sort}
          onValueChange={(value) => setFilters({ sort: value as typeof filters.sort })}
        >
          <SelectTrigger
            size="sm"
            className="h-8 w-32 shrink-0 text-xs"
            aria-label={t("library.sort")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t("library.sort.newest")}</SelectItem>
            <SelectItem value="oldest">{t("library.sort.oldest")}</SelectItem>
            <SelectItem value="title">{t("library.sort.title")}</SelectItem>
          </SelectContent>
        </Select>

        {/* Layout toggle — UX-A9: both icon-only toggles have aria-label +
            tooltip (fa/en via the dictionary). */}
        <div className="flex shrink-0 items-center rounded-full border p-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={t("library.layout.grid")}
                aria-pressed={filters.layout === "grid"}
                onClick={() => setFilters({ layout: "grid" })}
                className={cn(
                  "flex size-7 items-center justify-center rounded-full transition-colors",
                  filters.layout === "grid"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground",
                )}
              >
                <LayoutGrid className="size-3.5" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{t("library.layout.grid")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={t("library.layout.list")}
                aria-pressed={filters.layout === "list"}
                onClick={() => setFilters({ layout: "list" })}
                className={cn(
                  "flex size-7 items-center justify-center rounded-full transition-colors",
                  filters.layout === "list"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground",
                )}
              >
                <List className="size-3.5" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{t("library.layout.list")}</TooltipContent>
          </Tooltip>
        </div>

        {/* S6 — bulk-selection toggle (stable end of the bar, like sort/layout).
            UX-A9 — Radix tooltip replaces the bare native title.
            UX-B4 (T-4) — the ONE-time coach-mark is anchored HERE (the hidden
            feature teaches at its own entry); ANY dismiss latches the flag. */}
        <Popover
          open={bulkCoachOpen}
          onOpenChange={(open) => {
            if (open) setBulkCoachOpen(true);
            else dismissBulkCoach();
          }}
        >
          <PopoverTrigger asChild>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={bulkSelectMode ? t("library.bulk.exit") : t("library.bulk.select")}
                  aria-pressed={bulkSelectMode}
                  onClick={() => {
                    dismissBulkCoach();
                    if (bulkSelectMode) exitSelection();
                    else setBulkSelectMode(true);
                  }}
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                    bulkSelectMode
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:text-foreground",
                  )}
                >
                  <ListChecks className="size-4" aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {bulkSelectMode ? t("library.bulk.exit") : t("library.bulk.select")}
              </TooltipContent>
            </Tooltip>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={10}
            className="w-64 p-3 text-xs"
            role="dialog"
            aria-label={t("library.bulk.coach.title")}
          >
            <p className="font-semibold">{t("library.bulk.coach.title")}</p>
            <p className="mt-1 leading-5 text-muted-foreground">
              {t("library.bulk.coach.desc")}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2.5 h-8 w-full text-xs"
              onClick={dismissBulkCoach}
            >
              {t("library.bulk.coach.dismiss")}
            </Button>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active filters bar (QE5): one removable chip per active filter,
          a live counter and clear-all; hidden entirely when nothing is set. */}
      {hasActiveFilters ? (
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t("library.activeFilters.count", { n: formatNumber(activeFilterCount, locale) })}>
          {filters.q ? (
            <ActiveFilterChip
              label={`«${filters.q}»`}
              onRemove={() => {
                setSearchInput("");
                setFilters({ q: "" });
              }}
            />
          ) : null}
          {filters.type !== "all" ? (
            <ActiveFilterChip
              label={t(TYPE_META[filters.type].labelKey)}
              onRemove={() => setFilters({ type: "all" })}
            />
          ) : null}
          {filters.categoryId !== "all" ? (
            <ActiveFilterChip
              label={activeCategoryLabel}
              onRemove={() => setFilters({ categoryId: "all" })}
            />
          ) : null}
          {filters.tagIds.map((tagId) => {
            const tag = tags.find((item) => item.id === tagId);
            return (
              <ActiveFilterChip
                key={tagId}
                label={tag?.name ?? tagId}
                onRemove={() => toggleTag(tagId)}
              />
            );
          })}
          {filters.favorite ? (
            <ActiveFilterChip
              label={t("library.filters.favorite")}
              onRemove={() => setFilters({ favorite: false })}
            />
          ) : null}
          {filters.archived ? (
            <ActiveFilterChip
              label={t("library.filters.archived")}
              onRemove={() => setFilters({ archived: false })}
            />
          ) : null}
          {filters.trash ? (
            <ActiveFilterChip
              label={t("library.filters.trash")}
              onRemove={() => setFilters({ trash: false })}
            />
          ) : null}
          <span className="ms-auto shrink-0 text-[11px] text-muted-foreground">
            {t("library.activeFilters.count", {
              n: formatNumber(activeFilterCount, locale),
            })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground"
            onClick={handleResetFilters}
          >
            {t("common.clearAll")}
          </Button>
        </div>
      ) : null}

      {renderBody()}

      {/* S6 — bulk-selection action bar. Fixed above the mobile bottom nav
      (74px ≈ nav height) and centered near the bottom edge on desktop. */}
      {bulkSelectMode ? (
        <div
          role="toolbar"
          aria-label={t("a11y.bulkActions")}
          className="fixed inset-x-3 bottom-[74px] z-30 lg:inset-x-auto lg:bottom-4 lg:left-1/2 lg:right-auto lg:-translate-x-1/2"
        >
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border bg-popover p-2 shadow-lg">
            {/* UX-B4 (T-4) — the count is a polite live region (screen readers
                announce every selection change) and visually ramps with the
                selection state. */}
            <span
              aria-live="polite"
              className={cn(
                "min-w-16 px-1 text-xs font-semibold tabular-nums",
                selectedIds.size > 0 ? "text-primary" : "text-muted-foreground",
              )}
            >
              {t("library.bulk.selected", {
                n: formatNumber(selectedIds.size, locale),
              })}
            </span>

            {/* UX-B4 (T-4) — select-all / deselect-all over the visible items:
                the count bar now carries the WHOLE select → apply → exit flow. */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              disabled={items.length === 0 || bulkNotes.isPending}
              onClick={toggleSelectAll}
            >
              {allSelected ? (
                <Square className="size-3.5" aria-hidden="true" />
              ) : (
                <CheckCheck className="size-3.5" aria-hidden="true" />
              )}
              {allSelected
                ? t("library.bulk.deselectAll")
                : t("library.bulk.selectAll")}
            </Button>

            {filters.trash ? (
              /* Trash view: bulk restore only (soft-delete contract) */
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                disabled={selectedIds.size === 0 || bulkNotes.isPending}
                onClick={() => runBulk("restore")}
              >
                {bulkNotes.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Archive className="size-3.5" aria-hidden="true" />
                )}
                {t("library.bulk.restore")}
              </Button>
            ) : (
              <>
                <Select
                  value={bulkCategoryId}
                  onValueChange={(value) =>
                    runBulk(
                      "categorize",
                      value === "none" ? null : value,
                    )
                  }
                >
                  <SelectTrigger
                    size="sm"
                    className="h-8 min-w-28 text-xs"
                    aria-label={t("library.bulk.categorize")}
                    disabled={selectedIds.size === 0 || bulkNotes.isPending}
                  >
                    <SelectValue placeholder={t("library.bulk.selectCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("common.none")}</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {localizedCategoryName(category, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {filters.archived ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    disabled={selectedIds.size === 0 || bulkNotes.isPending}
                    onClick={() => runBulk("unarchive")}
                  >
                    <Archive className="size-3.5" aria-hidden="true" />
                    {t("library.bulk.unarchive")}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    disabled={selectedIds.size === 0 || bulkNotes.isPending}
                    onClick={() => runBulk("archive")}
                  >
                    <Archive className="size-3.5" aria-hidden="true" />
                    {t("library.bulk.archive")}
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive"
                  disabled={selectedIds.size === 0 || bulkNotes.isPending}
                  onClick={() => runBulk("delete")}
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  {t("library.bulk.delete")}
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={exitSelection}
              aria-label={t("library.bulk.clear")}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : null}

      {/* N5 — single-item purge: one causal AlertDialog that names the exact
          item; the destructive action is explicit and unambiguous. */}
      <AlertDialog
        open={purgeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setPurgeTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("library.trash.purge.confirm.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("library.trash.purge.confirm.desc", {
                name: purgeTarget?.title ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive"
              onClick={(event) => {
                // Keep the dialog open until the mutation settles.
                event.preventDefault();
                confirmPurge();
              }}
            >
              {bulkNotes.isPending
                ? t("common.loading")
                : t("library.trash.purge.confirm.accept")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* N5 — empty trash: the MANDATORY two-step confirmation (step 1 =
          scope + irreversibility; step 2 = final consent). Radix stays open
          (preventDefault) so the user always lands on the explicit final
          consent step — no accidental single-click empties. */}
      <AlertDialog
        open={emptyStep >= 1}
        onOpenChange={(open) => {
          if (!open) setEmptyStep(0);
        }}
      >
        <AlertDialogContent>
          {emptyStep === 1 ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("library.trash.confirm.title")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("library.trash.confirm.desc", {
                    n: formatNumber(total, locale),
                  })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setEmptyStep(0)}>
                  {t("common.cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(event) => {
                    // Radix closes on Action click by default — prevent it so
                    // the SAME dialog advances to the final consent step.
                    event.preventDefault();
                    setEmptyStep(2);
                  }}
                >
                  {t("library.trash.confirm.next")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("library.trash.confirm2.title")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("library.trash.confirm2.desc", {
                    n: formatNumber(total, locale),
                  })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setEmptyStep(0)}>
                  {t("common.cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive"
                  onClick={(event) => {
                    event.preventDefault();
                    setEmptyStep(0);
                    confirmEmptyTrash();
                  }}
                >
                  {t("library.trash.confirm2.accept")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* S1 — load more: appended 30-item pages; hidden when everything is shown. */}
      {notesQuery.hasNextPage && !notesQuery.isError && items.length > 0 ? (
        <div className="flex justify-center pt-1">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={notesQuery.isFetchingNextPage}
            onClick={() => notesQuery.fetchNextPage()}
          >
            {notesQuery.isFetchingNextPage ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            {t("library.loadMore", { n: formatNumber(remaining, locale) })}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors",
        active
          ? "border-primary/60 bg-primary text-primary-foreground"
          : "bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/** QE5 — one removable chip per active filter. */
function ActiveFilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  const { t } = useI18n();
  return (
    <Badge variant="secondary" className="gap-1 rounded-full ps-2.5 pe-1">
      <span className="max-w-40 truncate">{label}</span>
      <button
        type="button"
        aria-label={`${t("a11y.removeFilter")}: ${label}`}
        onClick={onRemove}
        className="flex size-4 items-center justify-center rounded-full hover:bg-background/60"
      >
        <X className="size-3" aria-hidden="true" />
      </button>
    </Badge>
  );
}

/** UX-B1 (T-6) — the shared filter surface inside the unified «Filters»
 * entry, structured by the IA split: «status & places» rows first (favorite /
 * uncategorized / archived / trash), then the organizing facets (category
 * select + tag checks). Rendered verbatim by the desktop Popover AND the
 * mobile bottom-sheet Drawer — one filter matrix, two containers. */
function FilterPanelContent({
  categories,
  tags,
  locale,
}: {
  categories: CategoryDTO[];
  tags: TagDTO[];
  locale: Locale;
}) {
  const { t } = useI18n();
  const filters = useAppStore((state) => state.filters);
  const setFilters = useAppStore((state) => state.setFilters);

  const toggleTag = useCallback(
    (tagId: string) => {
      const next = filters.tagIds.includes(tagId)
        ? filters.tagIds.filter((id) => id !== tagId)
        : [...filters.tagIds, tagId];
      setFilters({ tagIds: next });
    },
    [filters.tagIds, setFilters],
  );

  return (
    <div className="space-y-3">
      <section aria-label={t("library.filters.sectionState")} className="space-y-0.5">
        <p className="px-1 pb-1 text-[11px] font-semibold text-muted-foreground">
          {t("library.filters.sectionState")}
        </p>
        <FilterToggleRow
          icon={Star}
          label={t("library.filters.favorite")}
          checked={filters.favorite}
          onToggle={() => setFilters({ favorite: !filters.favorite })}
        />
        <FilterToggleRow
          icon={Inbox}
          label={t("library.filters.uncategorized")}
          checked={filters.categoryId === "none"}
          onToggle={() =>
            setFilters({ categoryId: filters.categoryId === "none" ? "all" : "none" })
          }
        />
        <FilterToggleRow
          icon={Archive}
          label={t("library.filters.archived")}
          hint={t("library.filters.archiveHint")}
          checked={filters.archived}
          onToggle={() => setFilters({ archived: !filters.archived })}
        />
        <FilterToggleRow
          icon={Trash2}
          label={t("library.filters.trash")}
          hint={t("library.filters.trashHint")}
          checked={filters.trash}
          onToggle={() => setFilters({ trash: !filters.trash })}
        />
      </section>

      <section aria-label={t("library.filters.sectionOrganize")} className="space-y-1.5">
        <p className="px-1 text-[11px] font-semibold text-muted-foreground">
          {t("library.filters.sectionOrganize")}
        </p>
        <Select
          value={filters.categoryId}
          onValueChange={(value) => setFilters({ categoryId: value })}
        >
          <SelectTrigger
            className="w-full"
            aria-label={t("library.filters.category")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            <SelectItem value="none">{t("common.none")}</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {localizedCategoryName(category, locale)} (
                {formatNumber(category.noteCount, locale)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="scroll-area max-h-44 overflow-y-auto">
          {tags.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">
              {t("tags.empty")}
            </p>
          ) : (
            tags.map((tag) => {
              const checked = filters.tagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  aria-pressed={checked}
                  onClick={() => toggleTag(tag.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-xs hover:bg-accent"
                >
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded border",
                      checked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input",
                    )}
                  >
                    {checked ? <Check className="size-3" aria-hidden="true" /> : null}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{tag.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatNumber(tag.noteCount, locale)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

/** UX-B1 — one accessible switch row (role="switch") with a directional
 * thumb (rtl/ltr both covered). The whole row is the hit target.
 * UX-B7 (A-3.4) — an optional muted `hint` line gives the archive-vs-trash
 * distinction right at the touch point (بایگانی = out of sight; سطل = 7-day
 * countdown to permanent deletion). */
function FilterToggleRow({
  icon: Icon,
  label,
  hint,
  checked,
  onToggle,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-start text-xs transition-colors hover:bg-accent"
    >
      <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{label}</span>
        {hint ? (
          <span className="mt-0.5 block text-[10.5px] leading-4 font-normal text-muted-foreground">
            {hint}
          </span>
        ) : null}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "flex h-4.5 w-8 shrink-0 items-center rounded-full border p-0.5 transition-colors",
          checked ? "border-primary bg-primary" : "border-transparent bg-input",
        )}
      >
        <span
          className={cn(
            "size-3.5 rounded-full bg-background shadow-sm transition-transform",
            checked && "ltr:translate-x-3.5 rtl:-translate-x-3.5",
          )}
        />
      </span>
    </button>
  );
}
