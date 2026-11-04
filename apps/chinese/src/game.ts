import { CHARACTERS, type Character } from './content';
import { makeRng, shuffle } from '../../english/src/game/rng';

export interface Question {
  id: string;
  kind: 'listen' | 'word';
  target: Character;
  options: string[];
}

export interface Answer {
  questionId: string;
  choice: string;
  correct: boolean;
}

/** First recognise the sound, then recognise the character in a word. */
export function buildRound(characters: Character[], seed: number): Question[] {
  const rng = makeRng(seed);
  return (['listen', 'word'] as const).flatMap((kind) =>
    shuffle(rng, characters).map((target) => {
      // Same-grade distractors keep the difficulty appropriate. Excluding homophones
      // and other characters in the spoken word makes listening questions unambiguous.
      const candidates = CHARACTERS.filter((candidate) => candidate.grade === target.grade
        && candidate.char !== target.char && candidate.pinyin !== target.pinyin && !target.word.includes(candidate.char));
      // A glyph can occur in several books. Offer each distractor only once.
      const homophones = new Set(CHARACTERS.filter((candidate) => candidate.pinyin === target.pinyin).map((candidate) => candidate.char));
      const pool = [...new Map(candidates.filter((candidate) => !homophones.has(candidate.char))
        .map((candidate) => [candidate.char, candidate])).values()];
      return {
        id: `${kind}-${target.id}`,
        kind,
        target,
        options: shuffle(rng, [target.char, ...shuffle(rng, pool).slice(0, 3).map((candidate) => candidate.char)]),
      };
    }),
  );
}

export function missedCharacters(questions: Question[], answers: Answer[]): Character[] {
  const missed = new Set(answers.filter((answer) => !answer.correct).map((answer) => answer.questionId));
  return [...new Map(questions.filter((question) => missed.has(question.id))
    .map((question) => [question.target.id, question.target])).values()];
}
