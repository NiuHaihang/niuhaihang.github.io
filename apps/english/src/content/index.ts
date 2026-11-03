import { GRAMMAR_POINTS } from './grammar';
import { PEP_UNITS, PEP_WORDS } from './pep';
import { SOUND_SETS } from './phonics';
import type { Grade, GrammarPoint, SoundSet, Topic, Unit, Word } from './types';

export interface Lesson {
  /** 三上 / 四下 … for textbook units; empty for phonics and grammar. */
  book?: string;
  id: string;
  grade: Grade;
  topic: Topic;
  title: string;
  zh: string;
  ready: boolean;
  words: Word[];
  sentences: string[];
  sound?: SoundSet;
  grammar?: GrammarPoint;
}

const CN_GRADE: Record<number, string> = { 3: '三', 4: '四', 5: '五', 6: '六' };

const wordUnits: Lesson[] = PEP_WORDS.map((u: Unit) => ({
  id: u.id,
  grade: u.grade,
  book: `${CN_GRADE[u.grade] ?? u.grade}${u.term}`,
  topic: 'words',
  title: `U${u.n} ${u.title}`,
  zh: u.zh,
  ready: u.words.length > 0,
  words: u.words,
  sentences: u.words.map((x) => x.sentence).filter((s): s is string => Boolean(s)),
}));

export const PHONICS_UNITS: Lesson[] = SOUND_SETS.map((s) => ({
  id: `phonics-${s.id}`,
  grade: s.grade,
  topic: 'phonics',
  title: s.sound,
  zh: s.zh,
  ready: true,
  words: s.words,
  sentences: [],
  sound: s,
}));

export const GRAMMAR_UNITS: Lesson[] = GRAMMAR_POINTS.map((g) => ({
  id: `grammar-${g.id}`,
  grade: g.grade,
  topic: 'grammar',
  title: g.title,
  zh: g.zh,
  ready: true,
  words: [],
  sentences: g.sentences,
  grammar: g,
}));

export const ALL_LESSONS: Lesson[] = [...wordUnits, ...PHONICS_UNITS, ...GRAMMAR_UNITS];

/** Every example sentence in the course, deduped — used by review + audio. */
export const ALL_SENTENCES: string[] = [
  ...new Set(ALL_LESSONS.flatMap((lesson) => lesson.sentences)),
];

export function lessonsFor(grade: Grade, topic: Topic): Lesson[] {
  if (topic === 'words') {
    return PEP_UNITS.filter((u) => u.grade === grade).map((u) => {
      const id = `g${grade}${u.term === '上' ? 'a' : 'b'}u${u.n}`;
      const found = wordUnits.find((l) => l.id === id);
      return (
        found ?? {
          id,
          grade,
          topic: 'words' as Topic,
          title: `U${u.n} ${u.title}`,
          zh: u.zh,
          ready: false,
          words: [],
          sentences: [],
        }
      );
    });
  }
  const byGrade = (topic === 'phonics' ? PHONICS_UNITS : GRAMMAR_UNITS).filter((l) => l.grade === grade);
  return byGrade;
}

export function lessonById(id: string): Lesson | undefined {
  return ALL_LESSONS.find((l) => l.id === id) ?? undefined;
}

/** Every word the app knows, used to build plausible distractors. */
// Keyed by English spelling: one word can appear in two units, and review
// memory is stored as `w:<english>`.
export const ALL_WORDS: Word[] = [
  ...new Map(ALL_LESSONS.flatMap((l) => l.words).map((w) => [w.en, w])).values(),
];
