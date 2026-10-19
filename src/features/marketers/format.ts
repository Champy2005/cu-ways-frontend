/** Display decimal strings without converting financial totals to floating-point numbers. */
export function formatBahtAmount(value: string): string {
  const [whole, fraction = ""] = value.split(".");
  return `${BigInt(whole).toLocaleString("en-TH")}.${fraction.padEnd(2, "0")}`;
}
