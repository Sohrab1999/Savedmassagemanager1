"use client";

// Bottom tab bar (mobile) + sidebar (desktop) sharing one nav model.

import { LayoutDashboard, LayoutGrid, Library, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useAppStore, type AppView } from "@/stores/app-store";
import type { I18nKey } from "@/lib/i18n/dictionaries";

interface NavItem {
  view: AppView;
  labelKey: I18nKey;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { view: "dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { view: "library", labelKey: "nav.library", icon: Library },
  { view: "categories", labelKey: "nav.categories", icon: LayoutGrid },
  { view: "settings", labelKey: "nav.settings", icon: Settings },
];

function useActiveView() {
  return useAppStore((state) => state.view);
}

export function BottomNav() {
  const { t } = useI18n();
  const view = useActiveView();
  const setView = useAppStore((state) => state.setView);

  return (
    <nav
      aria-label={t("a11y.mainNav")}
      className="flex h-16 shrink-0 items-stretch border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      {NAV_ITEMS.map((item) => {
        const active = view === item.view;
        const Icon = item.icon;
        return (
          <button
            key={item.view}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => setView(item.view)}
            className={cn(
              "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors",
              active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-10 items-center justify-center rounded-full transition-colors",
                active && "bg-primary/12",
              )}
            >
              <Icon className="size-[18px]" aria-hidden="true" />
            </span>
            {t(item.labelKey)}
          </button>
        );
      })}
    </nav>
  );
}

export function SidebarNav() {
  const { t } = useI18n();
  const view = useActiveView();
  const setView = useAppStore((state) => state.setView);

  return (
    <aside
      aria-label={t("a11y.mainNav")}
      className="hidden w-56 shrink-0 flex-col border-e bg-sidebar p-3 lg:flex"
    >
      <div className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = view === item.view;
          const Icon = item.icon;
          return (
            <button
              key={item.view}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => setView(item.view)}
              className={cn(
                "flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {t(item.labelKey)}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
