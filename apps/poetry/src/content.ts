import bank from './data/poems.json';

export const GRADES = [1, 2, 3, 4, 5, 6] as const;
export type Grade = 0 | (typeof GRADES)[number];
export interface Poem {
  id: string;
  order: number;
  grade: number;
  title: string;
  author: string;
  era: string;
  theme: string;
  core: boolean;
  meaning: string;
  lines: { text: string; pinyin: string[] }[];
}
export const POEMS: Poem[] = bank;
export const POEM_BY_ID = Object.fromEntries(POEMS.map((poem) => [poem.id, poem]));

/** Compare words rather than punctuation; verses have different final marks. */
export function verseText(text: string): string {
  return text.replace(/[，。！？]/g, '');
}
