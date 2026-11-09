"use client";

// Settings — About card (split out of settings-view.tsx at step 45):
// environment badge, version, undo KPI, and the honest Telegram note.
// Byte-identical to the pre-split markup.

import { Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMounted } from "@/hooks/use-mounted";
import { useI18n } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";
import { getUndoMetrics } from "@/lib/undo-metrics";
import { detectTelegramEnv } from "@/lib/telegram/bridge";

/** Single version source for the settings/about card. */
export const APP_VERSION = "0.1.0";

export function AboutCard() {
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
