import { describe, expect, it } from 'vitest';
import { CHARACTER_BY_ID, UNITS } from '../content';
import { buildRound } from '../game';
import { completeRound, emptyProgress, normalize } from './storage';

describe('Chinese progress', () => {
  const unit = UNITS[0]!;
  const questions = buildRound(unit.characters, 42);
  const perfect = questions.map((question) => ({ questionId: question.id, choice: question.target.char, correct: true }));

  it('banks only this lesson, retains the best score and records unique practice days and characters', () => {
    const first = completeRound(emptyProgress, questions, perfect, unit.id, '2026-11-04');
    const second = completeRound(first, questions, perfect.map((answer) => ({ ...answer, correct: false })), unit.id, '2026-11-04');
    expect(second.stars).toEqual({ [unit.id]: 3 });
    expect(second.studied).toHaveLength(6);
    expect(second.days).toEqual(['2026-11-04']);
    expect(second.mistakes).toHaveLength(6);
  });

  it('clears only the tested reading and retains other readings of the same glyph', () => {
    const questions = buildRound([CHARACTER_BY_ID['长:cháng']!], 42);
    const perfect = questions.map((q) => ({ questionId: q.id, choice: q.target.char, correct: true }));
    const progress = { ...emptyProgress, grade: 6 as const, term: 'lower' as const, mistakes: ['长:cháng', '长:zhǎng', '月:yuè'] };
    const answers = perfect.map((answer, index) => index === 0 ? { ...answer, correct: false } : answer);
    const result = completeRound(progress, questions, answers);
    expect(result.mistakes).toEqual(['长:zhǎng', '月:yuè', '长:cháng']);
    expect(result.stars).toEqual({});
    expect(result.grade).toBe(6);
    expect(result.term).toBe('lower');
    expect(completeRound(result, questions, perfect).mistakes).toEqual(['长:zhǎng', '月:yuè']);
  });

  it('restores only valid external storage values without importing another subject’s progress', () => {
    expect(normalize(null)).toEqual(emptyProgress);
    expect(normalize({ grade: 9, stars: { [unit.id]: 3, unknown: 3, 'g1-body': 7 }, studied: ['日', '日', 'unknown'], mistakes: ['月', null, '__proto__'], days: ['2026-11-04', 'bad', '2026-11-04'], sound: false })).toEqual({
      ...emptyProgress, stars: { [unit.id]: 3 }, studied: ['日'], mistakes: ['月:yuè'], days: ['2026-11-04'], sound: false,
    });
  });

  it('migrates legacy glyph mistakes, preserves studied characters and restores the selected term', () => {
    const progress = normalize({ grade: 3, term: 'lower', studied: ['长', '日'], mistakes: ['长', '长:zhǎng'], stars: { 'g1-nature': 3 } });
    expect(progress).toMatchObject({ grade: 3, term: 'lower', studied: ['长', '日'], mistakes: ['长:cháng', '长:zhǎng'], stars: {} });
    expect(normalize({ term: 'invalid' }).term).toBe('upper');
  });
});
