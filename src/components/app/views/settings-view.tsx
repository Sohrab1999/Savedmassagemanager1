"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Download,
  Info,
  LogOut,
  Monitor,
  Moon,
  RotateCcw,
  ShieldCheck,
  Sun,
  Upload,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ErrorState } from "@/components/app/states";
import { useMounted } from "@/hooks/use-mounted";
import { getResurfaceMetrics } from "@/lib/resurface-metrics";
import { useResurfaceStore } from "@/stores/resurface-store";
import {
  useImportData,
  useProfile,
  useResetSeed,
  useUpdateProfile,
} from "@/hooks/queries";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";
import { getUndoMetrics } from "@/lib/undo-metrics";
import {
  importNoteSchema,
  importNoteTagNames,
  importPayloadSchema,
} from "@/lib/domain/import-schema";
import { ApiError } from "@/lib/api/client";
import { apiRoutes } from "@/lib/api";
import { dataSource } from "@/services/data-source";
import { getFirebaseStatus } from "@/services/firebase";
import { detectTelegramEnv } from "@/lib/telegram/bridge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const APP_VERSION = "0.1.0";

/** N2 — client-side file cap (mirrors the P3 upload pattern): causal error
 * before any parse attempt. The server keeps its own 20 MB body cap. */
const MAX_IMPORT_FILE_BYTES = 15 * 1024 * 1024;

interface ImportPreview {
  payload: Record<string, unknown>;
  notes: number;
  categories: number;
  tags: number;
  fileName: string;
}

function ImportSection() {
  const { t, locale } = useI18n();
  const importMutation = useImportData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);

  const reset = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const importErrorText = (code: string): string => {
    switch (code) {
      case "import.too-large":
        return t("settings.import.fileTooLarge");
      case "import.invalid-json":
        return t("settings.import.invalidJson");
      case "import.not-a-savedbox-export":
        return t("settings.import.notSavedbox");
      case "import.invalid-schema":
        return t("settings.import.invalidSchema");
      default:
        return t("settings.import.failed");
    }
  };

  // Step 1 of the two-step guardrail: validate locally, then show the
  // preview. Nothing is sent to the backend before an explicit confirm.
  const onFileChange = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_IMPORT_FILE_BYTES) {
      toast.error(t("settings.import.fileTooLarge"));
      reset();
      return;
    }
    let payload: unknown;
    try {
      payload = JSON.parse(await file.text());
    } catch {
      toast.error(t("settings.import.invalidJson"));
      reset();
      return;
    }
    const parsed = importPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message;
      toast.error(
        message === "not-a-savedbox-export"
          ? t("settings.import.notSavedbox")
          : t("settings.import.invalidSchema"),
      );
      reset();
      return;
    }
    const data = parsed.data;
    // Detected tag names = payload tag list ∪ every note's tag names.
    const tagNames = new Set<string>();
    for (const raw of data.tags ?? []) {
      const name = (raw as { name?: unknown })?.name;
      if (typeof name === "string" && name.trim()) tagNames.add(name.trim());
    }
    for (const raw of data.notes) {
      const parsedNote = importNoteSchema.safeParse(raw);
      if (!parsedNote.success) continue;
      for (const name of importNoteTagNames(parsedNote.data.tags)) {
        tagNames.add(name);
      }
    }
    setPreview({
      payload: payload as Record<string, unknown>,
      notes: data.notes.length,
      categories: data.categories?.length ?? 0,
      tags: tagNames.size,
      fileName: file.name,
    });
  };

  // Step 2: the explicit merge confirm.
  const confirmImport = async () => {
    if (!preview) return;
    try {
      const report = await importMutation.mutateAsync(preview.payload);
      toast.success(
        t("settings.import.done", {
          added: formatNumber(report.notesAdded, locale),
          skipped: formatNumber(report.notesSkippedDuplicates, locale),
          invalid: formatNumber(report.notesSkippedInvalid, locale),
          categories: formatNumber(report.categoriesAdded, locale),
          tags: formatNumber(report.tagsAdded, locale),
        }),
      );
      reset();
    } catch (error) {
      const code = error instanceof ApiError ? error.message : "";
      toast.error(importErrorText(code));
    }
  };

  return (
    <div className="rounded-lg border p-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="sr-only"
        aria-label={t("settings.import.choose")}
        onChange={(event) => void onFileChange(event.target.files?.[0])}
      />
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Upload className="size-4 shrink-0 text-primary" aria-hidden="true" />
            {t("settings.import")}
          </p>
          <p className="text-xs text-muted-foreground">{t("settings.import.desc")}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          disabled={importMutation.isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          {t("settings.import.choose")}
        </Button>
      </div>

      {preview ? (
        <div className="mt-3 space-y-2.5 rounded-lg border bg-muted/40 p-3" role="region" aria-live="polite">
          <p className="flex items-start gap-1.5 text-xs font-medium" dir="auto">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" aria-hidden="true" />
            <span className="break-all">{preview.fileName}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {t("settings.import.preview", {
              notes: formatNumber(preview.notes, locale),
              categories: formatNumber(preview.categories, locale),
              tags: formatNumber(preview.tags, locale),
            })}
          </p>
          <p className="text-xs text-muted-foreground">{t("settings.import.mergeHint")}</p>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={reset} disabled={importMutation.isPending}>
              {t("common.cancel")}
            </Button>
            <Button
              size="sm"
              onClick={() => void confirmImport()}
              disabled={importMutation.isPending}
            >
              {importMutation.isPending
                ? t("settings.import.importing")
                : t("settings.import.confirm")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AccountCard() {
  const { t } = useI18n();
  const { user, signOutUser, exitDemo, configured, emulator } = useAuth();
  const status = getFirebaseStatus();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
          {t("auth.account")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {user ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{t("auth.email")}</span>
              <span className="truncate font-medium" dir="ltr">
                {user.email}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{t("auth.account.status")}</span>
              <Badge className="rounded-full" variant="default">
                {t("auth.account.status.cloud")}
              </Badge>
            </div>
            {configured ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">{t("auth.account.project")}</span>
                <span className="truncate font-medium" dir="ltr">
                  {status.projectId}
                  {emulator ? ` · ${t("auth.demoBadge")}` : ""}
                </span>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{t("auth.signOut")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("auth.account.signOutDesc")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={() => {
                  void signOutUser();
                }}
              >
                <LogOut className="size-4" aria-hidden="true" />
                {t("auth.signOut")}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{t("auth.account.status")}</span>
              <Badge variant="secondary" className="rounded-full">
                {t("auth.account.status.demo")}
              </Badge>
            </div>
            <p className="leading-6 text-muted-foreground">
              {t("auth.account.demoDesc")}
            </p>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={exitDemo}>
              <ShieldCheck className="size-4" aria-hidden="true" />
              {t("auth.signIn")}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ProfileCard() {
  const { t } = useI18n();
  const profileQuery = useProfile();
  const updateProfile = useUpdateProfile();

  // Initialize from cached data when available, then keep in sync whenever
  // the server profile changes (render-phase state adjustment).
  const [displayName, setDisplayName] = useState(
    () => profileQuery.data?.displayName ?? "",
  );
  const [username, setUsername] = useState(
    () => profileQuery.data?.username ?? "",
  );
  const [lastProfile, setLastProfile] = useState(profileQuery.data);
  if (profileQuery.data !== lastProfile) {
    setLastProfile(profileQuery.data);
    if (profileQuery.data) {
      setDisplayName(profileQuery.data.displayName);
      setUsername(profileQuery.data.username ?? "");
    }
  }

  if (profileQuery.isError) {
    return <ErrorState onRetry={() => profileQuery.refetch()} />;
  }

  const save = async () => {
    try {
      await updateProfile.mutateAsync({
        displayName: displayName.trim() || undefined,
        username: username.trim() || null,
      });
      toast.success(t("settings.profileSaved"));
    } catch {
      toast.error(t("toast.error"));
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <User className="size-4 text-primary" aria-hidden="true" />
          {t("settings.profile")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-12 border">
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {displayName.trim().charAt(0) || "؟"}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">{t("settings.displayName")}</Label>
              <Input
                id="profile-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-username">{t("settings.username")}</Label>
              <Input
                id="profile-username"
                dir="ltr"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="@username"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={save}
            disabled={updateProfile.isPending || !displayName.trim()}
          >
            {t("common.save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AppearanceCard() {
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  const themeOptions = [
    { value: "light", labelKey: "settings.theme.light", icon: Sun },
    { value: "dark", labelKey: "settings.theme.dark", icon: Moon },
    { value: "system", labelKey: "settings.theme.system", icon: Monitor },
  ] as const;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{t("settings.appearance")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2.5">
          <Label>{t("settings.theme")}</Label>
          <RadioGroup
            value={mounted ? (theme ?? "system") : "system"}
            onValueChange={setTheme}
            className="grid grid-cols-3 gap-2"
          >
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const active = mounted && (theme ?? "system") === option.value;
              return (
                <Label
                  key={option.value}
                  className={cn(
                    "flex min-h-11 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border p-2 text-[11px] font-normal transition-colors",
                    active && "border-primary bg-primary/10 text-primary",
                  )}
                >
                  <RadioGroupItem value={option.value} className="sr-only" />
                  <Icon className="size-4" aria-hidden="true" />
                  {t(option.labelKey)}
                </Label>
              );
            })}
          </RadioGroup>
        </div>

        <div className="space-y-2.5">
          <Label>{t("settings.language")}</Label>
          <RadioGroup
            value={locale}
            onValueChange={(value) => setLocale(value as "fa" | "en")}
            className="grid grid-cols-2 gap-2"
          >
            <Label
              className={cn(
                "flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded-lg border text-sm font-normal transition-colors",
                locale === "fa" && "border-primary bg-primary/10 text-primary",
              )}
            >
              <RadioGroupItem value="fa" className="sr-only" />
              فارسی
            </Label>
            <Label
              className={cn(
                "flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded-lg border text-sm font-normal transition-colors",
                locale === "en" && "border-primary bg-primary/10 text-primary",
              )}
            >
              <RadioGroupItem value="en" className="sr-only" />
              English
            </Label>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}

function DataCard() {
  const { t } = useI18n();
  const resetSeed = useResetSeed();
  const { user } = useAuth();
  const isCloud = Boolean(user);

  const downloadJson = (payload: unknown) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `savedbox-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const exportData = async () => {
    try {
      if (isCloud) {
        // Cloud mode: export straight from the user's Firestore data.
        const [notes, categories, tags, profile] = await Promise.all([
          dataSource.listNotes({ archived: false }),
          dataSource.listCategories(),
          dataSource.listTags(),
          dataSource.getProfile(),
        ]);
        downloadJson({
          exportedAt: new Date().toISOString(),
          source: "firestore",
          profile,
          notes: notes.items,
          categories: categories.items,
          tags: tags.items,
        });
        return;
      }
      await apiRoutes.exportData();
    } catch {
      toast.error(t("toast.error"));
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{t("settings.data")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">{t("settings.export")}</p>
            <p className="text-xs text-muted-foreground">{t("settings.export.desc")}</p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={exportData}>
            <Download className="size-4" aria-hidden="true" />
            {t("common.save")}
          </Button>
        </div>

        {/* N2 — JSON import (merge-only, two-step guardrail) */}
        <ImportSection />

        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 p-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">{t("settings.reset")}</p>
            <p className="text-xs text-muted-foreground">
              {isCloud ? t("settings.reset.demoOnly") : t("settings.reset.desc")}
            </p>
          </div>
          {isCloud ? (
            <Button variant="outline" size="sm" className="shrink-0 gap-1.5" disabled>
              <RotateCcw className="size-4" aria-hidden="true" />
              {t("settings.reset")}
            </Button>
          ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                {t("settings.reset")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("settings.reset.confirmTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("settings.reset.confirm.desc")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={async () => {
                    try {
                      await resetSeed.mutateAsync();
                      toast.success(t("settings.reset.done"));
                    } catch {
                      toast.error(t("toast.error"));
                    }
                  }}
                >
                  {t("common.confirm")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// N7 — resurfacing preferences: the persistent per-device off-switch
// (localStorage via resurface-store — v1 keeps the data schema untouched)
// plus the honest §9 KPI readout (click micro-events stay on the device).
function ResurfaceCard() {
  const { t, locale } = useI18n();
  const mounted = useMounted();
  const enabled = useResurfaceStore((state) => state.enabled);
  const hydrated = useResurfaceStore((state) => state.hydrated);
  const hydrate = useResurfaceStore((state) => state.hydrate);
  const setEnabled = useResurfaceStore((state) => state.setEnabled);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const metrics = mounted ? getResurfaceMetrics() : null;
  const percent =
    metrics && metrics.impressions > 0
      ? Math.round((metrics.clicks / metrics.impressions) * 100)
      : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{t("settings.resurface.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <Label htmlFor="resurface-toggle" className="text-sm font-medium">
              {t("settings.resurface.enable")}
            </Label>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              {t("settings.resurface.desc")}
            </p>
          </div>
          <Switch
            id="resurface-toggle"
            checked={hydrated && enabled}
            disabled={!hydrated}
            onCheckedChange={setEnabled}
            aria-label={t("settings.resurface.enable")}
          />
        </div>
        <div className="flex items-center justify-between gap-2 border-t pt-3">
          <span className="text-muted-foreground">{t("settings.resurface.rate")}</span>
          <span className="font-medium">
            {metrics === null || metrics.impressions === 0
              ? t("settings.resurface.rate.none")
              : t("settings.resurface.rate.value", {
                  clicks: formatNumber(metrics.clicks, locale),
                  impressions: formatNumber(metrics.impressions, locale),
                  percent: formatNumber(percent ?? 0, locale),
                })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function AboutCard() {
  const { t, locale } = useI18n();
  const mounted = useMounted();

  const isTelegram = mounted && detectTelegramEnv() !== null;
  // S5 — Phase-3 KPI: the undo rate is recorded and reported (per-device,
  // localStorage-backed — see src/lib/undo-metrics.ts).
  const undoMetrics = mounted ? getUndoMetrics() : null;
  const undoPercent =
    undoMetrics && undoMetrics.deletions > 0
      ? Math.round((undoMetrics.undos / undoMetrics.deletions) * 100)
      : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{t("settings.about")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">{t("settings.environment")}</span>
          <Badge variant={isTelegram ? "default" : "secondary"} className="rounded-full">
            {isTelegram ? t("settings.env.telegram") : t("settings.env.browser")}
          </Badge>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">{t("settings.version")}</span>
          <span className="font-medium" dir="ltr">
            v{APP_VERSION}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">{t("settings.undoRate")}</span>
          <span className="font-medium">
            {undoMetrics === null || undoMetrics.deletions === 0
              ? t("settings.undoRate.none")
              : t("settings.undoRate.value", {
                  undone: formatNumber(undoMetrics.undos, locale),
                  total: formatNumber(undoMetrics.deletions, locale),
                  percent: formatNumber(undoPercent ?? 0, locale),
                })}
          </span>
        </div>
        <p className="leading-6 text-muted-foreground">{t("settings.about.desc")}</p>
        <p className="flex gap-2 rounded-lg bg-muted p-3 text-xs leading-5 text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t("settings.integrationNote")}
        </p>
      </CardContent>
    </Card>
  );
}

export function SettingsView() {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold sm:text-xl">{t("settings.title")}</h1>
      <div className="grid gap-4 xl:grid-cols-2">
        <AccountCard />
        <ProfileCard />
        <AppearanceCard />
        <DataCard />
        <ResurfaceCard />
        <AboutCard />
      </div>
    </div>
  );
}
