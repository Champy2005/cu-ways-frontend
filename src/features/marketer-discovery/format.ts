import { MONTH_LABELS } from "@/features/marketer-discovery/constants";

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

/** "2025-09-06" + "2025-09-28" -> "6 - 28 Sep 2025". */
export function formatDateRange(from: string | null, to: string | null): string | null {
  if (!from || !to) return null;
  const start = /^(\d{4})-(\d{2})-(\d{2})$/.exec(from);
  const end = /^(\d{4})-(\d{2})-(\d{2})$/.exec(to);
  if (!start || !end) return null;

  const endMonth = MONTH_LABELS[Number(end[2]) - 1] ?? end[2];
  if (start[1] === end[1] && start[2] === end[2]) {
    return `${Number(start[3])} - ${Number(end[3])} ${endMonth} ${end[1]}`;
  }
  const startMonth = MONTH_LABELS[Number(start[2]) - 1] ?? start[2];
  return `${Number(start[3])} ${startMonth} ${start[1]} - ${Number(end[3])} ${endMonth} ${end[1]}`;
}

export function formatYears(years: number | null): string {
  if (years === null) return "—";
  return years === 1 ? "1 year" : `${years} years`;
}
