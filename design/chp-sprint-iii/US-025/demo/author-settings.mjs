export function parseHeight(value) {
  if (value === null || String(value).trim() === '') return 844;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 844;
  return Math.min(1440, Math.max(225, Math.round(parsed)));
}
