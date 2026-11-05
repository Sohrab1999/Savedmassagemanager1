// Realistic bilingual sample content for the demo library.
// `minutesAgo` spreads items over the last ~7 weeks so relative dates,
// the "this week" counter and archives all look natural.

export interface SeedCategory {
  slug: string;
  name: string;
  nameFa: string;
  icon: string;
  color: string;
  order: number;
}

export interface SeedNote {
  type: "text" | "link" | "image" | "video" | "file";
  title: string;
  content?: string;
  description?: string;
  url?: string;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  mediaDuration?: number;
  sourceChat?: string;
  sourceType?: "manual" | "telegram";
  categorySlug?: string;
  tagNames: string[];
  isFavorite?: boolean;
  isArchived?: boolean;
  minutesAgo: number;
}

export const seedCategories: SeedCategory[] = [
  { slug: "articles", name: "Articles", nameFa: "مقالات", icon: "book-open", color: "#10b981", order: 1 },
  { slug: "tools", name: "Tools", nameFa: "ابزارها", icon: "wrench", color: "#f59e0b", order: 2 },
  { slug: "learning", name: "Learning", nameFa: "آموزش", icon: "graduation-cap", color: "#14b8a6", order: 3 },
  { slug: "shopping", name: "Shopping", nameFa: "خرید", icon: "shopping-bag", color: "#f43f5e", order: 4 },
  { slug: "entertainment", name: "Entertainment", nameFa: "سرگرمی", icon: "clapperboard", color: "#d946ef", order: 5 },
  { slug: "work", name: "Work", nameFa: "کاری", icon: "briefcase", color: "#f97316", order: 6 },
  { slug: "media", name: "Media", nameFa: "رسانه", icon: "image", color: "#a855f7", order: 7 },
  { slug: "personal", name: "Personal", nameFa: "شخصی", icon: "heart", color: "#0d9488", order: 8 },
];

export const seedTags: string[] = [
  "جاوااسکریپت",
  "هوش مصنوعی",
  "طراحی رابط",
  "کتاب",
  "دستور پخت",
  "خرید",
  "انگیزشی",
  "کاری",
  "آموزش انگلیسی",
  "سلامت",
  "سفر",
  "معماری",
  "بورس",
  "موسیقی",
  "nextjs",
  "بهینه‌سازی",
];

export const seedNotes: SeedNote[] = [
  {
    type: "link",
    title: "راهنمای کامل Server Components در Next.js",
    url: "https://nextjs.org/docs/app/building-your-application/rendering/server-components",
    content:
      "این بخش از مستندات رسمی، تفاوت سرور و کلاینت کامپوننت‌ها را خیلی شفاف توضیح می‌دهد. برای معماری پروژهٔ جدید حتماً یک بار کامل بخوان.",
    description: "نکتهٔ کلیدی: واکشی داده داخل سرور کامپوننت انجام می‌شود، نه در useEffect.",
    categorySlug: "learning",
    tagNames: ["nextjs", "بهینه‌سازی"],
    isFavorite: true,
    sourceChat: "کانال فرانت‌اند ایران",
    sourceType: "telegram",
    minutesAgo: 90,
  },
  {
    type: "text",
    title: "دستور قورمه‌سبزی خانوادگی",
    content:
      "مواد: گوشت ۴۰۰ گرم، لوبیا سبز ۲۰۰ گرم، سبزی قورمه‌سبزی ۵۰۰ گرم، لیمو عمانی ۲ عدد، برنج برای سرو.\nمراحل: سبزی را تفت بده تا بوی خامی گرفته شود، گوشت را با پیاز داغ اضافه کن، حدود سه ساعت با حرارت کم بپزد.",
    description: "نسخهٔ مادربزرگ — لیمو عمانی را نیم‌ساعت آخر اضافه کن.",
    categorySlug: "personal",
    tagNames: ["دستور پخت"],
    sourceChat: "پیام‌های ذخیره‌شده",
    minutesAgo: 260,
  },
  {
    type: "image",
    title: "ایدهٔ نما برای بازسازی ویلا",
    mediaUrl: "/samples/architecture.jpg",
    content:
      "نمای مدرن با آجر تراکوتا و خطوط افقی — ذخیره‌شده از کانال معماری.",
    description: "برای جلسهٔ مشاور با مهندس احمدی نشان بده.",
    categorySlug: "media",
    tagNames: ["معماری"],
    isFavorite: true,
    sourceChat: "کانال معماری معاصر",
    sourceType: "telegram",
    minutesAgo: 1500,
  },
  {
    type: "link",
    title: "shadcn/ui — مخزن کامپوننت‌ها",
    url: "https://github.com/shadcn-ui/ui",
    content:
      "مجموعهٔ کامپوننت‌های ری‌اکت که مستقیم داخل پروژه کپی می‌شوند؛ بدون وابستگی سنگین و با تم‌پذیری کامل.",
    categorySlug: "tools",
    tagNames: ["nextjs"],
    sourceChat: "کانال فرانت‌اند ایران",
    sourceType: "telegram",
    minutesAgo: 2900,
  },
  {
    type: "video",
    title: "آموزش پخت استیک در خانه",
    mediaUrl: "/samples/cooking.jpg",
    url: "https://www.youtube.com/results?search_query=pan+seared+steak+technique",
    content: "تکنیک کره‌دادن در آخر و پرهیز از پخت کامل وسط استیک.",
    categorySlug: "entertainment",
    tagNames: ["دستور پخت"],
    isFavorite: true,
    mediaDuration: 734,
    sourceChat: "پیام‌های ذخیره‌شده",
    minutesAgo: 4200,
  },
  {
    type: "file",
    title: "قرارداد طراحی رابط کاربری",
    fileName: "UI-Design-Contract.pdf",
    fileSize: 2_450_112,
    content: "نسخهٔ نهایی قرارداد پروژهٔ فروشگاه — فقط بخش ۳ (تحویل‌ها) مانده ویرایش.",
    description: "امضا شده؛ یک نسخه هم برای حسابدار بفرست.",
    categorySlug: "work",
    tagNames: ["کاری"],
    isFavorite: true,
    sourceChat: "گروه کاری فنی",
    sourceType: "telegram",
    minutesAgo: 5800,
  },
  {
    type: "text",
    title: "جملات انگیزشی مورد علاقه",
    content:
      "«کسی که مقصدش را نمی‌داند، هیچ باد موافقی هم ندارد.»\n«انضباط، پلی است بین اهداف و دستاوردها.»",
    categorySlug: "personal",
    tagNames: ["انگیزشی"],
    sourceChat: "پیام‌های ذخیره‌شده",
    minutesAgo: 7000,
  },
  {
    type: "link",
    title: "الگوی Repository در اپلیکیشن‌های سازمانی",
    url: "https://martinfowler.com/eaaCatalog/repository.html",
    content: "مرجع کلاسیک فاولر برای جداسازی منطق دامنه از لایهٔ داده.",
    categorySlug: "articles",
    tagNames: ["بهینه‌سازی"],
    sourceChat: "کانال مهندسی نرم‌افزار",
    sourceType: "telegram",
    minutesAgo: 8300,
  },
  {
    type: "image",
    title: "کفش دویدن — مدل نیوبالانس",
    mediaUrl: "/samples/sneakers.jpg",
    content: "سایز ۴۳، رنگ مشکی-نعنایی. قیمت اعلامی: ۴٫۲ میلیون تومان.",
    description: "قیمت را در دو فروشگاه دیگر هم چک کن قبل از خرید.",
    categorySlug: "shopping",
    tagNames: ["خرید"],
    sourceChat: "کانال تخفیف‌ها",
    sourceType: "telegram",
    minutesAgo: 9600,
  },
  {
    type: "text",
    title: "صورتجلسهٔ جلسهٔ شنبه",
    content:
      "حاضرین: سهراب، نگار، امیر.\nتصمیم‌ها: MVP فقط شامل ثبت سریع و جستجو است. فاز ۲ بعد از تست کاربران شروع می‌شود.",
    description: "یادم باشد امیر نمودار معماری را می‌فرستد.",
    categorySlug: "work",
    tagNames: ["کاری"],
    sourceChat: "پیام‌های ذخیره‌شده",
    minutesAgo: 11000,
  },
  {
    type: "link",
    title: "چطور عادت کتاب‌خواندن را بسازیم — TED",
    url: "https://www.ted.com/topics/books",
    content: "ارائهٔ کوتاه دربارهٔ زنجیرهٔ عادت و شروع با روزی ۱۰ دقیقه مطالعه.",
    categorySlug: "learning",
    tagNames: ["کتاب"],
    sourceChat: "کانال کتاب‌خوان‌ها",
    sourceType: "telegram",
    minutesAgo: 13000,
  },
  {
    type: "image",
    title: "تختهٔ ایده‌های محصول",
    mediaUrl: "/samples/whiteboard.jpg",
    content: "عکس تختهٔ طوفان فکری بعد از جلسهٔ محصول.",
    categorySlug: "work",
    tagNames: ["کاری", "طراحی رابط"],
    sourceChat: "پیام‌های ذخیره‌شده",
    minutesAgo: 15000,
  },
  {
    type: "text",
    title: "نکتهٔ گرامری: ساختار used to",
    content:
      "used to + فعل ساده: برای عادت‌های گذشته.\nمثال: I used to read before bed.\nمنفی: didn't use to.",
    categorySlug: "learning",
    tagNames: ["آموزش انگلیسی"],
    sourceChat: "گروه آموزش زبان",
    sourceType: "telegram",
    minutesAgo: 17000,
  },
  {
    type: "file",
    title: "بستهٔ قالب رزومه",
    fileName: "resume-templates.zip",
    fileSize: 15_200_000,
    content: "شامل ۹ قالب ورد و فایل فونت‌های فارسی.",
    categorySlug: "tools",
    tagNames: ["کاری"],
    sourceChat: "کانال هم‌راهی کاریابی",
    sourceType: "telegram",
    minutesAgo: 20000,
  },
  {
    type: "link",
    title: "تاریخچهٔ کاشی‌کاری ایرانی — ویکی‌پدیا",
    url: "https://fa.wikipedia.org/wiki/کاشی‌کاری",
    content: "از هفت‌سنگ تا معرق؛ برای سفر بعدی به اصفهان خواندنی است.",
    categorySlug: "articles",
    tagNames: ["معماری", "سفر"],
    sourceChat: "پیام‌های ذخیره‌شده",
    minutesAgo: 23000,
  },
  {
    type: "text",
    title: "برنامهٔ ۳۰ روزهٔ دویدن",
    content:
      "هفتهٔ ۱: روزی ۲۰ دقیقه پیاده‌روی تند.\nهفتهٔ ۲: ۱ دقیقه دویدن + ۲ دقیقه پیاده‌روی، پنج بار.\nهفتهٔ ۳: دویدن پیوستهٔ ۱۵ دقیقه.",
    description: "چاپ کن و روی یخچال بچسبان.",
    categorySlug: "personal",
    tagNames: ["سلامت"],
    minutesAgo: 26000,
  },
  {
    type: "text",
    title: "نکتهٔ بورس: نقطهٔ ورود فولاد",
    content:
      "سطح حمایتی ماهانه ۱۲۰۰ تومان؛ ورود پله‌ای در سه مرحله. حد ضرر: زیر ۱۱۵۰.",
    categorySlug: "personal",
    tagNames: ["بورس"],
    minutesAgo: 29000,
  },
  {
    type: "link",
    title: "کیت رابط کاربری داشبورد — Figma",
    url: "https://www.figma.com/community/file/1404/dashboard-ui-kit",
    content: "کامپوننت‌های آمادهٔ داشبورد با تم تاریک؛ برای طرح‌های سریع عالی است.",
    categorySlug: "tools",
    tagNames: ["طراحی رابط"],
    isFavorite: true,
    sourceChat: "کانال UI Daily",
    sourceType: "telegram",
    minutesAgo: 32000,
  },
  {
    type: "text",
    title: "لیست خرید هفته",
    content: "برنج، روغن مایع، پنیر لیقوان، گردو، عسل، لیمو ترش، فیله مرغ.",
    categorySlug: "shopping",
    tagNames: ["خرید"],
    minutesAgo: 600,
  },
  {
    type: "image",
    title: "قورمه‌سبزی دیروز — نسخهٔ رستورانی",
    mediaUrl: "/samples/cooking.jpg",
    content: "عکس غذایی که در مهمانی گرفتم؛ رنگ و غلظتش عالی بود.",
    categorySlug: "personal",
    tagNames: ["دستور پخت"],
    sourceChat: "گروه خانوادگی",
    sourceType: "telegram",
    minutesAgo: 100,
  },
  {
    type: "text",
    title: "یادداشت قدیمی: پلن پروژهٔ سال قبل",
    content:
      "پلن کوارتر چهارم سال گذشته — دیگر معتبر نیست، فقط برای مرور درس‌آموخته‌ها نگه داشته شده.",
    categorySlug: "work",
    tagNames: ["کاری"],
    isArchived: true,
    sourceChat: "پیام‌های ذخیره‌شده",
    minutesAgo: 60000,
  },
  {
    type: "link",
    title: "مقاله: آیندهٔ هوش مصنوعی در ابزارهای توسعه",
    url: "https://vercel.com/blog/ai-sdk-3",
    content: "خلاصهٔ بلاگ ورسل دربارهٔ AI SDK؛ برای جلسهٔ بعدی تیم.",
    categorySlug: "articles",
    tagNames: ["هوش مصنوعی"],
    isArchived: true,
    sourceChat: "کانال مهندسی نرم‌افزار",
    sourceType: "telegram",
    minutesAgo: 70000,
  },
  {
    type: "text",
    title: "پلی‌لیست تمرین صبحگاهی",
    content: "فهرست آهنگ‌های ۲۰ دقیقه‌ای برای گرم‌کردن — هر ماه به‌روزرسانی می‌شود.",
    categorySlug: "personal",
    tagNames: ["موسیقی", "سلامت"],
    minutesAgo: 300,
  },
];
