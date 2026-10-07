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
