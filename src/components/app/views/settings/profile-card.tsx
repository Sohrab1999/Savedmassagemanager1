"use client";

// Settings — Profile card (split out of settings-view.tsx at step 45):
// display name + username with the render-phase sync pattern. Byte-identical
// to the pre-split markup.

import { useState } from "react";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ErrorState } from "@/components/app/states";
import { useProfile, useUpdateProfile } from "@/hooks/queries";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export function ProfileCard() {
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
