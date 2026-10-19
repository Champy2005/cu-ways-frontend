import { AVAILABILITY_OPTIONS, MONTH_LABELS } from "@/features/marketer-discovery/constants";
import type { AvailabilityStatus } from "@/features/marketer-discovery/types";

export function formatBaht(amount: number): string {
  return `฿${amount.toLocaleString("en-US")}`;
}

export function formatRating(rating: number | null): string | null {
  return rating === null ? null : rating.toFixed(1);
}

export function formatCount(count: number | null): string {
  return count === null ? "—" : count.toLocaleString("en-US");
}

/** "2025-10-12" -> "Oct 12". Returns the input unchanged when unparseable. */
export function formatShortDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const month = MONTH_LABELS[Number(match[2]) - 1];
  return month ? `${month} ${Number(match[3])}` : iso;
}

/** ("limited", "Weekdays only") -> "Limited · Weekdays only". */
export function formatAvailability(status: AvailabilityStatus, text: string): string {
  const label = AVAILABILITY_OPTIONS.find((option) => option.value === status)?.label ?? status;
  const note = text.trim();
  return note ? `${label} · ${note}` : label;
}

export function formatYears(years: number | null): string {
  if (years === null) return "—";
  return years === 1 ? "1 year" : `${years} years`;
}
