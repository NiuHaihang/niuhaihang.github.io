import { describe, expect, it } from 'vitest';
import { INTERVALS, REVIEW_SIZE, addDays, buildReview, dueCount, dueKeys, intervalFor, keyFor, record } from './review';
import { lessonsFor } from '../content';
import { buildLesson } from './exercise';

const today = '2026-11-03';

describe('spaced repetition', () => {
  it('adds days across month ends', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 7)).toBe('2027-01-07');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('grows the interval with every success', () => {
    expect(INTERVALS).toEqual([1, 3, 7, 16]);
    expect(intervalFor(0)).toBe(1);
    expect(intervalFor(1)).toBe(3);
    expect(intervalFor(2)).toBe(7);
    expect(intervalFor(9)).toBe(16);
  });

  it('schedules a new item for tomorrow and a known one further out', () => {
    let memory = record({}, 'w:hello', true, today);
    expect(memory['w:hello']).toEqual({ n: 1, due: addDays(today, 1) });
    memory = record(memory, 'w:hello', true, today);
    expect(memory['w:hello']).toEqual({ n: 2, due: addDays(today, 3) });
    memory = record(memory, 'w:hello', true, today);
    expect(memory['w:hello']).toEqual({ n: 3, due: addDays(today, 7) });
    memory = record(memory, 'w:hello', true, today);
    expect(memory['w:hello']).toEqual({ n: 4, due: addDays(today, 16) });
  });

  it('steps back one box on a miss and returns tomorrow', () => {
    let memory: Record<string, { n: number; due: string }> = { 'w:school': { n: 2, due: today } };
    memory = record(memory, 'w:school', false, today);
    expect(memory['w:school']).toEqual({ n: 1, due: addDays(today, 1) });
    memory = record(memory, 'w:school', false, today);
    memory = record(memory, 'w:school', false, today);
    expect(memory['w:school']).toEqual({ n: 0, due: addDays(today, 1) });
  });

  it('lists only what is due, oldest first', () => {
    const memory = {
      'w:a': { n: 0, due: '2026-11-03' },
      'w:b': { n: 1, due: '2026-11-05' },
      'w:c': { n: 1, due: '2026-11-01' },
    };
    expect(dueKeys(memory, today)).toEqual(['w:c', 'w:a']);
    expect(dueCount(memory, today)).toBe(2);
  });

  it('keys word and sentence exercises, not match grids', () => {
    const exercises = buildLesson(lessonsFor(3, 'words')[0]!, 9);
    const keys = exercises.map(keyFor).filter((k): k is string => Boolean(k));
    expect(keys.length).toBeGreaterThan(0);
    expect(keys.every((k) => k.startsWith('w:') || k.startsWith('s:'))).toBe(true);
    const match = exercises.find((e) => e.kind === 'match');
    if (match) expect(keyFor(match)).toBeNull();
  });

  it('builds a review round from what is due', () => {
    const exercises = buildLesson(lessonsFor(3, 'words')[0]!, 9);
    const memory: Record<string, { n: number; due: string }> = {};
    for (const exercise of exercises) {
      const key = keyFor(exercise);
      if (key) memory[key] = { n: 0, due: today };
    }
    const review = buildReview(memory, today, 21);
    expect(review.length).toBeGreaterThan(0);
    expect(review.length).toBeLessThanOrEqual(REVIEW_SIZE);
  });

  it('still gives practice when nothing is due', () => {
    const review = buildReview({ 'w:hello': { n: 1, due: addDays(today, 5) } }, today, 3);
    expect(review.length).toBeGreaterThan(0);
  });
});
