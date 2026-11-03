import { ALL_WORDS, type Lesson } from '../content';
import type { Word } from '../content/types';
import { makeRng, shuffle, type Rng } from './rng';

export type Exercise =
  | { kind: 'picture'; id: string; word: Word; options: string[]; answer: string }
  | { kind: 'listen'; id: string; word: Word; options: Word[]; answer: string }
  | { kind: 'spell'; id: string; word: Word; letters: string[]; answer: string }
  | { kind: 'choice'; id: string; word: Word; options: string[]; answer: string; mode: 'zh2en' | 'en2zh' }
  | { kind: 'sentence'; id: string; sentence: string; tiles: string[]; answer: string }
  | { kind: 'blank'; id: string; sentence: string; options: string[]; answer: string }
  | { kind: 'sameSound'; id: string; word: Word; options: Word[]; answer: string }
  | { kind: 'match'; id: string; pairs: { word: Word; zh: string }[] };

export const LESSON_SIZE = 12;

function uniqueWords(rng: Rng, pool: Word[], exclude: string[], count: number): Word[] {
  const seen = new Set(exclude);
  const out: Word[] = [];
  for (const word of shuffle(rng, pool)) {
    if (seen.has(word.id)) continue;
    seen.add(word.id);
    out.push(word);
    if (out.length === count) break;
  }
  return out;
}

function optionsEn(rng: Rng, word: Word, pool: Word[]): string[] {
  const others = uniqueWords(rng, pool, [word.id], 3).map((w) => w.en);
  return shuffle(rng, [word.en, ...others]);
}

function optionsWord(rng: Rng, word: Word, pool: Word[]): Word[] {
  const others = uniqueWords(rng, pool, [word.id], 3);
  return shuffle(rng, [word, ...others]);
}

export function picture(rng: Rng, word: Word, pool: Word[]): Exercise {
  return { kind: 'picture', id: `pic-${word.id}-${Math.floor(rng() * 1e6)}`, word, options: optionsEn(rng, word, pool), answer: word.en };
}

export function listen(rng: Rng, word: Word, pool: Word[]): Exercise {
  return { kind: 'listen', id: `lis-${word.id}-${Math.floor(rng() * 1e6)}`, word, options: optionsWord(rng, word, pool), answer: word.id };
}

export function spell(rng: Rng, word: Word): Exercise {
  const letters = shuffle(rng, word.en.replace(/[^a-z]/gi, '').split(''));
  return { kind: 'spell', id: `spk-${word.id}-${Math.floor(rng() * 1e6)}`, word, letters, answer: word.en };
}

export function choice(rng: Rng, word: Word, pool: Word[], mode: 'zh2en' | 'en2zh'): Exercise {
  const options =
    mode === 'zh2en'
      ? optionsEn(rng, word, pool)
      : shuffle(rng, [word.zh, ...uniqueWords(rng, pool, [word.id], 3).map((w) => w.zh)]);
  return {
    kind: 'choice',
    id: `chc-${word.id}-${mode}-${Math.floor(rng() * 1e6)}`,
    word,
    options,
    answer: mode === 'zh2en' ? word.en : word.zh,
    mode,
  };
}

export function sentence(rng: Rng, text: string): Exercise {
  const tiles = shuffle(rng, text.split(' '));
  return { kind: 'sentence', id: `sen-${Math.floor(rng() * 1e6)}`, sentence: text, tiles, answer: text };
}

const BE = ['am', 'is', 'are'];

function blanks(rng: Rng, text: string): Exercise[] {
  const out: Exercise[] = [];
  const words = text.split(' ');
  words.forEach((token, i) => {
    const bare = token.replace(/[.,!?]$/, '');
    if (!BE.includes(bare)) return;
    const shown = [...words.slice(0, i), '___', ...words.slice(i + 1)].join(' ');
    out.push({
      kind: 'blank',
      id: `blk-${i}-${Math.floor(rng() * 1e6)}`,
      sentence: shown,
      options: shuffle(rng, BE),
      answer: bare,
    });
  });
  return out;
}

function sameSound(rng: Rng, word: Word, pool: Word[]): Exercise {
  const same = uniqueWords(rng, pool, [word.id], 1)[0] ?? word;
  const otherSets = ALL_WORDS.filter((w) => w.id.startsWith('ph-') && !pool.some((p) => p.id === w.id));
  const others = uniqueWords(rng, otherSets, [word.id, same.id], 2);
  return {
    kind: 'sameSound',
    id: `snd-${word.id}-${Math.floor(rng() * 1e6)}`,
    word,
    options: shuffle(rng, [same, ...others]),
    answer: same.id,
  };
}

function match(rng: Rng, pool: Word[]): Exercise {
  const four = shuffle(rng, pool).slice(0, 4);
  return {
    kind: 'match',
    id: `mat-${Math.floor(rng() * 1e6)}`,
    pairs: shuffle(rng, four.map((word) => ({ word, zh: word.zh }))),
  };
}

/** Build one lesson: a fixed mixed drill, not a random soup. */
export function buildLesson(lesson: Lesson, seed: number): Exercise[] {
  const rng = makeRng(seed);
  const pool = lesson.words.length > 0 ? lesson.words : ALL_WORDS;
  const withEmoji = pool.filter((w) => w.emoji);

  if (lesson.topic === 'phonics' && lesson.sound) {
    const words = shuffle(rng, lesson.words);
    const out: Exercise[] = [];
    for (const word of words.slice(0, 4)) out.push(listen(rng, word, pool));
    for (const word of words.slice(0, 3)) out.push(spell(rng, word));
    out.push(sameSound(rng, words[0] as Word, pool));
    out.push(sameSound(rng, words[1] as Word, pool));
    out.push(listen(rng, words[4] ?? (words[0] as Word), pool));
    return out;
  }

  if (lesson.topic === 'grammar') {
    const out: Exercise[] = [];
    const sentences = lesson.sentences.slice(0, 6);
    for (const text of sentences) out.push(sentence(rng, text));
    for (const text of lesson.sentences) out.push(...blanks(rng, text));
    return out.slice(0, LESSON_SIZE);
  }

  const words = shuffle(rng, withEmoji.length >= 6 ? withEmoji : pool);
  const out: Exercise[] = [];
  const kinds = ['picture', 'listen', 'spell', 'picture', 'listen', 'spell'] as const;
  kinds.forEach((kind, i) => {
    const word = words[i % words.length] as Word;
    if (kind === 'picture') out.push(picture(rng, word, pool));
    else if (kind === 'listen') out.push(listen(rng, word, pool));
    else out.push(spell(rng, word));
  });
  out.push(choice(rng, words[0] as Word, pool, 'zh2en'));
  out.push(choice(rng, words[1] as Word, pool, 'en2zh'));
  if (withEmoji.length >= 4) out.push(match(rng, withEmoji));
  for (const text of lesson.sentences.slice(0, 3)) out.push(sentence(rng, text));
  // Sentences are optional in a unit: top up to a full lesson with one more recall.
  while (out.length < LESSON_SIZE) {
    const word = words[out.length % words.length] as Word;
    out.push(choice(rng, word, pool, out.length % 2 === 0 ? 'zh2en' : 'en2zh'));
  }
  return out.slice(0, LESSON_SIZE);
}

export function isCorrect(exercise: Exercise, value: string): boolean {
  switch (exercise.kind) {
    case 'picture':
    case 'choice':
      return value === exercise.answer;
    case 'listen':
    case 'sameSound':
      return value === exercise.answer;
    case 'spell':
    case 'sentence':
      return value.trim().replace(/\s+/g, ' ') === exercise.answer;
    case 'blank':
      return value === exercise.answer;
    case 'match':
      return false;
  }
}
