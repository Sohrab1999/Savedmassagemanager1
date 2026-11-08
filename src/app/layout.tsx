import type { Metadata, Viewport } from "next";
import "./globals.css";
import "vazirmatn/Vazirmatn-font-face.css";
import { Providers } from "@/components/app/providers";
import { ServiceWorkerRegister } from "@/components/app/service-worker-register";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Savedbox — سازمان‌دهندهٔ ذخیره‌شده‌ها",
  description:
    "کتابخانهٔ شخصی برای پیام‌ها، لینک‌ها، یادداشت‌ها و فایل‌های ذخیره‌شده از تلگرام — آمادهٔ اجرا به‌عنوان Telegram Mini App.",
  applicationName: "Savedbox",
  authors: [{ name: "Savedbox" }],
  // N8 — installable PWA (manifest route: /manifest.webmanifest).
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0d9488",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          {children}
          <Toaster position="bottom-center" duration={2600} />
          {/* N8 — PWA service worker (minimal, network-first; see public/sw.js) */}
          <ServiceWorkerRegister />
        </Providers>
      </body>
    </html>
  );
}
