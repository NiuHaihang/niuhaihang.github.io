import type { LevelId, SkillId } from './types';

export type Accent = 'mint' | 'blush' | 'lilac' | 'butter';

export interface Level {
  id: LevelId;
  accent: Accent;
  skills: SkillId[];
  /**
   * Difficulty floor for randomly generated rounds (0–100). A tier's easiest
   * skills can produce babyish warm-ups ("4 + 2" for an eight-year-old), so
   * every garden declares how easy a round is allowed to get. Practice rounds
   * ignore it — practising an easy skill is the whole point.
   */
  floor: number;
}

/**
 * Curriculum-shaped tiers. Each tier is a set of skills, and the generator
 * ramps difficulty *inside* that set, so a round always contains problems the
 * tier is about (no surprise three-digit subtraction in Sprout).
 */
export const LEVELS: Level[] = [
  {
    id: 'sprout',
    accent: 'mint',
    skills: ['add10', 'addBridge', 'sub10', 'subCross'],
    floor: 10,
  },
  {
    id: 'blossom',
    accent: 'blush',
    skills: [
      'addBridge',
      'subCross',
      'add2d1d',
      'add2d1dCarry',
      'sub2d1d',
      'sub2d1dBorrow',
    ],
    floor: 24,
  },
  {
    id: 'sparkle',
    accent: 'lilac',
    skills: [
      'add2d1dCarry',
      'sub2d1dBorrow',
      'add2d2d',
      'add2d2dCarry',
      'sub2d2d',
      'sub2d2dBorrow',
      'missing',
    ],
    floor: 38,
  },
  {
    id: 'starlight',
    accent: 'butter',
    skills: ['add2d2dCarry', 'sub2d2dBorrow', 'missing', 'stretch3d', 'stretch100'],
    floor: 54,
  },
];

const BY_ID = new Map(LEVELS.map((l) => [l.id, l]));

export function levelDef(id: LevelId): Level {
  const level = BY_ID.get(id);
  if (!level) throw new Error(`Unknown level: ${id}`);
  return level;
}

export function levelForSkill(skill: SkillId): LevelId {
  return LEVELS.find((l) => l.skills.includes(skill))?.id ?? 'blossom';
}
