import { describe, expect, it } from 'vitest';
import { breakdown, difficultyOf, isRegrouping } from './difficulty';

const d = difficultyOf;

describe('difficulty model', () => {
  it('keeps every item on the 0..100 scale', () => {
    const samples: Array<[number, number, '+' | '-']> = [
      [1, 1, '+'],
      [9, 9, '+'],
      [100, 37, '-'],
      [999, 9, '+'],
      [20, 13, '-'],
    ];
    for (const [a, b, op] of samples) {
      const value = d(a, b, op);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  it('orders difficulty inside every skill family', () => {
    expect(d(34, 5, '+'), '2d + 1d > add within 10').toBeGreaterThan(d(3, 6, '+'));
    expect(d(34, 25, '+'), '2d + 2d > 2d + 1d').toBeGreaterThan(d(34, 5, '+'));
    expect(d(28, 7, '+'), 'carrying > no carrying').toBeGreaterThan(d(34, 5, '+'));
    expect(d(47, 38, '+'), 'carry with 2d2d > no carry').toBeGreaterThan(d(34, 25, '+'));
    expect(d(43, 8, '-'), 'borrowing > no borrowing').toBeGreaterThan(d(48, 3, '-'));
    expect(d(63, 29, '-'), 'borrow with 2d2d > no borrow').toBeGreaterThan(d(76, 42, '-'));
    expect(d(76, 42, '-'), '2d - 2d > 2d - 1d').toBeGreaterThan(d(47, 5, '-'));
    expect(d(204, 7, '+'), 'hundreds > tens').toBeGreaterThan(d(34, 7, '+'));
    expect(d(100, 37, '-'), '100 minus > 2d borrow').toBeGreaterThan(d(63, 29, '-'));
    expect(d(8, 5, '+'), 'making ten > plain add within 10').toBeGreaterThan(d(3, 6, '+'));
    expect(d(15, 8, '-'), 'breaking ten > plain subtract within 10').toBeGreaterThan(d(9, 4, '-'));
  });

  it('treats a missing slot as harder than a plain answer', () => {
    expect(d(8, 7, '+', 'b')).toBeGreaterThan(d(8, 7, '+', 'answer'));
    expect(d(15, 7, '-', 'b')).toBeGreaterThan(d(15, 7, '-', 'answer'));
  });

  it('keeps teen subtraction below two-digit place-value work', () => {
    expect(d(15, 8, '-')).toBeLessThan(d(34, 5, '+'));
  });

  it('reports regrouping consistently with its own cost breakdown', () => {
    for (let a = 10; a < 100; a += 7) {
      for (let b = 1; b < 10; b++) {
        const carry = a % 10 + b >= 10;
        expect(isRegrouping(a, b, '+')).toBe(carry);
        expect(breakdown(a, b, '+', 'answer').parts.regroup).toBe(carry ? 8 : 0);
        expect(breakdown(a, b, '-', 'answer').parts.regroup).toBe(a >= 20 && a % 10 < b ? 8 : 0);
      }
    }
  });

  it('orders times-table facts by table and by hard-fact pair', () => {
    expect(d(3, 2, '×'), 'order does not matter').toBe(d(2, 3, '×'));
    expect(d(5, 5, '×')).toBeGreaterThan(d(2, 3, '×'));
    expect(d(7, 8, '×'), '7 x 8 > 5 x 5').toBeGreaterThan(d(5, 5, '×'));
    expect(d(9, 9, '×'), '9 x 9 >= 7 x 8').toBeGreaterThanOrEqual(d(7, 8, '×'));
    expect(d(6, 2, '×'), '6 x 2 < 6 x 7 (same table, easier pair)').toBeLessThan(d(6, 7, '×'));
    expect(d(10, 6, '×'), '10 x 6 is a pattern, not a fact').toBeLessThan(d(6, 7, '×'));
  });

  it('makes division of a fact slightly harder than multiplying it', () => {
    expect(d(56, 8, '÷')).toBeGreaterThan(d(7, 8, '×'));
    expect(d(24, 4, '÷')).toBeGreaterThan(d(6, 4, '×'));
  });

  it('ranks two-digit multiplication above the tables', () => {
    expect(d(23, 3, '×')).toBeGreaterThan(d(9, 9, '×'));
    expect(d(96, 8, '÷')).toBeGreaterThan(d(56, 8, '÷'));
  });

  it('treats a missing factor as harder than a plain product', () => {
    expect(d(7, 8, '×', 'b')).toBeGreaterThan(d(7, 8, '×'));
    expect(d(56, 8, '÷', 'b')).toBeGreaterThan(d(56, 8, '÷'));
  });

  it('never claims × or ÷ items regroup', () => {
    expect(isRegrouping(23, 3, '×')).toBe(false);
    expect(isRegrouping(96, 8, '÷')).toBe(false);
  });

  it('keeps × and ÷ on the same 0..100 scale as the rest', () => {
    const samples: Array<[number, number, '×' | '÷']> = [
      [2, 2, '×'],
      [9, 9, '×'],
      [49, 4, '×'],
      [4, 2, '÷'],
      [99, 9, '÷'],
    ];
    for (const [a, b, op] of samples) {
      const value = d(a, b, op);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });
});
