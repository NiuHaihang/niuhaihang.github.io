import type { Grade, Topic } from '../content/types';

export const KEY = 'bunny-english.v1';

/** One remembered item: how many times it came back right, and when it is due. */
export interface MemoryEntry {
  /** Successful reps so far; drives the interval. */
  n: number;
  /** Local day key (YYYY-MM-DD) when it should be asked again. */
  due: string;
}

export interface Progress {
  v: 1;
  grade: Grade;
  topic: Topic;
  /** Best stars per lesson id. */
  stars: Record<string, number>;
  /** Spaced-repetition state keyed by `w:<english>` / `s:<sentence>`. */
  memory: Record<string, MemoryEntry>;
  /** Local day keys (YYYY-MM-DD) with at least one finished lesson. */
  days: string[];
  sound: boolean;
}

export const emptyProgress: Progress = {
  v: 1,
  grade: 3,
  topic: 'words',
  stars: {},
  memory: {},
  days: [],
  sound: true,
};

export function dayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isGrade(v: unknown): v is Grade {
  return v === 3 || v === 4 || v === 5 || v === 6;
}

function isTopic(v: unknown): v is Topic {
  return v === 'words' || v === 'phonics' || v === 'grammar';
}

export function normalize(raw: unknown): Progress {
  if (!raw || typeof raw !== 'object') return { ...emptyProgress };
  const data = raw as Partial<Progress>;
  const stars: Record<string, number> = {};
  if (data.stars && typeof data.stars === 'object') {
    for (const [k, v] of Object.entries(data.stars)) {
      if (typeof v === 'number' && v >= 0 && v <= 3) stars[k] = Math.round(v);
    }
  }
  const memory: Record<string, MemoryEntry> = {};
  if (data.memory && typeof data.memory === 'object') {
    for (const [k, v] of Object.entries(data.memory)) {
      const entry = v as Partial<MemoryEntry> | null;
      if (!entry || typeof entry !== 'object') continue;
      const n = typeof entry.n === 'number' ? Math.max(0, Math.min(20, Math.round(entry.n))) : 0;
      const due = typeof entry.due === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(entry.due) ? entry.due : dayKey();
      memory[k] = { n, due };
    }
  }
  return {
    v: 1,
    grade: isGrade(data.grade) ? data.grade : emptyProgress.grade,
    topic: isTopic(data.topic) ? data.topic : emptyProgress.topic,
    stars,
    memory,
    days: Array.isArray(data.days) ? data.days.filter((d): d is string => typeof d === 'string').slice(-120) : [],
    sound: typeof data.sound === 'boolean' ? data.sound : true,
  };
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    return normalize(raw ? JSON.parse(raw) : null);
  } catch {
    return { ...emptyProgress };
  }
}

export function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    /* private mode, quota — the app still works, it just forgets */
  }
}

export function streakLength(days: string[], now = new Date()): number {
  const set = new Set(days);
  let streak = 0;
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!set.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (set.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
