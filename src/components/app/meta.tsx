"use client";

// Shared visual metadata: note-type styling, curated category icons/colors.

import {
  Bookmark,
  Brain,
  Briefcase,
  Camera,
  Clapperboard,
  Code2,
  Dumbbell,
  File,
  FileText,
  Folder,
  Gift,
  GraduationCap,
  Heart,
  Home,
  Image as ImageIcon,
  Link2,
  MessageCircle,
  Music,
  Plane,
  ShoppingBag,
  Sparkles,
  Star,
  Stethoscope,
  Type as TypeIcon,
  Utensils,
  Video,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { NoteType } from "@/lib/domain/types";
import type { I18nKey } from "@/lib/i18n/dictionaries";

export interface TypeMeta {
  labelKey: I18nKey;
  icon: LucideIcon;
  color: string;
}

export const TYPE_META: Record<NoteType, TypeMeta> = {
  text: { labelKey: "type.text", icon: TypeIcon, color: "#0d9488" },
  link: { labelKey: "type.link", icon: Link2, color: "#d97706" },
  image: { labelKey: "type.image", icon: ImageIcon, color: "#d946ef" },
  video: { labelKey: "type.video", icon: Video, color: "#f43f5e" },
  file: { labelKey: "type.file", icon: File, color: "#ea580c" },
};

export const CATEGORY_ICONS: Array<{ name: string; icon: LucideIcon }> = [
  { name: "folder", icon: Folder },
  { name: "book-open", icon: GraduationCap },
  { name: "briefcase", icon: Briefcase },
  { name: "shopping-bag", icon: ShoppingBag },
  { name: "graduation-cap", icon: GraduationCap },
  { name: "clapperboard", icon: Clapperboard },
  { name: "heart", icon: Heart },
  { name: "wrench", icon: Wrench },
  { name: "utensils", icon: Utensils },
  { name: "plane", icon: Plane },
  { name: "dumbbell", icon: Dumbbell },
  { name: "music", icon: Music },
  { name: "camera", icon: Camera },
  { name: "code", icon: Code2 },
  { name: "brain", icon: Brain },
  { name: "stethoscope", icon: Stethoscope },
  { name: "home", icon: Home },
  { name: "gift", icon: Gift },
  { name: "star", icon: Star },
  { name: "message-circle", icon: MessageCircle },
  { name: "file-text", icon: FileText },
  { name: "link", icon: Link2 },
  { name: "bookmark", icon: Bookmark },
  { name: "sparkles", icon: Sparkles },
];

export const CATEGORY_COLORS = [
  "#0d9488",
  "#10b981",
  "#84cc16",
  "#f59e0b",
  "#f97316",
  "#f43f5e",
  "#d946ef",
  "#a855f7",
  "#14b8a6",
  "#65a30d",
  "#ea580c",
  "#e11d48",
];

export function iconByName(name: string): LucideIcon {
  return CATEGORY_ICONS.find((entry) => entry.name === name)?.icon ?? Folder;
}

export function localizedCategoryName(
  category: { name: string; nameFa: string | null },
  locale: "fa" | "en",
): string {
  if (locale === "fa" && category.nameFa) return category.nameFa;
  return category.name;
}
