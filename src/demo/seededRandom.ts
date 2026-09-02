/** Tiny deterministic PRNG (mulberry32) so demo data is stable across reloads. */
export function createRng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    /** float in [0, 1) */
    float: next,
    /** float in [min, max) */
    range: (min: number, max: number) => min + next() * (max - min),
    /** integer in [min, max] inclusive */
    int: (min: number, max: number) => Math.floor(min + next() * (max - min + 1)),
    /** true with probability p */
    chance: (p: number) => next() < p,
    /** pick one element */
    pick: <T>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)],
    /** gaussian-ish noise around 0 with given spread */
    noise: (spread: number) => (next() + next() + next() - 1.5) * spread,
  };
}

export type Rng = ReturnType<typeof createRng>;
