import { TimeUnit } from "./time";

export interface LeadTimePreset {
  label: string;
  value: number;
  unit: TimeUnit;
}

export interface TaskCategory {
  id: string;
  label: string;
  reminderPrompt: string;
  hints: string[];
  leadTimePresets: LeadTimePreset[];
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
    reminderPrompt: "Remember: shipping delays, order processing time, and return windows",
    hints: [
      "Confirm recipient address",
      "Check sizing or preferences",
      "Order gift / purchase item",
      "Wrap gift & write card",
      "Save receipt & track delivery",
    ],
    leadTimePresets: [
      { label: "Standard shipping", value: 5, unit: "days" },
      { label: "Express shipping", value: 3, unit: "days" },
      { label: "Return window", value: 2, unit: "weeks" },
    ],
    iconName: "shopping",
    badgeBg: "bg-[#FFF6F3]",
    badgeText: "text-[#C2410C]",
    badgeBorder: "border-[#FEDACE]",
    dotBg: "bg-[#FF705B]",
  },
  {
    id: "travel",
    label: "Travel & Trips",
    reminderPrompt: "Remember: passport validity (6+ months), check-in windows, and packing prep",
    hints: [
      "Verify passport expiration date",
      "Book flights & lodging",
      "Pack luggage & essentials",
      "Download boarding passes & tickets",
      "Arrange pet care or house sitting",
    ],
    leadTimePresets: [
      { label: "Packing buffer", value: 2, unit: "days" },
      { label: "Booking window", value: 3, unit: "weeks" },
      { label: "Passport renewal", value: 2, unit: "months" },
    ],
    iconName: "plane",
    badgeBg: "bg-[#F0F9FE]",
    badgeText: "text-[#0369A1]",
    badgeBorder: "border-[#CEEEF9]",
    dotBg: "bg-[#BFEAF7]",
  },
  {
    id: "documents",
    label: "Documents & Admin",
    reminderPrompt: "Remember: government processing, notarization, and appointment wait times",
    hints: [
      "Gather required IDs & proofs",
      "Schedule in-person appointment",
      "Fill out official application",
      "Get documents notarized or signed",
      "Pay fee & archive copies",
    ],
    leadTimePresets: [
      { label: "Doc gathering", value: 3, unit: "days" },
      { label: "Appointment wait", value: 2, unit: "weeks" },
      { label: "Gov processing", value: 1, unit: "months" },
    ],
    iconName: "document",
    badgeBg: "bg-[#F5EEFD]",
    badgeText: "text-[#6B21A8]",
    badgeBorder: "border-[#E5D4F9]",
    dotBg: "bg-[#B78AF2]",
  },
  {
    id: "health",
    label: "Health & Appointments",
    reminderPrompt: "Remember: appointment waitlists, prior-authorization, and prescription refills",
    hints: [
      "Confirm appointment date & time",
      "Review fasting or prep instructions",
      "Call insurance for prior-authorization",
      "Bring ID & insurance cards",
      "Request prescription refill",
    ],
    leadTimePresets: [
      { label: "Fasting & prep", value: 2, unit: "days" },
      { label: "Rx refill buffer", value: 5, unit: "days" },
      { label: "Specialist waitlist", value: 3, unit: "weeks" },
    ],
    iconName: "health",
    badgeBg: "bg-[#EFF8F5]",
    badgeText: "text-[#065F46]",
    badgeBorder: "border-[#CCEBE1]",
    dotBg: "bg-[#A8DCCB]",
  },
  {
    id: "events",
    label: "Events & Celebrations",
    reminderPrompt: "Remember: RSVP cutoff dates, venue deposits, and invitation delivery times",
    hints: [
      "Send invitations & track RSVPs",
      "Finalize guest headcount",
      "Confirm venue & pay deposit",
      "Order catering, food, & drinks",
      "Pick up decorations & supplies",
    ],
    leadTimePresets: [
      { label: "Final supplies & setup", value: 3, unit: "days" },
      { label: "RSVP cutoff", value: 2, unit: "weeks" },
      { label: "Venue deposit", value: 1, unit: "months" },
    ],
    iconName: "calendar",
    badgeBg: "bg-[#FDF2F8]",
    badgeText: "text-[#9D174D]",
    badgeBorder: "border-[#FBCFE8]",
    dotBg: "bg-[#F472B6]",
  },
  {
    id: "team",
    label: "Team & Sports",
    reminderPrompt: "Remember: registration deadlines, uniform delivery times, and travel coordination",
    hints: [
      "Complete registration form",
      "Sign liability waiver & upload physical",
      "Order uniform & necessary gear",
      "Pay league / tournament fees",
      "Coordinate carpool & schedule",
    ],
    leadTimePresets: [
      { label: "Uniform & gear check", value: 4, unit: "days" },
      { label: "Roster cutoff", value: 2, unit: "weeks" },
      { label: "Tournament travel", value: 1, unit: "months" },
    ],
    iconName: "team",
    badgeBg: "bg-[#FEF3C7]",
    badgeText: "text-[#B45309]",
    badgeBorder: "border-[#FDE68A]",
    dotBg: "bg-[#FBBF24]",
  },
  {
    id: "home",
    label: "Home & Maintenance",
    reminderPrompt: "Remember: contractor lead times, parts delivery, and municipal permit reviews",
    hints: [
      "Take measurements & inspect area",
      "Purchase materials & parts",
      "Request quotes & book contractor",
      "Clear workspace & protect surfaces",
      "Test repair & clean up area",
    ],
    leadTimePresets: [
      { label: "Parts delivery", value: 5, unit: "days" },
      { label: "Contractor booking", value: 2, unit: "weeks" },
      { label: "Permits & review", value: 1, unit: "months" },
    ],
    iconName: "home",
    badgeBg: "bg-[#EEF2FF]",
    badgeText: "text-[#4338CA]",
    badgeBorder: "border-[#C7D2FE]",
    dotBg: "bg-[#818CF8]",
  },
  {
    id: "finance",
    label: "Finances & Bills",
    reminderPrompt: "Remember: bank clearing times (2–3 business days), grace periods, and statement cuts",
    hints: [
      "Review statement & verify charges",
      "Check account balance for funds",
      "Submit payment / transfer",
      "Save confirmation receipt",
      "Update monthly budget tracker",
    ],
    leadTimePresets: [
      { label: "Bank clearing (ACH)", value: 3, unit: "days" },
      { label: "Statement review", value: 1, unit: "weeks" },
      { label: "Tax preparation", value: 2, unit: "weeks" },
    ],
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

