"use client";

// Settings — Resurface card (split out of settings-view.tsx at step 45).
// N7 — resurfacing preferences: the persistent per-device off-switch
// (localStorage via resurface-store — v1 keeps the data schema untouched)
// plus the honest §9 KPI readout (click micro-events stay on the device).
// Byte-identical to the pre-split markup.

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMounted } from "@/hooks/use-mounted";
import { getResurfaceMetrics } from "@/lib/resurface-metrics";
import { useResurfaceStore } from "@/stores/resurface-store";
import { useI18n } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";

export function ResurfaceCard() {
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
