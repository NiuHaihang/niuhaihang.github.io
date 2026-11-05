import { describe, expect, it } from 'vitest';
import { GRADES, POEMS, POEM_BY_ID, verseText } from './content';
import { buildRound, isCorrect } from './game';
import { completeRound, normalize } from './lib/storage';

describe('primary poetry bank', () => {
  it('covers all 75 curriculum entries, two extensions, and all six suggested grades', () => {
    expect(POEMS).toHaveLength(77);
    expect(POEMS.filter((poem) => poem.core).map((poem) => poem.order)).toEqual(Array.from({ length: 75 }, (_, i) => i + 1));
    expect(new Set(POEMS.map((poem) => poem.id)).size).toBe(77);
    for (const grade of GRADES) expect(POEMS.some((poem) => poem.grade === grade)).toBe(true);
    for (const poem of POEMS) {
      expect(new Set(poem.lines.map((line) => verseText(line.text))).size).toBe(poem.lines.length);
      for (const line of poem.lines) {
        expect(line.pinyin).toHaveLength([...line.text].length);
        for (let index = 0; index < line.text.length - 1; index += 1) expect(line.pinyin[index]).toMatch(/^[a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+$/);
      }
    }
  });

  it('distinguishes same-title poems and explicitly marks excerpts and archaic readings', () => {
    expect(POEM_BY_ID['poem-18']!.title).toContain('节选');
    expect(POEM_BY_ID['poem-18']!.lines).toHaveLength(4);
    expect(POEM_BY_ID['poem-25']!.title).not.toBe(POEM_BY_ID['poem-27']!.title);
    for (const [id, word, sound] of [['poem-03', '见', 'xiàn'], ['poem-07', '衰', 'shuāi'], ['poem-32', '单', 'chán'], ['poem-61', '供', 'gòng'], ['poem-76', '亡', 'wú'], ['poem-77', '见', 'xiàn']]) {
      const line = POEM_BY_ID[id!]!.lines.find((verse) => verse.text.includes(word!))!;
      expect(line.pinyin[line.text.indexOf(word!)]).toBe(sound);
    }
  });
});

describe('poetry rounds and saved progress', () => {
  it('offers unique choices with one correct answer, and tests the whole poem in order', () => {
    for (const poem of POEMS) {
      const questions = buildRound(poem, 42);
      expect(questions).toEqual(buildRound(poem, 42));
      expect(questions).toHaveLength(poem.lines.length + 2);
      for (const question of questions) {
        expect(new Set(question.options).size).toBe(question.options.length);
        expect(isCorrect(question, question.answer)).toBe(true);
        if (question.kind === 'order') {
          expect(isCorrect(question, question.options)).toBe(false);
          expect(isCorrect(question, question.answer.slice(0, -1))).toBe(false);
          expect(question.answer).toEqual(poem.lines.map((line) => verseText(line.text)));
        } else {
          expect(question.options.filter((option) => isCorrect(question, option))).toHaveLength(1);
          if (question.kind === 'blank') expect(poem.lines.some((line) => verseText(line.text) === question.prompt.replace('□', question.answer))).toBe(true);
        }
      }
    }
  });

  it('restores only valid poem progress and never lowers a previous best', () => {
    const empty = normalize(null);
    expect(empty).toEqual({ grade: 1, sound: true, stars: {} });
    expect(normalize({ grade: 9, stars: { 'poem-04': 3, unknown: 3, 'poem-05': 9 } }).stars).toEqual({ 'poem-04': 3 });
    const completed = completeRound(empty, 'poem-04', 5, 5);
    expect(empty.stars).toEqual({});
    expect(completed.stars['poem-04']).toBe(3);
    expect(completeRound(completed, 'poem-04', 0, 5).stars['poem-04']).toBe(3);
    expect(normalize({ ...completed, grade: 0, sound: false })).toEqual({ ...completed, grade: 0, sound: false });
  });
});
