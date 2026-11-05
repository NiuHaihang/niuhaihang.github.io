import { describe, expect, it, vi, afterEach } from 'vitest';
import { COLLECTION_KEY, claimStars, constellation, emptyCollection, importStars, loadCollection, upgradedTier } from './starCollection';

afterEach(() => vi.unstubAllGlobals());

describe('shared starlight collection', () => {
  it('converts all five tiers without losing saved value, including former large sun counts', () => {
    for (const total of [0, 9, 10, 19, 99, 100, 109, 999, 1000, 9999, 10000, 99999, 100000]) {
      const sky = constellation(total);
      expect(sky.universes * 10000 + sky.galaxies * 1000 + sky.suns * 100 + sky.moons * 10 + sky.stars).toBe(total);
      expect(sky.galaxies).toBeLessThan(10);
      expect(sky.suns).toBeLessThan(10);
      expect(sky.moons).toBeLessThan(10);
      expect(sky.stars).toBeLessThan(10);
    }
    expect(constellation(100)).toEqual({ universes: 0, galaxies: 0, suns: 1, moons: 0, stars: 0 });
    expect(constellation(1000).galaxies).toBe(1);
    expect(constellation(10000).universes).toBe(1);
    expect(constellation(100000).universes).toBe(10);
  });

  it('celebrates the highest new tier and points to the correct next reward', () => {
    for (const [before, after, key] of [[9, 10, 'moons'], [99, 100, 'suns'], [999, 1000, 'galaxies'], [9999, 10000, 'universes'], [19999, 20000, 'universes']] as const) {
      expect(upgradedTier(before, after)?.key).toBe(key);
    }
    expect(upgradedTier(990, 1000)?.key).toBe('galaxies');
    expect(upgradedTier(9990, 10000)?.key).toBe('universes');
    expect(upgradedTier(10, 17)).toBeUndefined();
  });

  it('imports both old subject totals only once, leaving the input untouched', () => {
    const empty = emptyCollection();
    const poetry = importStars(empty, 'poetry', 9);
    const both = importStars(poetry, 'english', 12);
    expect(both.total).toBe(21);
    expect(importStars(both, 'poetry', 15)).toBe(both);
    expect(importStars(both, 'english', 20)).toBe(both);
    expect(empty.total).toBe(0);
  });

  it('rewards effort, correct answers and replays but not duplicate result submissions', () => {
    const first = claimStars(emptyCollection(), 'poetry', 'round-a', 0);
    expect(first.total).toBe(1);
    expect(claimStars(first, 'poetry', 'round-a', 0)).toBe(first);
    const english = claimStars(first, 'english', 'round-b', 8);
    expect(english.total).toBe(10);
    expect(claimStars(english, 'english', 'round-b', 8)).toBe(english);
    const replay = claimStars(english, 'poetry', 'round-c', 6);
    expect(replay.total).toBe(17);
  });

  it('restores the collection after a subject switch and rejects corrupt boundary data', () => {
    let saved: string | null = null;
    vi.stubGlobal('localStorage', { getItem: (key: string) => { expect(key).toBe(COLLECTION_KEY); return saved; } });
    expect(loadCollection()).toEqual(emptyCollection());
    const earned = claimStars(importStars(emptyCollection(), 'english', 3), 'english', 'round-d', 6);
    saved = JSON.stringify(earned);
    expect(loadCollection()).toEqual(earned);
    saved = JSON.stringify({ ...earned, total: -1 });
    expect(loadCollection).toThrow('星光收藏数据格式不正确');
    saved = '{';
    expect(loadCollection).toThrow();
  });
});
