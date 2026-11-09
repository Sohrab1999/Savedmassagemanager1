"use client";

// Settings — ORCHESTRATOR (rewritten at step 45, owner rule: atomic cards).
// Each card lives in `views/settings/*`; this file only composes the grid
// and owns zero business logic. The F1/F2 capture-channels card joins the
// grid after the data card (capture-bridge setup belongs with data tools).

import { AccountCard } from "@/components/app/views/settings/account-card";
import { ProfileCard } from "@/components/app/views/settings/profile-card";
import { AppearanceCard } from "@/components/app/views/settings/appearance-card";
import { DataCard } from "@/components/app/views/settings/data-card";
import { CaptureChannelsCard } from "@/components/app/views/settings/capture-channels-card";
import { ResurfaceCard } from "@/components/app/views/settings/resurface-card";
import { AboutCard } from "@/components/app/views/settings/about-card";
import { useI18n } from "@/lib/i18n";

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
        <CaptureChannelsCard />
        <ResurfaceCard />
        <AboutCard />
      </div>
    </div>
  );
}
