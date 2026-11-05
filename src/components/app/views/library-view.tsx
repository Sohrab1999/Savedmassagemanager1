"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  Check,
  ChevronDown,
  Filter,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  Search,
  Star,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, ErrorState, GridSkeleton, ListSkeleton } from "@/components/app/states";
import { NoteCard } from "@/components/app/note-card";
import { localizedCategoryName, TYPE_META } from "@/components/app/meta";
import { useNotes, useCategories, useTags } from "@/hooks/queries";
import { useI18n } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";
import { NOTE_TYPES } from "@/lib/domain/types";
import { useAppStore } from "@/stores/app-store";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export function LibraryView() {
  const { t, locale } = useI18n();
  const filters = useAppStore((state) => state.filters);
  const setFilters = useAppStore((state) => state.setFilters);
  const resetFilters = useAppStore((state) => state.resetFilters);
  const openNote = useAppStore((state) => state.openNote);
  const setCaptureOpen = useAppStore((state) => state.setCaptureOpen);

  const notesQuery = useNotes(filters);
  const categoriesQuery = useCategories();
  const tagsQuery = useTags();

  const [searchInput, setSearchInput] = useState(filters.q);

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
    filters.archived;

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

  const isDefaultFilters =
    !hasActiveFilters && filters.sort === "newest";

  // QE5 — active-filter count (sort/layout are preferences, not filters).
  const activeFilterCount =
    (filters.q ? 1 : 0) +
    (filters.type !== "all" ? 1 : 0) +
    (filters.categoryId !== "all" ? 1 : 0) +
    filters.tagIds.length +
    (filters.favorite ? 1 : 0) +
    (filters.archived ? 1 : 0);

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
          <NoteCard key={note.id} note={note} layout="grid" onOpen={openNote} />
        ))}
      </div>
    ) : (
      <div className="space-y-2">
        {items.map((note) => (
          <NoteCard key={note.id} note={note} layout="list" onOpen={openNote} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-bold sm:text-xl">{t("library.title")}</h1>
        <span className="text-xs text-muted-foreground">
          {t("library.resultsCount", { n: formatNumber(total, locale) })}
        </span>
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
          <button
            type="button"
            aria-label={t("common.clearAll")}
            onClick={() => setSearchInput("")}
            className="absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground end-2"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {/* Filter toolbar — scrollable chips + always-visible stable controls (QE2):
          sort & layout live OUTSIDE the horizontal scroll area so they are
          reachable without scrolling at any viewport width. */}
      <div className="flex items-center gap-1.5">
        <div className="scroll-area -mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 pb-1">
        {/* Type chips */}
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

        <span className="mx-0.5 w-px shrink-0 bg-border" aria-hidden="true" />

        {/* Favorite / archived */}
        <FilterChip
          active={filters.favorite}
          onClick={() => setFilters({ favorite: !filters.favorite })}
          icon={<Star className="size-3.5" aria-hidden="true" />}
          label={t("library.filters.favorite")}
        />
        <FilterChip
          active={filters.archived}
          onClick={() => setFilters({ archived: !filters.archived })}
          icon={<Archive className="size-3.5" aria-hidden="true" />}
          label={t("library.filters.archived")}
        />

        <span className="mx-0.5 w-px shrink-0 bg-border" aria-hidden="true" />

        {/* Category select */}
        <Select
          value={filters.categoryId}
          onValueChange={(value) => setFilters({ categoryId: value })}
        >
          <SelectTrigger
            size="sm"
            className="h-8 min-w-28 shrink-0 text-xs"
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

        {/* Tags popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 shrink-0 gap-1.5 rounded-full text-xs",
                filters.tagIds.length > 0 && "border-primary/60 bg-primary/10 text-primary",
              )}
            >
              <Filter className="size-3.5" aria-hidden="true" />
              {filters.tagIds.length > 0
                ? t("library.filters.tagsSelected", {
                    n: formatNumber(filters.tagIds.length, locale),
                  })
                : t("library.filters.tags")}
              <ChevronDown className="size-3.5" aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-2">
            <div className="scroll-area max-h-64 overflow-y-auto">
              {tags.length === 0 ? (
                <p className="p-2 text-xs text-muted-foreground">{t("tags.empty")}</p>
              ) : (
                tags.map((tag) => {
                  const checked = filters.tagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
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
          </PopoverContent>
        </Popover>
        </div>

        {/* Stable end of the bar — never scrolls out of view (QE2) */}
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

        {/* Layout toggle */}
        <div className="flex shrink-0 items-center rounded-full border p-0.5">
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
        </div>
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
