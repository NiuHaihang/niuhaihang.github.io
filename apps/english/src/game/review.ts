import { ALL_SENTENCES, ALL_WORDS } from '../content';
import type { Word } from '../content/types';
import type { MemoryEntry } from '../lib/storage';
import { makeRng, shuffle } from './rng';
import type { Exercise } from './exercise';
import { choice, listen, sentence, spell } from './exercise';

/** Days until the next sighting, by number of successful reps. */
export const INTERVALS = [1, 3, 7, 16];

export const REVIEW_SIZE = 12;

export function addDays(day: string, days: number): string {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  const date = new Date(y, m - 1, d + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function intervalFor(n: number): number {
  return INTERVALS[Math.min(INTERVALS.length - 1, Math.max(0, n))] as number;
}

/** Which entry key an exercise belongs to, or null for ones we do not track. */
export function keyFor(exercise: Exercise): string | null {
  switch (exercise.kind) {
    case 'picture':
    case 'listen':
    case 'spell':
    case 'choice':
    case 'sameSound':
      return `w:${exercise.word.en}`;
    case 'sentence':
      return `s:${exercise.sentence}`;
    default:
      return null;
  }
}

export function record(
  memory: Record<string, MemoryEntry>,
  key: string,
  correct: boolean,
  today: string,
): Record<string, MemoryEntry> {
  const seen = memory[key]?.n ?? 0;
  // A miss steps back one box (never below 0) and comes back tomorrow.
  const n = correct ? Math.min(INTERVALS.length, seen + 1) : Math.max(0, seen - 1);
  // The gap is read from the box the item just reached, so 1 → 3 → 7 → 16 days.
  const due = addDays(today, correct ? intervalFor(seen) : 1);
  return { ...memory, [key]: { n, due } };
}

export function dueKeys(memory: Record<string, MemoryEntry>, today: string): string[] {
  return Object.entries(memory)
    .filter(([, entry]) => entry.due <= today)
    .sort((a, b) => (a[1].due < b[1].due ? -1 : a[1].due > b[1].due ? 1 : 0))
    .map(([key]) => key);
}

export function dueCount(memory: Record<string, MemoryEntry>, today: string): number {
  return dueKeys(memory, today).length;
}

const WORD_BY_EN = new Map(ALL_WORDS.map((w) => [w.en, w] as const));
const SENTENCE_SET = new Set(ALL_SENTENCES);

function resolve(keys: string[]): { words: Word[]; sentences: string[] } {
  const words: Word[] = [];
  const sentences: string[] = [];
  for (const key of keys) {
    if (key.startsWith('w:')) {
      const word = WORD_BY_EN.get(key.slice(2));
      if (word) words.push(word);
    } else if (key.startsWith('s:')) {
      const text = key.slice(2);
      if (SENTENCE_SET.has(text)) sentences.push(text);
    }
  }
  return { words, sentences };
}

/**
 * Build a review round from whatever is due: a word drill when the queue is
 * full of words, a sentence drill when it is grammar that came back.
 */
export function buildReview(memory: Record<string, MemoryEntry>, today: string, seed: number): Exercise[] {
  const rng = makeRng(seed);
  const due = dueKeys(memory, today);
  const { words, sentences } = resolve(due);
  const out: Exercise[] = [];

  // Keep both flavours when both are due, so grammar does not get buried.
  const wordQuota = sentences.length > 0 ? Math.max(6, REVIEW_SIZE - Math.min(6, sentences.length)) : REVIEW_SIZE;
  const pool = words.length >= 4 ? words : ALL_WORDS;

  for (const word of shuffle(rng, words).slice(0, wordQuota)) {
    const roll = rng();
    if (roll < 0.34) out.push(listen(rng, word, pool));
    else if (roll < 0.67) out.push(choice(rng, word, pool, 'zh2en'));
    else out.push(spell(rng, word));
  }

  for (const text of shuffle(rng, sentences).slice(0, Math.min(6, sentences.length))) {
    out.push(sentence(rng, text));
  }

  if (out.length === 0) {
    // Nothing due: a light mixed round over everything already met.
    const met = Object.keys(memory)
      .filter((key) => key.startsWith('w:'))
      .map((key) => WORD_BY_EN.get(key.slice(2)))
      .filter((w): w is Word => Boolean(w));
    const pool2 = met.length >= 4 ? met : ALL_WORDS;
    for (const word of shuffle(rng, pool2).slice(0, 6)) out.push(choice(rng, word, pool2, 'zh2en'));
  }

  return out.slice(0, REVIEW_SIZE);
}
