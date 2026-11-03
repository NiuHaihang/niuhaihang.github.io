import { describe, expect, it } from 'vitest';
import { generatePractice, generateRound, ROUND_SIZE } from './generator';
import { LEVELS, levelDef, levelSkills } from './levels';
import { SKILL_IDS } from './skills';
import type { Item, LevelId, Op, SkillId, Track } from './types';

const LEVEL_IDS = LEVELS.map((l) => l.id);
const TRACKS: Track[] = ['addsub', 'all4'];

function totalOf(item: Item): number {
  if (item.op === '×') return item.a * item.b;
  if (item.op === '÷') return item.a / item.b;
  return item.op === '+' ? item.a + item.b : item.a - item.b;
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

describe('round generator', () => {
  it('produces complete, in-range rounds for every level and quiz set', () => {
    for (const track of TRACKS) {
      for (const level of LEVEL_IDS) {
        const allowed = new Set(levelSkills(level, track));
        for (let seed = 1; seed <= 150; seed++) {
          const round = generateRound(track, level, seed);
          expect(round.items).toHaveLength(ROUND_SIZE);
          expect(round.track).toBe(track);

          for (const item of round.items) {
            expect(allowed.has(item.skill), `${track}/${level} generated ${item.skill}`).toBe(true);
            expect(item.difficulty).toBeGreaterThanOrEqual(0);
            expect(item.difficulty).toBeLessThanOrEqual(100);
            expect(Number.isInteger(item.answer)).toBe(true);
            expect(item.answer).toBeGreaterThanOrEqual(2);
            expect(item.answer).toBeLessThanOrEqual(999);
            expect(item.total).toBeGreaterThanOrEqual(0);

            const expectedTotal = totalOf(item);
            expect(item.total).toBe(expectedTotal);
            const expectedAnswer =
              item.blank === 'a' ? item.a : item.blank === 'b' ? item.b : expectedTotal;
            expect(item.answer).toBe(expectedAnswer);
          }
        }
      }
    }
  });

  it('only emits × and ÷ with whole-number results', () => {
    for (const level of LEVEL_IDS) {
      for (let seed = 1; seed <= 120; seed++) {
        for (const item of generateRound('all4', level, seed).items) {
          if (item.op !== '×' && item.op !== '÷') continue;
          expect(Number.isInteger(item.total), `${item.a} ÷ ${item.b}`).toBe(true);
          if (item.op === '÷') {
            expect(item.a % item.b).toBe(0);
            expect(item.b).toBeGreaterThanOrEqual(2);
          }
          // No ×1 or ÷1 style reflexes.
          if (item.blank !== 'a' && item.blank !== 'b') {
            expect(Math.min(item.a, item.b)).toBeGreaterThanOrEqual(2);
          }
        }
      }
    }
  });

  it('puts both sides of the times tables in an all-four round', () => {
    let withTimes = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const ops = new Set(generateRound('all4', 'blossom', seed).items.map((i) => i.op));
      if (ops.has('×')) withTimes++;
    }
    // Every round should have some multiplication; seeds that do not are a bug.
    expect(withTimes).toBe(40);
  });

  it('never repeats the same exercise inside a round', () => {
    for (const track of TRACKS) {
      for (const level of LEVEL_IDS) {
        for (let seed = 1; seed <= 200; seed++) {
          const keys = generateRound(track, level, seed).items.map(keyOf);
          expect(new Set(keys).size).toBe(keys.length);
        }
      }
    }
  });

  it('avoids three identical skills in a row', () => {
    for (const track of TRACKS) {
      for (const level of LEVEL_IDS) {
        for (let seed = 1; seed <= 200; seed++) {
          const skills = generateRound(track, level, seed).items.map((i) => i.skill);
          for (let i = 2; i < skills.length; i++) {
            const triple = skills[i] === skills[i - 1] && skills[i] === skills[i - 2];
            expect(triple, `${track}/${level}/${seed} at ${i}`).toBe(false);
          }
        }
      }
    }
  });

  it('gets harder level by level in both quiz sets', () => {
    for (const track of TRACKS) {
      const medians = LEVEL_IDS.map((level) => {
        const values: number[] = [];
        for (let seed = 1; seed <= 60; seed++) {
          values.push(...generateRound(track, level, seed).items.map((item) => item.difficulty));
        }
        values.sort((a, b) => a - b);
        return values[Math.floor(values.length / 2)]!;
      });
      for (let i = 1; i < medians.length; i++) {
        expect(medians[i], `${track}/${LEVEL_IDS[i]} > ${LEVEL_IDS[i - 1]}`).toBeGreaterThan(
          medians[i - 1]!,
        );
      }
    }
  });

  it('ramps up smoothly from the first third to the last', () => {
    for (const track of TRACKS) {
      for (const level of LEVEL_IDS) {
        const runs = 40;
        const sums = [0, 0, 0];
        const counts = [0, 0, 0];
        for (let seed = 1; seed <= runs; seed++) {
          const items = generateRound(track, level, seed).items;
          const third = Math.floor(items.length / 3);
          items.forEach((item, index) => {
            const bucket = Math.min(2, Math.floor(index / third));
            sums[bucket]! += item.difficulty;
            counts[bucket]! += 1;
          });
        }
        const means = sums.map((sum, i) => sum / counts[i]!);
        expect(means[0], `${track}/${level} early < middle`).toBeLessThan(means[1]!);
        expect(means[1], `${track}/${level} middle < late`).toBeLessThan(means[2]!);
      }
    }
  });

  it('is deterministic for a seed and varied across seeds', () => {
    const a = generateRound('all4', 'blossom', 42).items.map((i) => `${i.a}${i.op}${i.b}`);
    const b = generateRound('all4', 'blossom', 42).items.map((i) => `${i.a}${i.op}${i.b}`);
    const c = generateRound('all4', 'blossom', 43).items.map((i) => `${i.a}${i.op}${i.b}`);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it('keeps the add-only set free of × and ÷', () => {
    for (const level of LEVEL_IDS) {
      for (let seed = 1; seed <= 40; seed++) {
        const ops = new Set<Op>(generateRound('addsub', level, seed).items.map((i) => i.op));
        expect(ops.has('×')).toBe(false);
        expect(ops.has('÷')).toBe(false);
      }
    }
  });

  it('puts a decent spread of skills in a round', () => {
    for (const track of TRACKS) {
      for (const level of LEVEL_IDS) {
        const skills = new Set(generateRound(track, level, 7).items.map((i) => i.skill));
        const available = levelSkills(level, track).length;
        expect(skills.size).toBeGreaterThanOrEqual(Math.min(3, available));
      }
    }
  });

  it('builds practice rounds from a single skill', () => {
    for (const skill of SKILL_IDS) {
      const round = generatePractice(skill, 5, 5);
      expect(round.items).toHaveLength(5);
      for (const item of round.items) expect(item.skill).toBe(skill);
      expect(new Set(round.items.map(keyOf)).size).toBe(5);
    }
  });

  it('respects a custom round size', () => {
    expect(generateRound('addsub', 'sprout' as LevelId, 3, 6).items).toHaveLength(6);
  });

  it('reaches every skill through some garden', () => {
    const seen = new Set<SkillId>();
    for (const track of TRACKS) {
      for (const level of LEVEL_IDS) {
        for (let seed = 1; seed <= 40; seed++) {
          for (const item of generateRound(track, level, seed).items) seen.add(item.skill);
        }
      }
    }
    // Every skill is reachable through some level, or it is dead weight.
    for (const skill of SKILL_IDS) expect(seen.has(skill), skill).toBe(true);
  });

  it('keeps level floors honest', () => {
    for (const level of LEVEL_IDS) {
      const floor = levelDef(level).floor;
      for (let seed = 1; seed <= 60; seed++) {
        for (const item of generateRound('all4', level, seed).items) {
          expect(item.difficulty, `${level} ${item.a} ${item.op} ${item.b}`).toBeGreaterThanOrEqual(
            floor,
          );
        }
      }
    }
  });
});
