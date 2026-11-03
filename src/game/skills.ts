import { randInt, type Rng } from './rng';
import type { RawItem, SkillId } from './types';

export interface SkillDef {
  id: SkillId;
  /** Draw a valid, non-trivial instance. */
  sample: (rng: Rng) => RawItem;
}

const MAX_TRIES = 80;

function attempt(fn: (rng: Rng) => RawItem | null): (rng: Rng) => RawItem {
  return (rng) => {
    for (let i = 0; i < MAX_TRIES; i++) {
      const item = fn(rng);
      if (item) return item;
    }
    // Unreachable with the constraints below; keeps the type honest.
    return { a: 8, b: 5, op: '+', blank: 'answer' };
  };
}

export const SKILLS: Record<SkillId, SkillDef> = {
  add10: {
    id: 'add10',
    sample: attempt((rng) => {
      const a = randInt(rng, 1, 8);
      const b = randInt(rng, 1, 10 - a);
      return { a, b, op: '+', blank: 'answer' };
    }),
  },

  addBridge: {
    id: 'addBridge',
    sample: attempt((rng) => {
      const a = randInt(rng, 3, 9);
      const b = randInt(rng, Math.max(2, 11 - a), 9);
      return { a, b, op: '+', blank: 'answer' };
    }),
  },

  sub10: {
    id: 'sub10',
    sample: attempt((rng) => {
      const a = randInt(rng, 4, 10);
      const b = randInt(rng, 1, a - 2);
      return { a, b, op: '-', blank: 'answer' };
    }),
  },

  subCross: {
    id: 'subCross',
    sample: attempt((rng) => {
      const a = randInt(rng, 11, 18);
      const b = randInt(rng, Math.max(2, a - 9), 9);
      return { a, b, op: '-', blank: 'answer' };
    }),
  },

  add2d1d: {
    id: 'add2d1d',
    sample: attempt((rng) => {
      const a = randInt(rng, 12, 89);
      const ones = a % 10;
      if (ones > 7) return null;
      // "+1" is not practice, it is a reflex: keep the addend at 2..9.
      const b = randInt(rng, 2, 9 - ones);
      return { a, b, op: '+', blank: 'answer' };
    }),
  },

  add2d1dCarry: {
    id: 'add2d1dCarry',
    sample: attempt((rng) => {
      const a = randInt(rng, 10, 90);
      const ones = a % 10;
      if (ones === 0) return null;
      const b = randInt(rng, Math.max(2, 10 - ones), 9);
      return { a, b, op: '+', blank: 'answer' };
    }),
  },

  sub2d1d: {
    id: 'sub2d1d',
    sample: attempt((rng) => {
      const a = randInt(rng, 12, 99);
      const ones = a % 10;
      if (ones < 2) return null;
      // "−1" is not practice, it is a reflex: keep the subtrahend at 2..9.
      const b = randInt(rng, 2, ones);
      return { a, b, op: '-', blank: 'answer' };
    }),
  },

  sub2d1dBorrow: {
    id: 'sub2d1dBorrow',
    sample: attempt((rng) => {
      const a = randInt(rng, 11, 98);
      const ones = a % 10;
      if (ones === 9) return null;
      const b = randInt(rng, ones + 1, 9);
      return { a, b, op: '-', blank: 'answer' };
    }),
  },

  add2d2d: {
    id: 'add2d2d',
    sample: attempt((rng) => {
      const aT = randInt(rng, 1, 8);
      const aO = randInt(rng, 1, 9);
      const bT = randInt(rng, 1, 9 - aT);
      const bO = randInt(rng, 1, 9 - aO);
      return { a: aT * 10 + aO, b: bT * 10 + bO, op: '+', blank: 'answer' };
    }),
  },

  add2d2dCarry: {
    id: 'add2d2dCarry',
    sample: attempt((rng) => {
      const aT = randInt(rng, 1, 7);
      const aO = randInt(rng, 2, 9);
      const bT = randInt(rng, 1, 8 - aT);
      const bO = randInt(rng, 10 - aO, 9);
      return { a: aT * 10 + aO, b: bT * 10 + bO, op: '+', blank: 'answer' };
    }),
  },

  sub2d2d: {
    id: 'sub2d2d',
    sample: attempt((rng) => {
      const aT = randInt(rng, 3, 9);
      const aO = randInt(rng, 0, 9);
      const bT = randInt(rng, 1, aT - 1);
      const bO = randInt(rng, 0, aO);
      if (aO === 0 && bO === 0) return null;
      return { a: aT * 10 + aO, b: bT * 10 + bO, op: '-', blank: 'answer' };
    }),
  },

  sub2d2dBorrow: {
    id: 'sub2d2dBorrow',
    sample: attempt((rng) => {
      const aT = randInt(rng, 3, 9);
      const aO = randInt(rng, 0, 7);
      const bT = randInt(rng, 1, aT - 1);
      const bO = randInt(rng, aO + 1, 9);
      return { a: aT * 10 + aO, b: bT * 10 + bO, op: '-', blank: 'answer' };
    }),
  },

  missing: {
    id: 'missing',
    sample: attempt((rng) => {
      const family = randInt(rng, 0, 3);
      if (family === 0 || family === 1) {
        const total = randInt(rng, 9, 18);
        const part = randInt(rng, 2, total - 2);
        return {
          a: family === 0 ? part : total - part,
          b: family === 0 ? total - part : part,
          op: '+',
          blank: family === 0 ? 'b' : 'a',
        };
      }
      if (family === 2) {
        const total = randInt(rng, 11, 18);
        const part = randInt(rng, 2, total - 3);
        return { a: total, b: part, op: '-', blank: 'b' };
      }
      const result = randInt(rng, 4, 14);
      const part = randInt(rng, 2, 9);
      return { a: result + part, b: part, op: '-', blank: 'a' };
    }),
  },

  stretch3d: {
    id: 'stretch3d',
    sample: attempt((rng) => {
      const h = randInt(rng, 1, 9);
      const t = randInt(rng, 0, 9);
      const o = randInt(rng, 1, 9);
      // One-digit addend, but *not* forced below the ones digit: keeping
      // 9 + 7 and 304 − 8 in reach is what makes a hundreds item a stretch
      // rather than a three-digit number with a trivial +2 stapled on.
      const b = randInt(rng, 1, 9);
      const op = rng() < 0.5 ? '+' : '-';
      return { a: h * 100 + t * 10 + o, b, op, blank: 'answer' };
    }),
  },

  stretch100: {
    id: 'stretch100',
    sample: attempt((rng) => {
      const b = randInt(rng, 11, 89);
      if (b % 10 === 0) return null;
      return { a: 100, b, op: '-', blank: 'answer' };
    }),
  },
};

export const SKILL_IDS = Object.keys(SKILLS) as SkillId[];
