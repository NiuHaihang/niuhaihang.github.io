import type { LevelId, Track } from '../game/types';
import type { Lang } from '../i18n/strings';

export interface Progress {
  v: 1;
  lang: Lang;
  sound: boolean;
  /** Which quiz set the child used last. */
  track: Track;
  level: LevelId;
  /** Keyed `${track}:${level}`, so each quiz set keeps its own stars. */
  stars: Record<string, number>;
  best: Record<string, number>;
  days: string[];
  rounds: number;
  correct: number;
}

const KEY = 'bunnymath.v1';

const LEVEL_IDS: LevelId[] = ['sprout', 'blossom', 'sparkle', 'starlight'];
const TRACK_IDS: Track[] = ['addsub', 'all4'];

function slotKey(track: Track, level: LevelId): string {
  return `${track}:${level}`;
}

function emptyScores(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const track of TRACK_IDS) for (const level of LEVEL_IDS) out[slotKey(track, level)] = 0;
  return out;
}

function isTrack(value: unknown): value is Track {
  return value === 'addsub' || value === 'all4';
}

export function defaultProgress(): Progress {
  return {
    v: 1,
    lang: 'en',
    sound: true,
    track: 'addsub',
    level: 'blossom',
    stars: emptyScores(),
    best: emptyScores(),
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
  for (const track of TRACK_IDS) {
    for (const id of LEVEL_IDS) {
      const key = slotKey(track, id);
      // Older saves (before multiplication) stored bare level keys.
      const rawStars = data.stars?.[key] ?? (track === 'addsub' ? data.stars?.[id] : undefined);
      const rawBest = data.best?.[key] ?? (track === 'addsub' ? data.best?.[id] : undefined);
      if (typeof rawStars === 'number') stars[key] = Math.max(0, Math.min(3, Math.round(rawStars)));
      if (typeof rawBest === 'number') best[key] = Math.max(0, Math.min(100, Math.round(rawBest)));
    }
  }

  return {
    ...base,
    lang: isLang(data.lang) ? data.lang : base.lang,
    sound: typeof data.sound === 'boolean' ? data.sound : base.sound,
    track: isTrack(data.track) ? data.track : base.track,
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

export { slotKey };

export function clearProgress(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
