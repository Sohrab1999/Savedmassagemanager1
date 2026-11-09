"use client";

// Settings — Account card (split out of settings-view.tsx at step 45):
// cloud/demo status, sign-out, demo exit. Byte-identical to the pre-split
// markup.

import { LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { getFirebaseStatus } from "@/services/firebase";

export function AccountCard() {
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
