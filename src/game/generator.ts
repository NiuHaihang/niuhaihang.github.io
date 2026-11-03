import { difficultyOf } from './difficulty';
import { levelDef, levelForSkill, levelSkills } from './levels';
import { makeRng, type Rng } from './rng';
import { SKILLS } from './skills';
import type { Item, LevelId, Op, RawItem, Round, SkillId, Track } from './types';

const ROUND_SIZE = 18;
const PRACTICE_SIZE = 5;

interface SkillStat {
  id: SkillId;
  mean: number;
  /** Which operators this skill can produce — used to guarantee coverage. */
  ops: Op[];
}

interface LevelShape {
  skills: SkillStat[];
  lo: number;
  hi: number;
}

const shapeCache = new Map<string, LevelShape>();

function shapeOf(track: Track, level: LevelId): LevelShape {
  const key = `${track}:${level}`;
  const cached = shapeCache.get(key);
  if (cached) return cached;

  const skills = levelSkills(level, track);
  const rng = makeRng(0x9e3779b9 ^ skills.length ^ (track === 'all4' ? 0x51ed : 0));
  const perSkill: SkillStat[] = [];
  const all: number[] = [];

  for (const id of skills) {
    const values: number[] = [];
    const ops = new Set<Op>();
    for (let i = 0; i < 240; i++) {
      const raw = SKILLS[id].sample(rng);
      const d = difficultyOf(raw.a, raw.b, raw.op, raw.blank);
      values.push(d);
      all.push(d);
      ops.add(raw.op);
    }
    perSkill.push({
      id,
      mean: values.reduce((s, n) => s + n, 0) / values.length,
      ops: [...ops],
    });
  }

  all.sort((x, y) => x - y);
  const at = (p: number) => all[Math.min(all.length - 1, Math.max(0, Math.floor(all.length * p)))] ?? 0;
  const shape: LevelShape = { skills: perSkill, lo: at(0.22), hi: at(0.94) };
  shapeCache.set(key, shape);
  return shape;
}

function totalOf(raw: RawItem): number {
  if (raw.op === '×') return raw.a * raw.b;
  if (raw.op === '÷') return raw.a / raw.b;
  return raw.op === '+' ? raw.a + raw.b : raw.a - raw.b;
}

function answerOf(raw: RawItem): number {
  if (raw.blank === 'a') return raw.a;
  if (raw.blank === 'b') return raw.b;
  return totalOf(raw);
}

function makeItem(skill: SkillId, raw: RawItem, index: number): Item {
  return {
    id: `${skill}-${index}-${raw.a}-${raw.b}`,
    skill,
    a: raw.a,
    b: raw.b,
    op: raw.op,
    blank: raw.blank,
    total: totalOf(raw),
    answer: answerOf(raw),
    difficulty: difficultyOf(raw.a, raw.b, raw.op, raw.blank),
  };
}

export function accept(item: Item): boolean {
  if (!Number.isInteger(item.answer) || item.answer < 2 || item.answer > 999) return false;
  if (!Number.isInteger(item.total) || item.total < 0) return false;
  if (item.op === '-' && item.a === item.b) return false;
  // Division must come out even; a remainder is a different lesson.
  if (item.op === '÷' && item.a % item.b !== 0) return false;
  return true;
}

function keyOf(item: Item): string {
  if (item.op === '+') {
    const lo = Math.min(item.a, item.b);
    const hi = Math.max(item.a, item.b);
    return `+${lo}:${hi}:${item.blank}`;
  }
  if (item.op === '×') {
    const lo = Math.min(item.a, item.b);
    const hi = Math.max(item.a, item.b);
    return `×${lo}:${hi}:${item.blank}`;
  }
  return `${item.op}-${item.a}:${item.b}:${item.blank}`;
}

function wouldTriple(items: Item[], skill: SkillId): boolean {
  const n = items.length;
  if (n < 2) return false;
  return items[n - 1]!.skill === skill && items[n - 2]!.skill === skill;
}

/** Soft rules that keep an 18-question round from feeling repetitive. */
function varietyPenalty(items: Item[], item: Item): number {
  if (items.some((prev) => keyOf(prev) === keyOf(item))) return Number.POSITIVE_INFINITY;

  let penalty = 0;
  const last = items[items.length - 1];
  const secondLast = items[items.length - 2];

  if (last) {
    if (last.skill === item.skill) penalty += 7;
    if (last.answer === item.answer) penalty += 3;
    if (last.op === item.op) penalty += 2;
    if (last.difficulty > item.difficulty + 18) penalty += 2;
  }
  if (last && secondLast) {
    if (last.skill === item.skill && secondLast.skill === item.skill) penalty += 26;
    if (last.op === item.op && secondLast.op === item.op) penalty += 10;
  }
  const sameAnswer = items.filter((prev) => prev.answer === item.answer).length;
  if (sameAnswer >= 2) penalty += 40;
  return penalty;
}

function pickSkill(rng: Rng, target: number, skills: SkillStat[]): SkillId {
  const weights = skills.map((s) => Math.exp(-(((s.mean - target) / 11) ** 2)));
  const sum = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * sum;
  for (let i = 0; i < skills.length; i++) {
    roll -= weights[i] ?? 0;
    if (roll <= 0) return skills[i]!.id;
  }
  return skills[skills.length - 1]!.id;
}

function ease(t: number): number {
  return Math.pow(Math.max(0, Math.min(1, t)), 0.85);
}

interface BuildOptions {
  track: Track;
  level: LevelId;
  seed: number;
  count: number;
  skills: SkillId[];
  /** 0 for practice: practising an easy skill is the whole point. */
  floor: number;
  /** Operators that must appear at least once (all-four rounds only). */
  requiredOps?: Op[];
}

function buildRound({
  track,
  level,
  seed,
  count,
  skills,
  floor,
  requiredOps = [],
}: BuildOptions): Round {
  const rng = makeRng(seed);
  const shape = shapeOf(track, level);
  const stats = shape.skills.filter((s) => skills.includes(s.id));
  const usable = stats.length > 0 ? stats : shape.skills;
  const lo = Math.max(shape.lo, floor);
  const hi = Math.max(lo + 4, shape.hi);
  const repeatable = skills.length <= 1;
  const items: Item[] = [];

  for (let i = 0; i < count; i++) {
    const progress = count === 1 ? 0.4 : i / (count - 1);
    const jitter = (rng() - 0.5) * 7;
    const target = Math.max(4, Math.min(100, lo + (hi - lo) * ease(progress) + jitter));

    // Reserve the last free slots for operators the round has not shown yet.
    const missing = requiredOps.filter((op) => !items.some((it) => it.op === op));
    const forceOp = missing.length > 0 && count - i <= missing.length ? missing[0]! : null;
    const pool = forceOp ? usable.filter((stat) => stat.ops.includes(forceOp)) : usable;

    let best: { item: Item; score: number } | null = null;

    for (let tries = 0; tries < 40; tries++) {
      const skill = pickSkill(rng, target, pool.length > 0 ? pool : usable);
      if (!repeatable && wouldTriple(items, skill)) continue;
      const raw = SKILLS[skill].sample(rng);
      const item = makeItem(skill, raw, i);
      if (!accept(item)) continue;
      if (forceOp && item.op !== forceOp) continue;
      if (item.difficulty < floor) continue;

      const penalty = varietyPenalty(items, item);
      if (!Number.isFinite(penalty)) continue;

      const score = Math.abs(item.difficulty - target) + penalty;
      if (!best || score < best.score) best = { item, score };
      if (score < 5) break;
    }

    if (best) {
      items.push(best.item);
    } else {
      // Relaxed fallback: any accepted, still-unique item from the allowed skills.
      for (let tries = 0; tries < 200 && !best; tries++) {
        const skill = usable[tries % usable.length]!.id;
        const item = makeItem(skill, SKILLS[skill].sample(rng), i);
        if (!accept(item)) continue;
        if (forceOp && item.op !== forceOp) continue;
        if (item.difficulty < floor) continue;
        if (items.some((prev) => keyOf(prev) === keyOf(item))) continue;
        best = { item, score: 0 };
      }
      if (best) items.push(best.item);
    }
  }

  return { items, level, track, seed };
}

export function generateRound(
  track: Track,
  level: LevelId,
  seed: number,
  count = ROUND_SIZE,
): Round {
  return buildRound({
    track,
    level,
    seed,
    count,
    skills: levelSkills(level, track),
    floor: levelDef(level).floor,
    requiredOps: track === 'all4' ? ['×', '÷'] : [],
  });
}

export function trackForSkill(skill: SkillId): Track {
  const level = levelForSkill(skill);
  return levelSkills(level, 'addsub').includes(skill) ? 'addsub' : 'all4';
}

export function generatePractice(skill: SkillId, seed: number, count = PRACTICE_SIZE): Round {
  const level = levelForSkill(skill);
  return buildRound({
    track: trackForSkill(skill),
    level,
    seed,
    count: Math.min(count, PRACTICE_SIZE + 2),
    skills: [skill],
    floor: 0,
  });
}

export { ROUND_SIZE, PRACTICE_SIZE };
