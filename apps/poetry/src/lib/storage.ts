import { GRADES, POEM_BY_ID, type Grade } from '../content';

export const KEY = 'bunny-poetry.v1';
export interface Progress { grade: Grade; sound: boolean; stars: Record<string, number>; studied: string[] }

/** Storage is a user-controlled boundary; older subjects' records stay separate. */
export function normalize(raw: unknown): Progress {
  const data = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const stars: Record<string, number> = {};
  if (data.stars && typeof data.stars === 'object') {
    for (const [id, value] of Object.entries(data.stars)) {
      if (Object.hasOwn(POEM_BY_ID, id) && Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 3) stars[id] = Number(value);
    }
  }
  return {
    grade: data.grade === 0 || GRADES.includes(data.grade as Exclude<Grade, 0>) ? data.grade as Grade : 1,
    sound: typeof data.sound === 'boolean' ? data.sound : true, stars,
    // Completed legacy practice also counts as learning; reading needs no quiz.
    studied: [...new Set([...Object.keys(stars), ...(Array.isArray(data.studied)
      ? data.studied.filter((id): id is string => typeof id === 'string' && Object.hasOwn(POEM_BY_ID, id)) : [])])],
  };
}

export function loadProgress(): Progress {
  const raw = localStorage.getItem(KEY);
  return normalize(raw === null ? null : JSON.parse(raw));
}

/** The child marks a reading session complete; no recitation is auto-graded. */
export function completeStudy(progress: Progress, poemId: string): Progress {
  return { ...progress, studied: progress.studied.includes(poemId) ? progress.studied : [...progress.studied, poemId] };
}

/** Only a completed round earns stars; repeat practice preserves the best score. */
export function completeRound(progress: Progress, poemId: string, correct: number, total: number): Progress {
  const stars = correct === total ? 3 : correct / total >= 0.6 ? 2 : 1;
  return { ...completeStudy(progress, poemId), stars: { ...progress.stars, [poemId]: Math.max(progress.stars[poemId] ?? 0, stars) } };
}
