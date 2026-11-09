"use client";

// Settings — Appearance card (split out of settings-view.tsx at step 45):
// theme radio (next-themes) + language radio (fa/en). Byte-identical to the
// pre-split markup.

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMounted } from "@/hooks/use-mounted";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function AppearanceCard() {
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
