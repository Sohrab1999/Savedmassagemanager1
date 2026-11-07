"use client";

import {
  Archive,
  Bookmark,
  CheckCircle2,
  Clock3,
  Inbox,
  Plus,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
  StatCardsSkeleton,
} from "@/components/app/states";
import { NoteCard } from "@/components/app/note-card";
import { iconByName, localizedCategoryName, TYPE_META } from "@/components/app/meta";
import { useProfile, useStats } from "@/hooks/queries";
import { useI18n } from "@/lib/i18n";
import { formatDate, formatNumber } from "@/lib/format";
import { NOTE_TYPES } from "@/lib/domain/types";
import { useAppStore } from "@/stores/app-store";
import { ApiError } from "@/lib/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/** N4 — interactive stats: cards with an equivalent library filter are real
 * buttons (QE3 parity with the category tiles). Keyboard- and
 * screen-reader-accessible via the native <button> + explicit aria-label. */
function StatCard({
  icon: Icon,
  label,
  value,
  onClick,
  ariaLabel,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const { locale } = useI18n();
  const body = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-6">
          {formatNumber(value, locale)}
        </p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </>
  );
  if (!onClick) {
    return (
      <Card className="border bg-card shadow-xs">
        <CardContent className="flex items-center gap-3 p-4">{body}</CardContent>
      </Card>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      title={label}
      className={cn(
        "w-full rounded-xl border bg-card text-start shadow-xs transition-all",
        "hover:border-primary/40 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-ring",
      )}
    >
      <span className="flex items-center gap-3 p-4">{body}</span>
    </button>
  );
}

function greetingKey(hour: number) {
  if (hour < 12) return "greeting.morning" as const;
  if (hour < 18) return "greeting.afternoon" as const;
  return "greeting.evening" as const;
}

export function DashboardView() {
  const { t, locale } = useI18n();
  const statsQuery = useStats();
  const profileQuery = useProfile();
  const setView = useAppStore((state) => state.setView);
  const setCaptureOpen = useAppStore((state) => state.setCaptureOpen);
  const setFilters = useAppStore((state) => state.setFilters);
  const resetFilters = useAppStore((state) => state.resetFilters);

  const stats = statsQuery.data;
  const profile = profileQuery.data;

  if (statsQuery.isLoading || profileQuery.isLoading) {
    return (
      <div className="space-y-5">
        <div className="space-y-1.5">
          <div className="h-7 w-40 rounded-lg bg-muted" />
          <div className="h-4 w-56 rounded-lg bg-muted" />
        </div>
        <StatCardsSkeleton />
        <ListSkeleton rows={4} />
      </div>
    );
  }

  if (statsQuery.isError) {
    const message =
      statsQuery.error instanceof ApiError ? undefined : statsQuery.error.message;
    return (
      <ErrorState
        message={message}
        onRetry={() => statsQuery.refetch()}
      />
    );
  }

  if (!stats) return <ErrorState onRetry={() => statsQuery.refetch()} />;

  if (stats.total === 0) {
    return (
      <EmptyState
        icon={Bookmark}
        title={t("dashboard.empty.title")}
        description={t("dashboard.empty.desc")}
        action={
          <Button onClick={() => setCaptureOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            {t("dashboard.empty.cta")}
          </Button>
        }
      />
    );
  }

  const maxTypeCount = Math.max(
    ...NOTE_TYPES.map((type) => stats.byType[type] ?? 0),
    1,
  );

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <section className="space-y-1">
        <h1 className="text-xl font-bold sm:text-2xl">
          {t(greetingKey(new Date().getHours()))}
          {profile?.displayName ? `، ${profile.displayName}` : ""}
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          {t("dashboard.subtitle")} · {formatDate(new Date().toISOString(), locale)}
        </p>
      </section>

      {/* Quick capture */}
      <button
        type="button"
        onClick={() => setCaptureOpen(true)}
        className="flex w-full items-center gap-3 rounded-xl border border-dashed border-primary/50 bg-primary/5 p-4 text-start transition-colors hover:bg-primary/10"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Plus className="size-5" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold">
            {t("dashboard.quickCapture")}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {t("dashboard.quickCaptureHint")}
          </span>
        </span>
      </button>

      {/* N1 — visible Inbox: the "organize later" debt as a first-class
          surface. One click deep-links to the library filtered on
          «بدون دسته» (#/library?cat=none via S3) where S6 bulk categorize
          clears it. Zero state is explicit, not silent. */}
      {stats.uncategorized > 0 ? (
        <button
          type="button"
          onClick={() => {
            setFilters({ categoryId: "none" });
            setView("library");
          }}
          aria-label={t("a11y.inbox")}
          className="flex w-full items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4 text-start transition-colors hover:bg-primary/10"
        >
          <span className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Inbox className="size-5" aria-hidden="true" />
            <span
              aria-hidden="true"
              className="absolute -top-1.5 -end-1.5 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 py-0.5 text-[10px] font-bold leading-none text-primary-foreground"
            >
              {formatNumber(stats.uncategorized, locale)}
            </span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">{t("dashboard.inbox.title")}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {t("dashboard.inbox.desc", {
                n: formatNumber(stats.uncategorized, locale),
              })}
            </span>
          </span>
        </button>
      ) : (
        <div
          aria-live="polite"
          className="flex items-center gap-3 rounded-xl border border-dashed p-4 text-muted-foreground"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <CheckCircle2 className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-foreground">
              {t("dashboard.inbox.zeroTitle")}
            </span>
            <span className="block truncate text-xs">{t("dashboard.inbox.zero")}</span>
          </span>
        </div>
      )}

      {/* Stats — N4: cards with an equivalent library filter deep-link to it
          (total → #/library, favorites → fav=1, archived → arch=1). The
          "this week" card stays display-only: a savedAfter=7d filter would
          add a new filter dimension to both backends for a marginal path —
          decision recorded in the N4 DoD. */}
      <section aria-label={t("dashboard.subtitle")}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={Bookmark}
            label={t("dashboard.stats.total")}
            value={stats.total}
            onClick={() => {
              resetFilters();
              setView("library");
            }}
            ariaLabel={t("a11y.stats.total")}
          />
          <StatCard
            icon={Star}
            label={t("dashboard.stats.favorites")}
            value={stats.favorites}
            onClick={() => {
              // N4 — stat cards build a CLEAN filtered view: stale filters
              // from a previous visit must not leak into the deep-link.
              resetFilters();
              setFilters({ favorite: true });
              setView("library");
            }}
            ariaLabel={t("a11y.stats.favorites")}
          />
          <StatCard
            icon={Clock3}
            label={t("dashboard.stats.thisWeek")}
            value={stats.thisWeek}
          />
          <StatCard
            icon={Archive}
            label={t("dashboard.stats.archived")}
            value={stats.archived}
            onClick={() => {
              resetFilters();
              setFilters({ archived: true });
              setView("library");
            }}
            ariaLabel={t("a11y.stats.archived")}
          />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Category overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t("dashboard.categories.title")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="scroll-area flex gap-2 overflow-x-auto pb-1 xl:grid xl:grid-cols-2 xl:overflow-visible">
              {stats.byCategory.map((category) => {
                const Icon = iconByName(category.icon);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setFilters({ categoryId: category.id });
                      setView("library");
                    }}
                    className="flex w-28 shrink-0 flex-col items-center gap-1.5 rounded-xl border bg-card p-3 transition-colors hover:border-primary/40 xl:w-auto xl:flex-row xl:gap-2.5 xl:text-start"
                  >
                    <span
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${category.color}1f`, color: category.color }}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 text-center xl:text-start">
                      <span className="block truncate text-xs font-medium">
                        {localizedCategoryName(category, locale)}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        {t("categories.count", { n: formatNumber(category.count, locale) })}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Type distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t("dashboard.types.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-0">
            {NOTE_TYPES.map((type) => {
              const meta = TYPE_META[type];
              const value = stats.byType[type] ?? 0;
              const Icon = meta.icon;
              return (
                <div key={type} className="flex items-center gap-2.5">
                  <Icon
                    className="size-4 shrink-0"
                    style={{ color: meta.color }}
                    aria-hidden="true"
                  />
                  <span className="w-12 shrink-0 text-xs text-muted-foreground">
                    {t(meta.labelKey)}
                  </span>
                  <div
                    className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
                    role="presentation"
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max((value / maxTypeCount) * 100, value > 0 ? 6 : 0)}%`,
                        backgroundColor: meta.color,
                      }}
                    />
                  </div>
                  <span className="w-6 text-end text-xs font-medium tabular-nums">
                    {formatNumber(value, locale)}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Recent items */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm">{t("dashboard.recent.title")}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={() => setView("library")}
          >
            {t("dashboard.recent.viewAll")}
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {stats.recent.length === 0 ? (
            <EmptyState title={t("library.empty.title")} description={t("library.empty.desc")} />
          ) : (
            <div className="space-y-2">
              {stats.recent.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  layout="list"
                  onOpen={(id) => useAppStore.getState().openNote(id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
