import { describe, expect, it } from 'vitest';
import { ALL_LESSONS, ALL_SENTENCES, ALL_WORDS, GRAMMAR_UNITS, PHONICS_UNITS, lessonsFor } from './index';
import { PEP_UNITS, PEP_WORDS } from './pep';

describe('PEP content', () => {
  it('lists the eight PEP books (六下 has four units, the rest six)', () => {
    expect(PEP_UNITS).toHaveLength(46);
    const books = new Set(PEP_UNITS.map((u) => `${u.grade}${u.term}`));
    expect(books.size).toBe(8);
  });

  it('gives every filled unit real words', () => {
    const filled = PEP_WORDS.filter((u) => u.words.length > 0);
    expect(filled.length).toBeGreaterThanOrEqual(12);
    for (const unit of filled) {
      for (const word of unit.words) {
        expect(word.id).toBeTruthy();
        expect(word.en.trim()).toBe(word.en);
        expect(word.en).not.toBe('');
        expect(word.zh).not.toBe('');
        expect(word.emoji, `${unit.id} ${word.en} needs a picture`).toBeTruthy();
        expect(word.sentence, `${unit.id} ${word.en} needs a sentence`).toBeTruthy();
      }
    }
  });

  it('never reuses a word id inside a unit', () => {
    for (const unit of PEP_WORDS) {
      const ids = unit.words.map((w) => w.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('keeps every lesson well formed', () => {
    for (const lesson of ALL_LESSONS) {
      expect([3, 4, 5, 6]).toContain(lesson.grade);
      expect(lesson.title).not.toBe('');
      if (lesson.ready) expect(lesson.words.length + lesson.sentences.length).toBeGreaterThan(0);
    }
  });

  it('has phonics and grammar in every grade', () => {
    for (const grade of [3, 4, 5, 6] as const) {
      expect(PHONICS_UNITS.some((u) => u.grade === grade), `phonics grade ${grade}`).toBe(true);
      expect(GRAMMAR_UNITS.some((u) => u.grade === grade), `grammar grade ${grade}`).toBe(true);
    }
  });

  it('filters the lesson list by grade and topic', () => {
    for (const grade of [3, 4, 5, 6] as const) {
      const words = lessonsFor(grade, 'words');
      expect(words.every((l) => l.grade === grade)).toBe(true);
      expect(words.length).toBeGreaterThan(0);
      const phonics = lessonsFor(grade, 'phonics');
      expect(phonics.every((l) => l.grade === grade)).toBe(true);
      expect(phonics.length).toBeGreaterThan(0);
      const grammar = lessonsFor(grade, 'grammar');
      expect(grammar.every((l) => l.grade === grade)).toBe(true);
      expect(grammar.length).toBeGreaterThan(0);
    }
  });

  it('dedupes words and sentences for review', () => {
    expect(new Set(ALL_WORDS.map((w) => w.en)).size).toBe(ALL_WORDS.length);
    expect(new Set(ALL_SENTENCES).size).toBe(ALL_SENTENCES.length);
  });
});
