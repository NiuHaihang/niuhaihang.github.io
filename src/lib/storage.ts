import type { LevelId } from '../game/types';
import type { Lang } from '../i18n/strings';

export interface Progress {
  v: 1;
  lang: Lang;
  sound: boolean;
  level: LevelId;
  stars: Record<LevelId, number>;
  best: Record<LevelId, number>;
  days: string[];
  rounds: number;
  correct: number;
}

const KEY = 'bunnymath.v1';

const LEVEL_IDS: LevelId[] = ['sprout', 'blossom', 'sparkle', 'starlight'];

export function defaultProgress(): Progress {
  return {
    v: 1,
    lang: 'en',
    sound: true,
    level: 'blossom',
    stars: { sprout: 0, blossom: 0, sparkle: 0, starlight: 0 },
    best: { sprout: 0, blossom: 0, sparkle: 0, starlight: 0 },
    days: [],
    rounds: 0,
    correct: 0,
  };
}

export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDay(key: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
}

export function addDays(date: Date, delta: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + delta);
  return next;
}

/** Consecutive days played, ending today or yesterday (so the streak is not "lost" before bedtime). */
export function streakLength(days: readonly string[], now = new Date()): number {
  const set = new Set(days);
  let cursor = dayKey(now);
  if (!set.has(cursor)) {
    cursor = dayKey(addDays(now, -1));
    if (!set.has(cursor)) return 0;
  }
  let count = 0;
  for (let i = 0; i < 400; i++) {
    if (!set.has(cursor)) break;
    count++;
    const date = parseDay(cursor);
    if (!date) break;
    cursor = dayKey(addDays(date, -1));
  }
  return count;
}

function isLang(value: unknown): value is Lang {
  return value === 'en' || value === 'zh';
}

function isLevel(value: unknown): value is LevelId {
  return typeof value === 'string' && (LEVEL_IDS as string[]).includes(value);
}

/** Merge stored data onto defaults so older/partial saves never crash the app. */
export function normalize(raw: unknown): Progress {
  const base = defaultProgress();
  if (!raw || typeof raw !== 'object') return base;
  const data = raw as Partial<Progress>;

  if (data.v !== 1) return base;

  const stars = { ...base.stars };
  const best = { ...base.best };
  for (const id of LEVEL_IDS) {
    const s = data.stars?.[id];
    if (typeof s === 'number') stars[id] = Math.max(0, Math.min(3, Math.round(s)));
    const b = data.best?.[id];
    if (typeof b === 'number') best[id] = Math.max(0, Math.min(100, Math.round(b)));
  }

  return {
    ...base,
    lang: isLang(data.lang) ? data.lang : base.lang,
    sound: typeof data.sound === 'boolean' ? data.sound : base.sound,
    level: isLevel(data.level) ? data.level : base.level,
    stars,
    best,
    days: Array.isArray(data.days) ? data.days.filter((d) => typeof d === 'string').slice(-400) : [],
    rounds: typeof data.rounds === 'number' ? Math.max(0, Math.floor(data.rounds)) : 0,
    correct: typeof data.correct === 'number' ? Math.max(0, Math.floor(data.correct)) : 0,
  };
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultProgress();
    return normalize(JSON.parse(raw));
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // Private mode / full storage: the game still works, progress just is not kept.
  }
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
