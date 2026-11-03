import type { Blank, Op } from './types';

/**
 * The difficulty model is deliberately explainable: every point comes from a
 * property a teacher would name. Correctness is pinned by family-ordering and
 * level-ordering tests (difficulty.test.ts, generator.test.ts) rather than by
 * trusting these constants.
 *
 * Two rules keep it honest for this age group:
 *  - a teen minus a 1-digit number is a "break ten" fact, not a 2-digit
 *    place-value task, so it does not pay the 2-digit magnitude or borrow cost;
 *  - a carry/borrow only costs extra when the columns genuinely regroup.
 */
export interface CostParts {
  base: number;
  magnitude: number;
  twoDigitPair: number;
  regroup: number;
  bridgeTen: number;
  breakTen: number;
  subtraction: number;
  missingSlot: number;
  roundHundred: number;
  zeroEnding: number;
}

export interface Breakdown {
  cost: number;
  parts: CostParts;
}

export function breakdown(a: number, b: number, op: Op, blank: Blank): Breakdown {
  const big = Math.max(a, b);
  const twoDigitPair = a >= 10 && b >= 10;
  const addCarry = op === '+' && a % 10 + (b % 10) >= 10;
  const subBorrow = op === '-' && a >= 20 && a % 10 < b % 10;
  const regroup = addCarry || subBorrow;
  const bridgeTen = op === '+' && a < 10 && b < 10 && a + b > 10;
  const breakTen = op === '-' && a > 10 && a < 20 && b < 10 && a - b < 10;
  const twoDigitMagnitude = op === '+' ? big >= 10 : a >= 20;

  const parts: CostParts = {
    base: 6,
    magnitude: big >= 100 ? 14 : twoDigitMagnitude ? 8 : 0,
    twoDigitPair: twoDigitPair ? 6 : 0,
    regroup: regroup ? (twoDigitPair ? 12 : 8) : 0,
    bridgeTen: bridgeTen ? 7 : 0,
    breakTen: breakTen ? 5 : 0,
    subtraction: op === '-' ? 2 : 0,
    missingSlot: blank !== 'answer' ? 20 : 0,
    roundHundred: a === 100 ? 4 : 0,
    zeroEnding: a % 10 === 0 || b % 10 === 0 ? -3 : 0,
  };

  const cost = Object.values(parts).reduce((sum, n) => sum + n, 0);
  return { cost, parts };
}

/** 0..100, higher = harder. */
export function difficultyOf(a: number, b: number, op: Op, blank: Blank = 'answer'): number {
  const { cost } = breakdown(a, b, op, blank);
  return Math.max(0, Math.min(100, Math.round(cost * 2)));
}

export function isRegrouping(a: number, b: number, op: Op): boolean {
  if (op === '+') return a % 10 + (b % 10) >= 10;
  return a >= 20 && a % 10 < b % 10;
}
