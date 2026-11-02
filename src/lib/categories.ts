export interface TaskCategory {
  id: string;
  label: string;
  reminderPrompt: string;
  hints: string[];
  iconName: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotBg: string;
}

export const TASK_CATEGORIES: TaskCategory[] = [
  {
    id: "shopping",
    label: "Shopping & Gifts",
    reminderPrompt: "Remember: shipping time, order processing, holiday postal delays, return windows",
    hints: ["Shipping time (3–7d)", "Order processing", "Return window", "Gift wrapping"],
    iconName: "shopping",
    badgeBg: "bg-[#FFF6F3]",
    badgeText: "text-[#C2410C]",
    badgeBorder: "border-[#FEDACE]",
    dotBg: "bg-[#FF705B]",
  },
  {
    id: "travel",
    label: "Travel & Trips",
    reminderPrompt: "Remember: passport validity (6+ months), booking windows, check-in deadlines, packing prep",
    hints: ["Passport validity (6 mo)", "Booking window", "Check-in time", "Packing buffer"],
    iconName: "plane",
    badgeBg: "bg-[#F0F9FE]",
    badgeText: "text-[#0369A1]",
    badgeBorder: "border-[#CEEEF9]",
    dotBg: "bg-[#BFEAF7]",
  },
  {
    id: "documents",
    label: "Documents & Admin",
    reminderPrompt: "Remember: processing time, in-person appointments, expiration dates, notarization",
    hints: ["Gov processing time", "Expiration date", "In-person appointment", "Document gathering"],
    iconName: "document",
    badgeBg: "bg-[#F5EEFD]",
    badgeText: "text-[#6B21A8]",
    badgeBorder: "border-[#E5D4F9]",
    dotBg: "bg-[#B78AF2]",
  },
  {
    id: "health",
    label: "Health & Appointments",
    reminderPrompt: "Remember: appointment waitlists, insurance pre-authorizations, prescription refills, fasting prep",
    hints: ["Specialist waitlist", "Prior authorization", "Prescription refill", "Prep fasting"],
    iconName: "health",
    badgeBg: "bg-[#EFF8F5]",
    badgeText: "text-[#065F46]",
    badgeBorder: "border-[#CCEBE1]",
    dotBg: "bg-[#A8DCCB]",
  },
  {
    id: "events",
    label: "Events & Celebrations",
    reminderPrompt: "Remember: RSVP deadlines, venue reservation cutoffs, catering deposits, invitation mail dates",
    hints: ["RSVP cutoff", "Venue deposit", "Catering headcount", "Invitations mail date"],
    iconName: "calendar",
    badgeBg: "bg-[#FDF2F8]",
    badgeText: "text-[#9D174D]",
    badgeBorder: "border-[#FBCFE8]",
    dotBg: "bg-[#F472B6]",
  },
  {
    id: "team",
    label: "Team & Sports",
    reminderPrompt: "Remember: roster registration cutoffs, uniform & gear ordering, travel coordination, waivers",
    hints: ["Registration cutoff", "Uniform delivery", "Waivers & physicals", "Travel logistics"],
    iconName: "team",
    badgeBg: "bg-[#FEF3C7]",
    badgeText: "text-[#B45309]",
    badgeBorder: "border-[#FDE68A]",
    dotBg: "bg-[#FBBF24]",
  },
  {
    id: "home",
    label: "Home & Maintenance",
    reminderPrompt: "Remember: contractor lead times, parts & material delivery, weather windows, municipal permits",
    hints: ["Contractor schedule", "Parts delivery", "Weather window", "Permits"],
    iconName: "home",
    badgeBg: "bg-[#EEF2FF]",
    badgeText: "text-[#4338CA]",
    badgeBorder: "border-[#C7D2FE]",
    dotBg: "bg-[#818CF8]",
  },
  {
    id: "finance",
    label: "Finances & Bills",
    reminderPrompt: "Remember: statement due dates, bank transfer clearing times (2–3 business days), grace periods",
    hints: ["Bank transfer (2–3d)", "Grace period", "Auto-pay cutoff", "Tax documents"],
    iconName: "finance",
    badgeBg: "bg-[#CCFBF1]",
    badgeText: "text-[#0F766E]",
    badgeBorder: "border-[#99F6E4]",
    dotBg: "bg-[#2DD4BF]",
  },
];

export function getCategory(categoryId?: string | null): TaskCategory | null {
  if (!categoryId) return null;
  const normalized = categoryId.toLowerCase().trim();
  return TASK_CATEGORIES.find((c) => c.id === normalized) || null;
}

