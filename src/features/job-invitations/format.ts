export function bangkokDate(value: string | Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

export function formatPrice(value: string): string {
  const [whole, fraction = "00"] = value.split(".");
  const decimals = fraction === "00" ? "" : `.${fraction.padEnd(2, "0")}`;
  return `฿${BigInt(whole).toLocaleString("en-TH")}${decimals}`;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value.length === 10 ? `${value}T00:00:00Z` : value));
}

export function formatSentTime(value: string, referenceTime: string): string {
  const minutes = Math.max(0, Math.floor((Date.parse(referenceTime) - Date.parse(value)) / 60_000));
  if (minutes < 1) return "Invited just now";
  if (minutes < 60) return `Invited ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Invited ${hours}h ago`;
  return `Invited ${Math.floor(hours / 24)}d ago`;
}

export function formatSentDate(value: string): string {
  return (
    new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Bangkok",
    }).format(new Date(value)) + " (Asia/Bangkok)"
  );
}
