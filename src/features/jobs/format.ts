export function formatOfferPrice(value: string): string {
  const amount = Number(value);
  return `฿${amount.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
