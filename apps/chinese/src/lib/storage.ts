import { CHARACTER_BY_ID, CHARACTER_BY_TEXT, GRADES, UNITS, type Grade, type Term } from '../content';
import { missedCharacters, type Answer, type Question } from '../game';
import { starsFor } from '../../../english/src/game/session';
import { dayKey } from '../../../english/src/lib/storage';

export const KEY = 'bunny-chinese.v1';
export interface Progress {
  v: 1;
  grade: Grade;
  term: Term;
  stars: Record<string, number>;
  studied: string[];
  mistakes: string[];
  days: string[];
  sound: boolean;
}
export const emptyProgress: Progress = {
  v: 1, grade: 1, term: 'upper', stars: {}, studied: [], mistakes: [], days: [], sound: true,
};

/** Local storage is an external boundary: only restore known lessons and characters. */
export function normalize(raw: unknown): Progress {
  if (!raw || typeof raw !== 'object') return { ...emptyProgress };
  const data = raw as Record<string, unknown>;
  const stars: Record<string, number> = {};
  if (data.stars && typeof data.stars === 'object') {
    for (const [id, value] of Object.entries(data.stars)) {
      if (UNITS.some((unit) => unit.id === id) && Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 3) {
        stars[id] = Number(value);
      }
    }
  }
  const studied = Array.isArray(data.studied) ? data.studied.filter((c): c is string => typeof c === 'string' && Object.hasOwn(CHARACTER_BY_TEXT, c)) : [];
  const mistakes = Array.isArray(data.mistakes) ? data.mistakes.flatMap((value) => {
    if (typeof value !== 'string') return [];
    if (Object.hasOwn(CHARACTER_BY_ID, value)) return [value];
    return Object.hasOwn(CHARACTER_BY_TEXT, value) ? [CHARACTER_BY_TEXT[value]!.id] : [];
  }) : [];
  return {
    v: 1,
    grade: GRADES.includes(data.grade as Grade) ? data.grade as Grade : 1,
    term: data.term === 'lower' ? 'lower' : 'upper',
    stars,
    studied: [...new Set(studied)],
    mistakes: [...new Set(mistakes)],
    days: Array.isArray(data.days) ? [...new Set(data.days.filter((day): day is string => typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day)))].slice(-120) : [],
    sound: typeof data.sound === 'boolean' ? data.sound : true,
  };
}

export function loadProgress(): Progress {
  const raw = localStorage.getItem(KEY);
  return normalize(raw === null ? null : JSON.parse(raw));
}

export function saveProgress(progress: Progress): void {
  localStorage.setItem(KEY, JSON.stringify(progress));
}

/** Bank only a finished round. A character leaves the mistake list only after
 * both question types are correct; practising it never lowers a lesson's best stars. */
export function completeRound(progress: Progress, questions: Question[], answers: Answer[], unitId?: string, today = dayKey()): Progress {
  const tested = new Set(questions.map((question) => question.target.id));
  const studied = questions.map((question) => question.target.char);
  const wrong = missedCharacters(questions, answers).map((character) => character.id);
  const stars = starsFor(answers.filter((answer) => answer.correct).length / answers.length);
  return {
    ...progress,
    stars: unitId ? { ...progress.stars, [unitId]: Math.max(progress.stars[unitId] ?? 0, stars) } : progress.stars,
    studied: [...new Set([...progress.studied, ...studied])],
    mistakes: [...progress.mistakes.filter((char) => !tested.has(char)), ...wrong],
    days: [...new Set([...progress.days, today])].slice(-120),
  };
}
