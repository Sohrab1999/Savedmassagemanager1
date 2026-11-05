"use client";

import { Bookmark, Globe, Moon, Plus, Search, Sun, SunMoon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useAppStore } from "@/stores/app-store";
import { useMounted } from "@/hooks/use-mounted";

function ThemeToggle() {
  const { t } = useI18n();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();

  const cycle = () => {
    if (!mounted) return;
    if (theme === "system") setTheme(resolvedTheme === "dark" ? "light" : "dark");
    else if (theme === "dark") setTheme("light");
    else setTheme("dark");
  };

  const Icon = !mounted
    ? SunMoon
    : theme === "system"
      ? SunMoon
      : theme === "dark"
        ? Moon
        : Sun;

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t("a11y.themeToggle")}
      title={t("a11y.themeToggle")}
      onClick={cycle}
    >
      <Icon className="size-[18px]" aria-hidden="true" />
    </Button>
  );
}

function LanguageToggle() {
  const { t, locale, setLocale } = useI18n();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-9 gap-1.5 px-2.5 font-medium"
      aria-label={t("a11y.languageToggle")}
      title={t("a11y.languageToggle")}
      onClick={() => setLocale(locale === "fa" ? "en" : "fa")}
    >
      <Globe className="size-4" aria-hidden="true" />
      <span className="text-xs">{locale === "fa" ? "EN" : "FA"}</span>
    </Button>
  );
}

export function AppHeader() {
  const { t } = useI18n();
  const setView = useAppStore((state) => state.setView);
  const setCaptureOpen = useAppStore((state) => state.setCaptureOpen);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Bookmark className="size-4.5" aria-hidden="true" />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-bold">{t("app.name")}</p>
          <p className="hidden truncate text-[11px] text-muted-foreground sm:block">
            {t("app.tagline")}
          </p>
        </div>
      </div>

      <div className="ms-auto flex items-center gap-0.5 sm:gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label={t("a11y.search")}
          title={t("a11y.search")}
          onClick={() => setView("library")}
        >
          <Search className="size-[18px]" aria-hidden="true" />
        </Button>
        <LanguageToggle />
        <ThemeToggle />
        <Button
          size="sm"
          className="hidden h-9 gap-1.5 lg:inline-flex"
          onClick={() => setCaptureOpen(true)}
        >
          <Plus className="size-4" aria-hidden="true" />
          {t("dashboard.quickCapture")}
        </Button>
      </div>
    </header>
  );
}
