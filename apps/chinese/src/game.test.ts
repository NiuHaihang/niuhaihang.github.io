import { describe, expect, it } from 'vitest';
import { BOOKS, CHARACTERS, GRADES, UNITS } from './content';
import { buildRound, missedCharacters } from './game';

// Counts include the blue alternative readings, which the printed new-character totals exclude.
const counts = [284, 419, 485, 465, 277, 275, 265, 269, 209, 212, 180, 120];
const newCounts = [280, 410, 460, 450, 250, 250, 250, 250, 200, 200, 180, 120];

describe('PEP textbook character banks', () => {
  it('covers both terms of every grade and preserves every entry when grouping short sessions', () => {
    expect(BOOKS).toHaveLength(12);
    expect(BOOKS.map((book) => book.characters.length)).toEqual(counts);
    expect(BOOKS.map((book) => book.newCharacters)).toEqual(newCounts);
    for (const grade of GRADES) {
      expect(BOOKS.filter((book) => book.grade === grade).map((book) => book.term)).toEqual(['upper', 'lower']);
    }
    expect(new Set(UNITS.map((unit) => unit.id)).size).toBe(UNITS.length);
    for (const book of BOOKS) {
      const units = UNITS.filter((unit) => unit.bookId === book.id);
      expect(units.flatMap((unit) => unit.characters)).toEqual(book.characters);
      expect(new Set(book.characters.map((character) => character.id)).size).toBe(book.characters.length);
      expect(book.list).toBe(book.grade === 6 ? '写字表' : '识字表');
      expect(book.pages).not.toBe('');
      for (const unit of units) {
        expect(unit.characters.length).toBeGreaterThan(0);
        expect(unit.characters.length).toBeLessThanOrEqual(6);
      }
    }
    for (const character of CHARACTERS) {
      expect(character.char).toMatch(/^[\u4e00-\u9fff]$/u);
      expect(character.pinyin).toMatch(/^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+$/u);
      expect(character.word).toContain(character.char);
      if (character.sentence) expect(character.sentence).toContain(character.word);
    }
  });

  it('includes revised content and keeps alternative readings distinct', () => {
    expect(BOOKS[0]!.characters.slice(0, 6).map((c) => c.char).join('')).toBe('天地人你我他');
    expect(BOOKS[0]!.characters.slice(-6).map((c) => c.char).join('')).toBe('牛羊爪元拼音');
    expect(BOOKS[2]!.characters.map((c) => c.char).join('')).toContain('虹浇壶提洒挑镜拿系荡裙');
    expect(BOOKS[11]!.characters.slice(0, 5).map((c) => c.char).join('')).toBe('醋饺摊拌筹');
    expect(BOOKS[0]!.characters.filter((c) => c.char === '长').map((c) => c.id)).toEqual(['长:cháng', '长:zhǎng']);
    expect(BOOKS[6]!.characters.find((c) => c.char === '吁')!.pinyin).toBe('yū');
    expect(BOOKS[8]!.characters.find((c) => c.char === '辰')!.word).toBe('时辰');
    // These readings need distinct words so their recordings teach the right sound.
    for (const [id, word] of [['鲜:xiǎn', '鲜有'], ['单:chán', '单于'], ['落:là', '丢三落四']]) {
      expect(CHARACTERS.find((character) => character.id === id)!.word).toBe(word);
    }
  });
});

describe('recognition rounds', () => {
  it('is reproducible and tests each reading through sound and word recognition, including short final groups', () => {
    for (const book of BOOKS) {
      const unit = UNITS.filter((unit) => unit.bookId === book.id).at(-1)!;
      const round = buildRound(unit.characters, 42);
      expect(round).toEqual(buildRound(unit.characters, 42));
      expect(round).toHaveLength(unit.characters.length * 2);
      expect(new Set(round.map((question) => question.id)).size).toBe(round.length);
      for (const character of unit.characters) {
        expect(round.filter((q) => q.target.id === character.id).map((q) => q.kind)).toEqual(['listen', 'word']);
      }
    }
  });

  it('offers one valid answer without repeated glyphs, homophones or other characters in the spoken word', () => {
    for (const unit of UNITS) {
      for (const question of buildRound(unit.characters, 7)) {
        expect(question.options).toHaveLength(4);
        expect(new Set(question.options).size).toBe(4);
        expect(question.options).toContain(question.target.char);
        for (const char of question.options.filter((option) => option !== question.target.char)) {
          expect(CHARACTERS.some((c) => c.char === char && c.grade === unit.grade)).toBe(true);
          expect(CHARACTERS.some((c) => c.char === char && c.pinyin === question.target.pinyin)).toBe(false);
          expect(question.target.word).not.toContain(char);
        }
      }
    }
  });

  it('keeps different readings of a missed polyphonic character as separate review cards', () => {
    const readings = BOOKS[0]!.characters.filter((c) => c.char === '长');
    const questions = buildRound(readings, 42);
    const answers = questions.map((q) => ({ questionId: q.id, choice: '', correct: false }));
    expect(missedCharacters(questions, answers).map((c) => c.id).sort()).toEqual(['长:cháng', '长:zhǎng'].sort());
  });
});
