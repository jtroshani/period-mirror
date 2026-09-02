/** Stable-ish id helper. Uses crypto.randomUUID when available. */
export function uid(prefix = "id"): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) return `${prefix}_${g.crypto.randomUUID()}`;
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

/** Deterministic id — handy for demo data so re-seeding is stable. */
export function deterministicId(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}_${parts.join("-")}`;
}
