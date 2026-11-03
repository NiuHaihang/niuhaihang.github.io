/** Shared content shapes for the English app. */

export type Grade = 3 | 4 | 5 | 6;
export type Topic = 'words' | 'phonics' | 'grammar';
export type Term = '上' | '下';

export interface Word {
  /** Stable id, also the audio file name. */
  id: string;
  en: string;
  zh: string;
  /** Only set when a single emoji really shows the word. */
  emoji?: string;
  /** Example sentence used by the sentence exercise. */
  sentence?: string;
}

export interface Unit {
  id: string;
  grade: Grade;
  term: Term;
  /** PEP unit number, 1–6. */
  n: number;
  title: string;
  zh: string;
  words: Word[];
}

export interface SoundSet {
  id: string;
  grade: Grade;
  /** The sound taught, e.g. /æ/. */
  sound: string;
  /** What to call it in Chinese. */
  zh: string;
  words: Word[];
}

export interface GrammarPoint {
  id: string;
  grade: Grade;
  title: string;
  zh: string;
  sentences: string[];
}

export interface LessonRef {
  id: string;
  grade: Grade;
  topic: Topic;
  title: string;
  zh: string;
  /** False when the unit exists but its content has not been written yet. */
  ready: boolean;
}
