"use client";

import {
  Bookmark,
  FlaskConical,
  Globe,
  LogIn,
  LogOut,
  Moon,
  Plus,
  Search,
  Sun,
  SunMoon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useI18n } from "@/lib/i18n";
import { useAppStore } from "@/stores/app-store";
import { useMounted } from "@/hooks/use-mounted";
import { useAuth } from "@/hooks/use-auth";

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

export function LanguageToggle() {
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

function AccountChip() {
  const { t } = useI18n();
  const { user, demoMode, signOutUser, exitDemo } = useAuth();
  const setView = useAppStore((state) => state.setView);

  if (user) {
    const label = user.displayName || user.email || "?";
    const initial = label.charAt(0).toUpperCase();
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label={t("a11y.accountMenu")}
            title={label}
          >
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                {initial}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="truncate" dir="ltr">
            {user.email}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={async () => {
              setView("settings");
            }}
          >
            {t("nav.settings")}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              void signOutUser();
            }}
          >
            <LogOut className="size-4" aria-hidden="true" />
            {t("auth.signOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Demo mode chip: explicit label + way back to the auth gate.
  return (
    <div className="flex items-center gap-1">
      <Badge
        variant="secondary"
        className="hidden gap-1 rounded-full px-2 py-0.5 text-[10px] sm:flex"
      >
        <FlaskConical className="size-3" aria-hidden="true" />
        {t("auth.demoBadge")}
      </Badge>
      <Button
        variant="ghost"
        size="sm"
        className="h-9 gap-1.5 px-2.5"
        aria-label={t("auth.signIn")}
        title={t("auth.signIn")}
        onClick={exitDemo}
      >
        <LogIn className="size-4" aria-hidden="true" />
        <span className="hidden text-xs sm:inline">{t("auth.signIn")}</span>
      </Button>
    </div>
  );
}

export function AppHeader() {
  const { t } = useI18n();
  const setView = useAppStore((state) => state.setView);
  const setCaptureOpen = useAppStore((state) => state.setCaptureOpen);
  // UX-B3 (T-3) — the header search trigger opens the ONE command palette;
  // no second search model.
  const setPaletteOpen = useAppStore((state) => state.setPaletteOpen);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur sm:px-4">
      <div className="flex min-w-0 shrink items-center gap-2.5">
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

      {/* UX-B3 — desktop search trigger: a pill that reads like an input and
          advertises ⌘K. It opens the SAME palette the mobile icon opens. */}
      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        aria-label={t("palette.open")}
        className="mx-1 hidden h-9 min-w-0 flex-1 items-center gap-2 rounded-full border bg-muted/40 px-3 text-xs text-muted-foreground transition-colors hover:bg-muted sm:flex"
      >
        <Search className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-start">
          {t("palette.placeholder")}
        </span>
        <kbd
          className="hidden shrink-0 rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:inline"
          aria-hidden="true"
        >
          ⌘K
        </kbd>
      </button>

      <div className="ms-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("palette.open")}
          title={t("palette.open")}
          onClick={() => setPaletteOpen(true)}
        >
          <Search className="size-[18px]" aria-hidden="true" />
        </Button>
        <LanguageToggle />
        <ThemeToggle />
        <AccountChip />
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
