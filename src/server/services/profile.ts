// Profile service: single demo user; Telegram auth adapter will replace
// identity resolution later without touching callers.

import { db } from "@/lib/db";
import type { ProfileDTO } from "@/lib/domain/types";

export async function ensureProfileId(): Promise<string> {
  const existing = await db.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) return existing.id;
  const created = await db.user.create({
    data: { displayName: "سهراب", username: "sohrab", locale: "fa" },
  });
  return created.id;
}

export async function getProfile(): Promise<ProfileDTO> {
  const id = await ensureProfileId();
  const user = await db.user.findUniqueOrThrow({ where: { id } });
  return {
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    locale: user.locale,
    theme: user.theme,
  };
}

export async function updateProfile(
  input: Partial<{ displayName: string; username: string | null; locale: string; theme: string | null }>,
): Promise<ProfileDTO> {
  const id = await ensureProfileId();
  const user = await db.user.update({
    where: { id },
    data: {
      displayName: input.displayName,
      username: input.username,
      locale: input.locale,
      theme: input.theme,
    },
  });
  return {
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    locale: user.locale,
    theme: user.theme,
  };
}
