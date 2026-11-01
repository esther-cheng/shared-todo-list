export const AVATAR_COLORS: Record<string, { bg: string; text: string; hex: string; name: string }> = {
  purple: { name: "Lilac Purple", bg: "bg-[#B78AF2]", text: "text-[#171923]", hex: "#B78AF2" },
  orange: { name: "Warm Coral", bg: "bg-[#FF705B]", text: "text-white", hex: "#FF705B" },
  sky: { name: "Soft Sky", bg: "bg-[#BFEAF7]", text: "text-[#171923]", hex: "#BFEAF7" },
  emerald: { name: "Mint Emerald", bg: "bg-[#A8DCCB]", text: "text-[#171923]", hex: "#A8DCCB" },
  rose: { name: "Blush Rose", bg: "bg-[#F472B6]", text: "text-white", hex: "#F472B6" },
};

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
  },
  orange: {
    badgeBg: "bg-[#FFF2EE] dark:bg-orange-950/60",
    badgeText: "text-[#C2410C] dark:text-[#FDBA74]",
    badgeBorder: "border-[#FEDACE] dark:border-orange-800/80",
    cardBorder: "border-[#FEDACE] hover:border-[#FF705B]",
    cardBg: "from-[#FFF6F3] to-white",
    accent: "bg-[#FF705B]",
    hex: "#FF705B",
  },
  sky: {
    badgeBg: "bg-[#F0F9FE] dark:bg-sky-950/60",
    badgeText: "text-[#0369A1] dark:text-[#7DD3FC]",
    badgeBorder: "border-[#CEEEF9] dark:border-sky-800/80",
    cardBorder: "border-[#CEEEF9] hover:border-[#7DD3FC]",
    cardBg: "from-[#F5FBFE] to-white",
    accent: "bg-[#BFEAF7]",
    hex: "#BFEAF7",
  },
  emerald: {
    badgeBg: "bg-[#EFF8F5] dark:bg-emerald-950/60",
    badgeText: "text-[#065F46] dark:text-[#6EE7B7]",
    badgeBorder: "border-[#CCEBE1] dark:border-emerald-800/80",
    cardBorder: "border-[#CCEBE1] hover:border-[#A8DCCB]",
    cardBg: "from-[#F5FAF8] to-white",
    accent: "bg-[#A8DCCB]",
    hex: "#A8DCCB",
  },
  rose: {
    badgeBg: "bg-[#FDF2F8] dark:bg-pink-950/60",
    badgeText: "text-[#9D174D] dark:text-[#F472B6]",
    badgeBorder: "border-[#FBCFE8] dark:border-pink-800/80",
    cardBorder: "border-[#FBCFE8] hover:border-[#F472B6]",
    cardBg: "from-[#FDF2F8] to-white",
    accent: "bg-[#F472B6]",
    hex: "#F472B6",
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
    if (lowerTags.includes("@partner")) return true;
  }

  // Check description
  if (task.description) {
    const descLower = task.description.toLowerCase();
    if (descLower.includes(userTag)) return true;
    if (descLower.includes("@partner")) return true;
  }

  // Check title
  if (task.title) {
    const titleLower = task.title.toLowerCase();
    if (titleLower.includes(userTag)) return true;
    if (titleLower.includes("@partner")) return true;
  }

  return false;
}
