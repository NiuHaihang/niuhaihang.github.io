import textbooks from './data/textbooks.json';

export const GRADES = [1, 2, 3, 4, 5, 6] as const;
export type Grade = (typeof GRADES)[number];
export type Term = 'upper' | 'lower';

export interface Character {
  /** A reading, rather than a glyph, is the unit of mistake review. */
  id: string;
  char: string;
  pinyin: string;
  word: string;
  sentence: string;
  grade: Grade;
}

export interface Unit {
  id: string;
  bookId: string;
  grade: Grade;
  title: string;
  icon: string;
  characters: Character[];
}

export interface Book {
  id: string;
  grade: Grade;
  term: Term;
  edition: string;
  source: string;
  pages: string;
  list: string;
  newCharacters: number;
  characters: Character[];
}

// Keep source order and all textbook readings, including the blue polyphonic entries.
// Groups are short practice sessions, not textbook lessons.
export const BOOKS: Book[] = textbooks.map((book) => ({
  ...book,
  grade: book.grade as Grade,
  term: book.term as Term,
  characters: book.entries.map(([char, pinyin, word, sentence]) => ({
    id: `${char}:${pinyin}`, char: char!, pinyin: pinyin!, word: word!, sentence: sentence!, grade: book.grade as Grade,
  })),
}));

export const UNITS: Unit[] = BOOKS.flatMap((book) =>
  Array.from({ length: Math.ceil(book.characters.length / 6) }, (_, index) => ({
    id: `${book.id}-${index + 1}`,
    bookId: book.id,
    grade: book.grade,
    title: `第 ${index + 1} 组`,
    icon: ['🌱', '🌷', '🌳', '🌻'][index % 4]!,
    characters: book.characters.slice(index * 6, index * 6 + 6),
  })),
);
export const CHARACTERS = BOOKS.flatMap((book) => book.characters);
export const CHARACTER_BY_ID = Object.fromEntries([...CHARACTERS].reverse().map((character) => [character.id, character])) as Record<string, Character>;
// Old progress stored glyphs. Use the first taught reading only when migrating it.
export const CHARACTER_BY_TEXT = Object.fromEntries([...CHARACTERS].reverse().map((character) => [character.char, character])) as Record<string, Character>;
