import { describe, expect, it } from 'vitest';
import { lessonsFor } from '../content';
import { LESSON_SIZE, buildLesson, isCorrect } from './exercise';

const wordsLesson = lessonsFor(3, 'words')[0]!;
const phonicsLesson = lessonsFor(3, 'phonics')[0]!;
const grammarLesson = lessonsFor(3, 'grammar')[0]!;

describe('lesson builder', () => {
  it('fills a word lesson to size with unique exercises', () => {
    const exercises = buildLesson(wordsLesson, 7);
    expect(exercises).toHaveLength(LESSON_SIZE);
    expect(new Set(exercises.map((e) => e.id)).size).toBe(exercises.length);
  });

  it('is deterministic for a seed and varied across seeds', () => {
    const a = buildLesson(wordsLesson, 11).map((e) => e.id);
    const b = buildLesson(wordsLesson, 11).map((e) => e.id);
    const c = buildLesson(wordsLesson, 12).map((e) => e.id);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it('spells words from their own letters', () => {
    const exercises = buildLesson(wordsLesson, 3).filter((e) => e.kind === 'spell');
    expect(exercises.length).toBeGreaterThan(0);
    for (const exercise of exercises) {
      if (exercise.kind !== 'spell') continue;
      const letters = [...exercise.letters].sort().join('');
      const answer = [...exercise.answer.replace(/[^a-z]/gi, '')].sort().join('');
      expect(letters).toBe(answer);
      expect(isCorrect(exercise, exercise.answer)).toBe(true);
      expect(isCorrect(exercise, 'zzz')).toBe(false);
    }
  });

  it('always offers the right option', () => {
    for (const exercise of buildLesson(wordsLesson, 5)) {
      if (exercise.kind === 'picture' || exercise.kind === 'choice') {
        expect(exercise.options).toContain(exercise.answer);
      }
      if (exercise.kind === 'listen' || exercise.kind === 'sameSound') {
        expect(exercise.options.some((w) => w.id === exercise.answer)).toBe(true);
      }
    }
  });

  it('builds a phonics drill out of sound-alike words', () => {
    const exercises = buildLesson(phonicsLesson, 2);
    const kinds = new Set(exercises.map((e) => e.kind));
    expect(kinds.has('listen')).toBe(true);
    expect(kinds.has('spell')).toBe(true);
    const pool = new Set(phonicsLesson.words.map((w) => w.id));
    for (const exercise of exercises) {
      if (exercise.kind === 'listen' || exercise.kind === 'spell' || exercise.kind === 'sameSound') {
        expect(pool.has(exercise.word.id)).toBe(true);
      }
    }
  });

  it('turns grammar sentences into build and fill-in exercises', () => {
    const exercises = buildLesson(grammarLesson, 4);
    expect(exercises.length).toBeGreaterThan(4);
    const kinds = new Set(exercises.map((e) => e.kind));
    expect(kinds.has('sentence')).toBe(true);
    expect(kinds.has('blank')).toBe(true);
    for (const exercise of exercises) {
      if (exercise.kind === 'sentence') expect(exercise.tiles.join(' ').split(' ').length).toBe(exercise.answer.split(' ').length);
      if (exercise.kind === 'blank') expect(exercise.options).toContain(exercise.answer);
    }
  });
});
