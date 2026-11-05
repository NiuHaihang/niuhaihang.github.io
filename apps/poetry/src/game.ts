import { POEMS, verseText, type Poem } from './content';
import { makeRng, shuffle } from '../../english/src/game/rng';

export type Question =
  | { kind: 'meaning'; prompt: string; answer: string; options: string[] }
  | { kind: 'next' | 'blank'; prompt: string; answer: string; options: string[] }
  | { kind: 'order'; prompt: string; answer: string[]; options: string[] };

/** Each round checks meaning, a missing character, every next verse, and order.
 * Distractor meanings come from other themes; verse options never repeat. */
export function buildRound(poem: Poem, seed: number): Question[] {
  const rng = makeRng(seed);
  const meanings = shuffle(rng, POEMS.filter((other) => other.theme !== poem.theme))
    .slice(0, 2).map((other) => other.meaning);
  const lines = poem.lines.map((line) => verseText(line.text));
  const questions: Question[] = [{
    kind: 'meaning', prompt: '这首诗词描绘了什么？', answer: poem.meaning,
    options: shuffle(rng, [poem.meaning, ...meanings]),
  }];
  const verse = lines[Math.floor(rng() * lines.length)]!;
  const answer = verse.at(-1)!;
  const characters = [...new Set(POEMS.flatMap((other) => other.lines.flatMap((line) => [...verseText(line.text)])))];
  questions.push({
    kind: 'blank', prompt: `${verse.slice(0, -1)}□`, answer,
    options: shuffle(rng, [answer, ...shuffle(rng, characters.filter((character) => character !== answer)).slice(0, 2)]),
  });
  for (let index = 1; index < lines.length; index += 1) {
    const answer = lines[index]!;
    const distractors = shuffle(rng, [...new Set(POEMS.filter((other) => other.id !== poem.id)
      .flatMap((other) => other.lines.map((line) => verseText(line.text))))]
      .filter((line) => !lines.includes(line))).slice(0, 2);
    questions.push({ kind: 'next', prompt: lines[index - 1]!, answer, options: shuffle(rng, [answer, ...distractors]) });
  }
  // Rotating a shuffled list guarantees that a fresh ordering task is unsolved.
  let order = shuffle(rng, lines);
  if (order.every((line, index) => line === lines[index])) order = [...order.slice(1), order[0]!];
  questions.push({ kind: 'order', prompt: '按顺序点诗句，把整首诗排好。', answer: lines, options: order });
  return questions;
}

export function isCorrect(question: Question, choice: string | string[]): boolean {
  return question.kind === 'order'
    ? Array.isArray(choice) && choice.length === question.answer.length && choice.every((line, index) => line === question.answer[index])
    : choice === question.answer;
}
