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
 *
 * Times-table facts get their own branch: the cost grows with the *factor*
 * (2×-table before the 7×-table), then the hard-fact pairs (6, 7, 8, 9
 * together), then two-digit factors. Division costs a little more than the
 * matching multiplication because the child has to recall the fact backwards.
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
  /** Times-table branch only. */
  table: number;
  hardFact: number;
  bigFactor: number;
  division: number;
  /** Division by a 1-digit number with a 2-digit quotient (96 ÷ 8). */
  bigQuotient: number;
}

export interface Breakdown {
  cost: number;
  parts: CostParts;
}

const ZERO_PARTS: CostParts = {
  base: 0,
  magnitude: 0,
  twoDigitPair: 0,
  regroup: 0,
  bridgeTen: 0,
  breakTen: 0,
  subtraction: 0,
  missingSlot: 0,
  roundHundred: 0,
  zeroEnding: 0,
  table: 0,
  hardFact: 0,
  bigFactor: 0,
  division: 0,
  bigQuotient: 0,
};

export function breakdown(a: number, b: number, op: Op, blank: Blank): Breakdown {
  if (op === '×' || op === '÷') return timesBreakdown(a, b, op, blank);

  const big = Math.max(a, b);
  const twoDigitPair = a >= 10 && b >= 10;
  const addCarry = op === '+' && a % 10 + (b % 10) >= 10;
  const subBorrow = op === '-' && a >= 20 && a % 10 < b % 10;
  const regroup = addCarry || subBorrow;
  const bridgeTen = op === '+' && a < 10 && b < 10 && a + b > 10;
  const breakTen = op === '-' && a > 10 && a < 20 && b < 10 && a - b < 10;
  const twoDigitMagnitude = op === '+' ? big >= 10 : a >= 20;

  const parts: CostParts = {
    ...ZERO_PARTS,
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

  return { cost: sum(parts), parts };
}

/**
 * `a op b` for × and ÷. The factor pair is (a, b) for multiplication and
 * (divisor, quotient) for division, so the same rules score both.
 */
function timesBreakdown(a: number, b: number, op: Op, blank: Blank): Breakdown {
  const quotient = op === '÷' ? a / b : a;
  const fact = Math.max(quotient, b);
  const other = Math.min(quotient, b);

  // Which multiplication table is this? Tens are a pattern, not a memorised fact.
  const table = fact === 10 ? 2 : fact <= 2 ? 2 : fact <= 5 ? 6 : fact <= 9 ? 10 : 20;
  // 6×7, 7×8, 8×9 — the facts children actually stumble on.
  const hardFact = fact <= 9 && other >= 6 ? 8 : fact <= 9 && other >= 4 ? 3 : 0;
  const bigFactor = fact >= 10 ? 6 : 0;
  const division = op === '÷' ? 3 : 0;
  const bigQuotient = op === '÷' && quotient >= 10 ? 2 : 0;

  const parts: CostParts = {
    ...ZERO_PARTS,
    base: 6,
    table,
    hardFact,
    bigFactor,
    division,
    bigQuotient,
    missingSlot: blank !== 'answer' ? 20 : 0,
  };

  return { cost: sum(parts), parts };
}

function sum(parts: CostParts): number {
  return Object.values(parts).reduce((total, n) => total + n, 0);
}

/** 0..100, higher = harder. */
export function difficultyOf(a: number, b: number, op: Op, blank: Blank = 'answer'): number {
  const { cost } = breakdown(a, b, op, blank);
  return Math.max(0, Math.min(100, Math.round(cost * 2)));
}

export function isRegrouping(a: number, b: number, op: Op): boolean {
  if (op === '×' || op === '÷') return false;
  if (op === '+') return a % 10 + (b % 10) >= 10;
  return a >= 20 && a % 10 < b % 10;
}
