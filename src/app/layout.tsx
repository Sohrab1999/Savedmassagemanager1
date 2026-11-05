import type { Metadata, Viewport } from "next";
import "./globals.css";
import "vazirmatn/Vazirmatn-font-face.css";
import { Providers } from "@/components/app/providers";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Savedbox — سازمان‌دهندهٔ ذخیره‌شده‌ها",
  description:
    "کتابخانهٔ شخصی برای پیام‌ها، لینک‌ها، یادداشت‌ها و فایل‌های ذخیره‌شده از تلگرام — آمادهٔ اجرا به‌عنوان Telegram Mini App.",
  applicationName: "Savedbox",
  authors: [{ name: "Savedbox" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
        </Providers>
      </body>
    </html>
  );
}
