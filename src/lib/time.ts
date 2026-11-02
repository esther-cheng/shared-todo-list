export type TimeUnit = "days" | "weeks" | "months" | "years";

export interface TimeUnitOption {
  value: TimeUnit;
  label: string;
  singular: string;
  multiplier: number;
}

export const TIME_UNIT_OPTIONS: TimeUnitOption[] = [
  { value: "days", label: "Days", singular: "day", multiplier: 1 },
  { value: "weeks", label: "Weeks", singular: "week", multiplier: 7 },
  { value: "months", label: "Months", singular: "month", multiplier: 30 },
  { value: "years", label: "Years", singular: "year", multiplier: 365 },
];

export const TIME_UNIT_MULTIPLIERS: Record<TimeUnit, number> = {
  days: 1,
  weeks: 7,
  months: 30,
  years: 365,
};

/**
 * Given a total number of lead days (from DB or task record),
 * deconstruct into natural value and unit.
 *
 * e.g. 14 -> { value: 2, unit: "weeks" }
 *      60 -> { value: 2, unit: "months" }
 *      365 -> { value: 1, unit: "years" }
 *      5 -> { value: 5, unit: "days" }
 */
export function parseLeadTimeToUnit(totalDays: number): { value: number; unit: TimeUnit } {
  if (!totalDays || totalDays <= 0) {
    return { value: 0, unit: "days" };
  }
  if (totalDays % 365 === 0 && totalDays >= 365) {
    return { value: totalDays / 365, unit: "years" };
  }
  if (totalDays % 30 === 0 && totalDays >= 30) {
    return { value: totalDays / 30, unit: "months" };
  }
  if (totalDays % 7 === 0 && totalDays >= 7) {
    return { value: totalDays / 7, unit: "weeks" };
  }
  return { value: totalDays, unit: "days" };
}

/**
 * Calculates total days given an input value and selected unit.
 */
export function calculateTotalDays(value: number | string, unit: TimeUnit): number {
  let num = 0;
  if (typeof value === "number") {
    num = Math.max(0, value);
  } else if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed !== "" && !isNaN(Number(trimmed))) {
      num = Math.max(0, parseInt(trimmed, 10));
    }
  }
  const multiplier = TIME_UNIT_MULTIPLIERS[unit] || 1;
  return num * multiplier;
}

/**
 * Formats duration compactly for badges, cards, and tables.
 * e.g. "3d", "2w", "1mo", "1y"
 */
export function formatLeadDuration(totalDays: number | null | undefined): string {
  if (!totalDays || totalDays <= 0) return "0d";
  if (totalDays % 365 === 0 && totalDays >= 365) return `${totalDays / 365}y`;
  if (totalDays % 30 === 0 && totalDays >= 30) return `${totalDays / 30}mo`;
  if (totalDays % 7 === 0 && totalDays >= 7) return `${totalDays / 7}w`;
  if (totalDays >= 365) return `${(totalDays / 365).toFixed(1)}y`;
  if (totalDays >= 60) return `${Math.round(totalDays / 30)}mo`;
  if (totalDays >= 14) return `${Math.round(totalDays / 7)}w`;
  return `${totalDays}d`;
}

/**
 * Formats duration for descriptive copy and calculated alerts.
 * e.g. "2 weeks", "1 month", "3 days", "1 year"
 */
export function formatLeadDurationLong(totalDays: number | null | undefined): string {
  if (!totalDays || totalDays <= 0) return "0 days";
  const { value, unit } = parseLeadTimeToUnit(totalDays);
  const opt = TIME_UNIT_OPTIONS.find((o) => o.value === unit);
  const label = value === 1 ? (opt?.singular || "day") : (opt?.label.toLowerCase() || "days");
  return `${value} ${label}`;
}

