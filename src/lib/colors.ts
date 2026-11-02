"use client";

import React from "react";
import { 
  Heart, 
  Home, 
  Compass, 
  CreditCard, 
  Gift, 
  Calendar, 
  ShoppingBag, 
  Briefcase, 
  Star, 
  BookOpen,
  Folder,
  Users
} from "lucide-react";

export function getSpaceIcon(iconName?: string, className: string = "w-3.5 h-3.5"): React.ReactNode {
  switch (iconName) {
    case "folder":
      return React.createElement(Folder, { className });
    case "users":
      return React.createElement(Users, { className });
    case "heart":
      return React.createElement(Heart, { className });
    case "home":
      return React.createElement(Home, { className });
    case "plane":
      return React.createElement(Compass, { className });
    case "sparkles":
      return React.createElement(CreditCard, { className });
    case "gift":
      return React.createElement(Gift, { className });
    case "calendar":
      return React.createElement(Calendar, { className });
    case "shopping":
      return React.createElement(ShoppingBag, { className });
    case "briefcase":
      return React.createElement(Briefcase, { className });
    case "star":
      return React.createElement(Star, { className });
    case "book":
      return React.createElement(BookOpen, { className });
    default:
      return React.createElement(Folder, { className });
  }
}

export const AVATAR_COLORS: Record<string, { bg: string; text: string; hex: string; name: string }> = {
  purple: { name: "Lilac Purple", bg: "bg-[#B78AF2]", text: "text-[#171923]", hex: "#B78AF2" },
  orange: { name: "Warm Coral", bg: "bg-[#FF705B]", text: "text-white", hex: "#FF705B" },
  sky: { name: "Soft Sky", bg: "bg-[#BFEAF7]", text: "text-[#171923]", hex: "#BFEAF7" },
  emerald: { name: "Mint Emerald", bg: "bg-[#A8DCCB]", text: "text-[#171923]", hex: "#A8DCCB" },
  rose: { name: "Blush Rose", bg: "bg-[#F472B6]", text: "text-white", hex: "#F472B6" },
  amber: { name: "Honey Gold", bg: "bg-[#FBBF24]", text: "text-[#171923]", hex: "#FBBF24" },
  indigo: { name: "Indigo Blue", bg: "bg-[#818CF8]", text: "text-white", hex: "#818CF8" },
  teal: { name: "Sea Teal", bg: "bg-[#2DD4BF]", text: "text-[#171923]", hex: "#2DD4BF" },
};

export interface UserHighlightConfig {
  name: string;
  primaryHex: string;
  lightHex: string;
  textHex: string;
  borderHex: string;
  bgLight: string;
  textDark: string;
  border: string;
  accentBg: string;
  accentText: string;
  ring: string;
  hoverBorder: string;
  focusBorder: string;
}

export const USER_HIGHLIGHTS: Record<string, UserHighlightConfig> = {
  purple: {
    name: "Lilac Purple",
    primaryHex: "#B78AF2",
    lightHex: "#F5EEFD",
    textHex: "#6B21A8",
    borderHex: "#E5D4F9",
    bgLight: "bg-[#F5EEFD]",
    textDark: "text-[#6B21A8]",
    border: "border-[#E5D4F9]",
    accentBg: "bg-[#B78AF2]",
    accentText: "text-[#171923]",
    ring: "ring-[#B78AF2]",
    hoverBorder: "hover:border-[#B78AF2]",
    focusBorder: "focus:border-[#B78AF2]",
  },
  orange: {
    name: "Warm Coral",
    primaryHex: "#FF705B",
    lightHex: "#FFF2EE",
    textHex: "#C2410C",
    borderHex: "#FEDACE",
    bgLight: "bg-[#FFF2EE]",
    textDark: "text-[#C2410C]",
    border: "border-[#FEDACE]",
    accentBg: "bg-[#FF705B]",
    accentText: "text-white",
    ring: "ring-[#FF705B]",
    hoverBorder: "hover:border-[#FF705B]",
    focusBorder: "focus:border-[#FF705B]",
  },
  sky: {
    name: "Soft Sky",
    primaryHex: "#BFEAF7",
    lightHex: "#F0F9FE",
    textHex: "#0369A1",
    borderHex: "#CEEEF9",
    bgLight: "bg-[#F0F9FE]",
    textDark: "text-[#0369A1]",
    border: "border-[#CEEEF9]",
    accentBg: "bg-[#BFEAF7]",
    accentText: "text-[#171923]",
    ring: "ring-[#BFEAF7]",
    hoverBorder: "hover:border-[#7DD3FC]",
    focusBorder: "focus:border-[#7DD3FC]",
  },
  emerald: {
    name: "Mint Emerald",
    primaryHex: "#A8DCCB",
    lightHex: "#EFF8F5",
    textHex: "#065F46",
    borderHex: "#CCEBE1",
    bgLight: "bg-[#EFF8F5]",
    textDark: "text-[#065F46]",
    border: "border-[#CCEBE1]",
    accentBg: "bg-[#A8DCCB]",
    accentText: "text-[#171923]",
    ring: "ring-[#A8DCCB]",
    hoverBorder: "hover:border-[#A8DCCB]",
    focusBorder: "focus:border-[#A8DCCB]",
  },
  rose: {
    name: "Blush Rose",
    primaryHex: "#F472B6",
    lightHex: "#FDF2F8",
    textHex: "#9D174D",
    borderHex: "#FBCFE8",
    bgLight: "bg-[#FDF2F8]",
    textDark: "text-[#9D174D]",
    border: "border-[#FBCFE8]",
    accentBg: "bg-[#F472B6]",
    accentText: "text-white",
    ring: "ring-[#F472B6]",
    hoverBorder: "hover:border-[#F472B6]",
    focusBorder: "focus:border-[#F472B6]",
  },
  amber: {
    name: "Honey Gold",
    primaryHex: "#FBBF24",
    lightHex: "#FEF3C7",
    textHex: "#B45309",
    borderHex: "#FDE68A",
    bgLight: "bg-[#FEF3C7]",
    textDark: "text-[#B45309]",
    border: "border-[#FDE68A]",
    accentBg: "bg-[#FBBF24]",
    accentText: "text-[#171923]",
    ring: "ring-[#FBBF24]",
    hoverBorder: "hover:border-[#FBBF24]",
    focusBorder: "focus:border-[#FBBF24]",
  },
  indigo: {
    name: "Indigo Blue",
    primaryHex: "#818CF8",
    lightHex: "#EEF2FF",
    textHex: "#4338CA",
    borderHex: "#C7D2FE",
    bgLight: "bg-[#EEF2FF]",
    textDark: "text-[#4338CA]",
    border: "border-[#C7D2FE]",
    accentBg: "bg-[#818CF8]",
    accentText: "text-white",
    ring: "ring-[#818CF8]",
    hoverBorder: "hover:border-[#818CF8]",
    focusBorder: "focus:border-[#818CF8]",
  },
  teal: {
    name: "Sea Teal",
    primaryHex: "#2DD4BF",
    lightHex: "#CCFBF1",
    textHex: "#0F766E",
    borderHex: "#99F6E4",
    bgLight: "bg-[#CCFBF1]",
    textDark: "text-[#0F766E]",
    border: "border-[#99F6E4]",
    accentBg: "bg-[#2DD4BF]",
    accentText: "text-[#171923]",
    ring: "ring-[#2DD4BF]",
    hoverBorder: "hover:border-[#2DD4BF]",
    focusBorder: "focus:border-[#2DD4BF]",
  },
};

export function getUserHighlightStyle(colorName?: string): UserHighlightConfig {
  if (!colorName || !USER_HIGHLIGHTS[colorName]) {
    return USER_HIGHLIGHTS.purple;
  }
  return USER_HIGHLIGHTS[colorName];
}

export function getUserAvatarStyle(colorName?: string) {
  if (!colorName || !AVATAR_COLORS[colorName]) {
    return { name: "Dark Ink", bg: "bg-[#171923]", text: "text-white", hex: "#171923" };
  }
  return AVATAR_COLORS[colorName];
}

export interface SpaceColorConfig {
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  cardBorder: string;
  cardBg: string;
  accent: string;
  hex: string;
  primaryHex: string;
  lightHex: string;
  textHex: string;
  borderHex: string;
}

export const SPACE_COLORS: Record<string, SpaceColorConfig> = {
  purple: {
    badgeBg: "bg-[#F5EEFD] dark:bg-purple-950/60",
    badgeText: "text-[#6B21A8] dark:text-[#D8B4FE]",
    badgeBorder: "border-[#E5D4F9] dark:border-purple-800/80",
    cardBorder: "border-[#E5D4F9] hover:border-[#B78AF2]",
    cardBg: "from-[#FAF6FE] to-white",
    accent: "bg-[#B78AF2]",
    hex: "#B78AF2",
    primaryHex: "#B78AF2",
    lightHex: "#F5EEFD",
    textHex: "#6B21A8",
    borderHex: "#E5D4F9",
  },
  orange: {
    badgeBg: "bg-[#FFF2EE] dark:bg-orange-950/60",
    badgeText: "text-[#C2410C] dark:text-[#FDBA74]",
    badgeBorder: "border-[#FEDACE] dark:border-orange-800/80",
    cardBorder: "border-[#FEDACE] hover:border-[#FF705B]",
    cardBg: "from-[#FFF6F3] to-white",
    accent: "bg-[#FF705B]",
    hex: "#FF705B",
    primaryHex: "#FF705B",
    lightHex: "#FFF2EE",
    textHex: "#C2410C",
    borderHex: "#FEDACE",
  },
  sky: {
    badgeBg: "bg-[#F0F9FE] dark:bg-sky-950/60",
    badgeText: "text-[#0369A1] dark:text-[#7DD3FC]",
    badgeBorder: "border-[#CEEEF9] dark:border-sky-800/80",
    cardBorder: "border-[#CEEEF9] hover:border-[#7DD3FC]",
    cardBg: "from-[#F5FBFE] to-white",
    accent: "bg-[#BFEAF7]",
    hex: "#BFEAF7",
    primaryHex: "#BFEAF7",
    lightHex: "#F0F9FE",
    textHex: "#0369A1",
    borderHex: "#CEEEF9",
  },
  emerald: {
    badgeBg: "bg-[#EFF8F5] dark:bg-emerald-950/60",
    badgeText: "text-[#065F46] dark:text-[#6EE7B7]",
    badgeBorder: "border-[#CCEBE1] dark:border-emerald-800/80",
    cardBorder: "border-[#CCEBE1] hover:border-[#A8DCCB]",
    cardBg: "from-[#F5FAF8] to-white",
    accent: "bg-[#A8DCCB]",
    hex: "#A8DCCB",
    primaryHex: "#A8DCCB",
    lightHex: "#EFF8F5",
    textHex: "#065F46",
    borderHex: "#CCEBE1",
  },
  rose: {
    badgeBg: "bg-[#FDF2F8] dark:bg-pink-950/60",
    badgeText: "text-[#9D174D] dark:text-[#F472B6]",
    badgeBorder: "border-[#FBCFE8] dark:border-pink-800/80",
    cardBorder: "border-[#FBCFE8] hover:border-[#F472B6]",
    cardBg: "from-[#FDF2F8] to-white",
    accent: "bg-[#F472B6]",
    hex: "#F472B6",
    primaryHex: "#F472B6",
    lightHex: "#FDF2F8",
    textHex: "#9D174D",
    borderHex: "#FBCFE8",
  },
  amber: {
    badgeBg: "bg-[#FEF3C7] dark:bg-amber-950/60",
    badgeText: "text-[#B45309] dark:text-[#FDE68A]",
    badgeBorder: "border-[#FDE68A] dark:border-amber-800/80",
    cardBorder: "border-[#FDE68A] hover:border-[#FBBF24]",
    cardBg: "from-[#FFFDF5] to-white",
    accent: "bg-[#FBBF24]",
    hex: "#FBBF24",
    primaryHex: "#FBBF24",
    lightHex: "#FEF3C7",
    textHex: "#B45309",
    borderHex: "#FDE68A",
  },
  indigo: {
    badgeBg: "bg-[#EEF2FF] dark:bg-indigo-950/60",
    badgeText: "text-[#4338CA] dark:text-[#C7D2FE]",
    badgeBorder: "border-[#C7D2FE] dark:border-indigo-800/80",
    cardBorder: "border-[#C7D2FE] hover:border-[#818CF8]",
    cardBg: "from-[#F8FAFF] to-white",
    accent: "bg-[#818CF8]",
    hex: "#818CF8",
    primaryHex: "#818CF8",
    lightHex: "#EEF2FF",
    textHex: "#4338CA",
    borderHex: "#C7D2FE",
  },
  teal: {
    badgeBg: "bg-[#CCFBF1] dark:bg-teal-950/60",
    badgeText: "text-[#0F766E] dark:text-[#99F6E4]",
    badgeBorder: "border-[#99F6E4] dark:border-teal-800/80",
    cardBorder: "border-[#99F6E4] hover:border-[#2DD4BF]",
    cardBg: "from-[#F0FDF4] to-white",
    accent: "bg-[#2DD4BF]",
    hex: "#2DD4BF",
    primaryHex: "#2DD4BF",
    lightHex: "#CCFBF1",
    textHex: "#0F766E",
    borderHex: "#99F6E4",
  },
  pink: {
    badgeBg: "bg-[#FFE4E6] dark:bg-rose-950/60",
    badgeText: "text-[#BE123C] dark:text-[#FECDD3]",
    badgeBorder: "border-[#FECDD3] dark:border-rose-800/80",
    cardBorder: "border-[#FECDD3] hover:border-[#F43F5E]",
    cardBg: "from-[#FFF1F2] to-white",
    accent: "bg-[#F43F5E]",
    hex: "#F43F5E",
    primaryHex: "#F43F5E",
    lightHex: "#FFE4E6",
    textHex: "#BE123C",
    borderHex: "#FECDD3",
  },
  slate: {
    badgeBg: "bg-[#F1F5F9] dark:bg-slate-950/60",
    badgeText: "text-[#334155] dark:text-[#CBD5E1]",
    badgeBorder: "border-[#CBD5E1] dark:border-slate-800/80",
    cardBorder: "border-[#CBD5E1] hover:border-[#94A3B8]",
    cardBg: "from-[#F8FAFC] to-white",
    accent: "bg-[#94A3B8]",
    hex: "#94A3B8",
    primaryHex: "#94A3B8",
    lightHex: "#F1F5F9",
    textHex: "#334155",
    borderHex: "#CBD5E1",
  },
};

export function getSpaceColor(colorName?: string): SpaceColorConfig {
  if (!colorName || !SPACE_COLORS[colorName]) {
    return SPACE_COLORS.purple;
  }
  return SPACE_COLORS[colorName];
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "No date";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatShortDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "No date";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatRelativeDeadline(dateStr: string | null | undefined): string {
  if (!dateStr) return "No deadline";
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 30) return `In ${diffDays}d`;
  if (diffDays < 365) {
    const months = Math.round(diffDays / 30);
    return `In ${months}mo (${d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })})`;
  }
  const years = (diffDays / 365).toFixed(1);
  return `In ~${years}y (${d.toLocaleDateString("en-US", { month: "short", year: "numeric" })})`;
}

export function isTaskUntouched(task: {
  status: string;
  reminder_date: string | null;
  last_activity_at: string;
  deadline: string | null;
}): boolean {
  if (task.status === "completed") return false;
  const now = new Date().getTime();
  const reminderTime = task.reminder_date ? new Date(task.reminder_date).getTime() : null;
  const deadlineTime = task.deadline ? new Date(task.deadline).getTime() : null;

  // Untouched if reminder window has started OR deadline is within 14 days
  const isWindowActive = reminderTime ? reminderTime <= now : false;
  const isImminent = deadlineTime ? deadlineTime - now <= 14 * 24 * 60 * 60 * 1000 : false;

  return (isWindowActive || isImminent) && task.status === "todo";
}

export function isTaskTaggedForUser(
  task: {
    title: string;
    description: string | null;
    tagged_users?: string[];
  },
  usernameOrUser?: string | { username: string } | null
): boolean {
  if (!usernameOrUser) return false;
  const username = (
    typeof usernameOrUser === "string" ? usernameOrUser : usernameOrUser.username
  ).toLowerCase();
  const userTag = `@${username}`;

  // Check notes tagged_users from DB
  if (task.tagged_users && Array.isArray(task.tagged_users)) {
    const lowerTags = task.tagged_users.map((u) => u.toLowerCase());
    if (lowerTags.includes(userTag)) return true;
  }

  // Check description
  if (task.description) {
    const descLower = task.description.toLowerCase();
    if (descLower.includes(userTag)) return true;
  }

  // Check title
  if (task.title) {
    const titleLower = task.title.toLowerCase();
    if (titleLower.includes(userTag)) return true;
  }

  return false;
}

const colors = {
  getSpaceIcon,
  AVATAR_COLORS,
  USER_HIGHLIGHTS,
  getUserHighlightStyle,
  getUserAvatarStyle,
  SPACE_COLORS,
  getSpaceColor,
  formatDate,
  formatShortDate,
  formatRelativeDeadline,
  isTaskUntouched,
  isTaskTaggedForUser,
};

export default colors;
