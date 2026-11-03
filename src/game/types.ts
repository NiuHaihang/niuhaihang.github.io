export type Op = '+' | '-';

/** Which slot of the equation the child has to fill in. */
export type Blank = 'answer' | 'a' | 'b';

export type SkillId =
  | 'add10'
  | 'addBridge'
  | 'sub10'
  | 'subCross'
  | 'add2d1d'
  | 'add2d1dCarry'
  | 'sub2d1d'
  | 'sub2d1dBorrow'
  | 'add2d2d'
  | 'add2d2dCarry'
  | 'sub2d2d'
  | 'sub2d2dBorrow'
  | 'missing'
  | 'stretch3d'
  | 'stretch100';

export type LevelId = 'sprout' | 'blossom' | 'sparkle' | 'starlight';

export interface Item {
  id: string;
  skill: SkillId;
  a: number;
  b: number;
  op: Op;
  /** a op b, shown as the known total when a slot is blank. */
  total: number;
  /** The number the child has to type. */
  answer: number;
  blank: Blank;
  /** 0..100, higher is harder. */
  difficulty: number;
}

export interface AnswerRecord {
  itemId: string;
  skill: SkillId;
  difficulty: number;
  typed: string;
  correct: boolean;
  ms: number;
}

export interface Round {
  items: Item[];
  level: LevelId;
  seed: number;
}

export interface RawItem {
  a: number;
  b: number;
  op: Op;
  blank: Blank;
}
