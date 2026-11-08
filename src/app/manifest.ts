import type { MetadataRoute } from "next";

// N8 — PWA web app manifest. `display: standalone` + icons + start_url make
// the install prompt available on Android/desktop; iOS reads apple-touch-icon
// from the layout metadata instead (its limitations are documented in
// SNAPSHOT §12 — honesty rule from the owner-ordered card).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Savedbox — سازمان‌دهندهٔ ذخیره‌شده‌ها",
    short_name: "Savedbox",
    description:
      "کتابخانهٔ شخصی برای پیام‌ها، لینک‌ها، یادداشت‌ها و فایل‌های ذخیره‌شده.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#ffffff",
    theme_color: "#0d9488",
    lang: "fa",
    dir: "rtl",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
