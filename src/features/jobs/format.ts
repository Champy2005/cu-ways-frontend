export function formatOfferPrice(value: string): string {
  const amount = Number(value);
  return `฿${amount.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/** "7 Nov 2026, 10:00 (Bangkok)", for record timestamps such as payments and reviews. */
export function bangkokDateTime(value: string): string {
  return `${new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value))} (Bangkok)`;
}
