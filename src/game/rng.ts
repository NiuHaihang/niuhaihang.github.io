/**
 * Small deterministic PRNG so a round can be reproduced from a seed.
 * mulberry32 — good enough for game content, tiny, and fast.
 */
export type Rng = () => number;

export function makeRng(seed: number): Rng {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Inclusive on both ends. */
export function randInt(rng: Rng, lo: number, hi: number): number {
  if (hi < lo) [lo, hi] = [hi, lo];
  return lo + Math.floor(rng() * (hi - lo + 1));
}

export function chance(rng: Rng, p: number): boolean {
  return rng() < p;
}

export function pick<T>(rng: Rng, list: readonly T[]): T {
  const v = list[Math.floor(rng() * list.length)];
  if (v === undefined) throw new Error('pick() from empty list');
  return v;
}

export function shuffle<T>(list: readonly T[], rng: Rng): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = out[i]!;
    const b = out[j]!;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

export function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}
