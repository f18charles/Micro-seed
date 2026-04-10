export function sanitiseText(input: string): string {
  if (!input) return "";
  // Strip HTML tags and trim
  return input.replace(/<[^>]*>/g, "").trim();
}

export function sanitiseNumber(input: unknown, min: number, max: number): number {
  const parsed = typeof input === 'number' ? input : parseFloat(String(input));
  if (isNaN(parsed)) return min;
  return Math.max(min, Math.min(max, parsed));
}
