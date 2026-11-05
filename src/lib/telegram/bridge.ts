// Telegram integration seam.
//
// This module ONLY *detects* whether the app is running inside a Telegram
// Mini App environment. It does not call the Bot API, does not read Saved
// Messages (Telegram does not allow that for Mini Apps), and performs no
// authentication. A future auth adapter can consume `detectTelegramEnv()`
// to complete login via `initData` validation on the backend, without any
// rewrite of the UI or data layer.

export interface TelegramEnvironmentUser {
  id?: number;
  firstName?: string;
  username?: string;
}

export interface TelegramEnvironment {
  available: boolean;
  colorScheme?: "light" | "dark";
  user?: TelegramEnvironmentUser;
}

interface TelegramWebAppLike {
  colorScheme?: "light" | "dark";
  initDataUnsafe?: {
    user?: {
      id?: number;
      first_name?: string;
      username?: string;
    };
  };
}

export function detectTelegramEnv(): TelegramEnvironment | null {
  if (typeof window === "undefined") return null;
  const tg = (
    window as unknown as { Telegram?: { WebApp?: TelegramWebAppLike } }
  ).Telegram?.WebApp;
  if (!tg || typeof tg !== "object") return null;
  const user = tg.initDataUnsafe?.user;
  return {
    available: true,
    colorScheme: tg.colorScheme,
    user: user
      ? {
          id: user.id,
          firstName: user.first_name,
          username: user.username,
        }
      : undefined,
  };
}

export function getEnvironmentLabel(): "telegram" | "browser" {
  return detectTelegramEnv() ? "telegram" : "browser";
}
