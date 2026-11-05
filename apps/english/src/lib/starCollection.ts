/** English and poetry share one collection on this browser origin. Keep the
 * lifetime total in stars; all reward tiers are lossless display conversions. */
export const COLLECTION_KEY = 'bunny-star-collection.v1';
export type StarSubject = 'english' | 'poetry';
/** Highest tier first: an upgrade celebration shows the largest new reward. */
export const STAR_TIERS = [
  { key: 'universes', value: 10000, icon: '✨', zh: '宇宙', en: 'Universes', singular: 'universe' },
  { key: 'galaxies', value: 1000, icon: '🌌', zh: '星系', en: 'Galaxies', singular: 'galaxy' },
  { key: 'suns', value: 100, icon: '☀️', zh: '太阳', en: 'Suns', singular: 'sun' },
  { key: 'moons', value: 10, icon: '🌙', zh: '月亮', en: 'Moons', singular: 'moon' },
  { key: 'stars', value: 1, icon: '⭐', zh: '星星', en: 'Stars', singular: 'star' },
] as const;
export interface StarCollection {
  total: number;
  imported: Record<StarSubject, boolean>;
  lastRound: Record<StarSubject, string>;
}

export function emptyCollection(): StarCollection {
  return { total: 0, imported: { english: false, poetry: false }, lastRound: { english: '', poetry: '' } };
}

export function constellation(total: number) {
  return { universes: Math.floor(total / 10000), galaxies: Math.floor(total / 1000) % 10,
    suns: Math.floor(total / 100) % 10, moons: Math.floor(total / 10) % 10, stars: total % 10 };
}

export function upgradedTier(before: number, after: number) {
  return STAR_TIERS.find((tier) => tier.value > 1 && Math.floor(after / tier.value) > Math.floor(before / tier.value));
}

/** Import each subject's old best stars once, without changing its progress. */
export function importStars(collection: StarCollection, subject: StarSubject, legacyStars: number): StarCollection {
  if (collection.imported[subject]) return collection;
  return { ...collection, total: collection.total + legacyStars, imported: { ...collection.imported, [subject]: true } };
}

/** A completed round earns an effort star plus one per first correct answer.
 * The round token makes repeated result effects safe, including StrictMode. */
export function claimStars(collection: StarCollection, subject: StarSubject, round: string, correct: number): StarCollection {
  if (collection.lastRound[subject] === round) return collection;
  return { ...collection, total: collection.total + correct + 1, lastRound: { ...collection.lastRound, [subject]: round } };
}

export function loadCollection(): StarCollection {
  const raw = localStorage.getItem(COLLECTION_KEY);
  if (raw === null) return emptyCollection();
  const data = JSON.parse(raw) as Partial<StarCollection> | null;
  if (!data || !Number.isSafeInteger(data.total) || data.total! < 0
    || typeof data.imported?.english !== 'boolean' || typeof data.imported?.poetry !== 'boolean'
    || typeof data.lastRound?.english !== 'string' || typeof data.lastRound?.poetry !== 'string') {
    throw new Error('星光收藏数据格式不正确，请保留本地数据并联系维护者。');
  }
  return data as StarCollection;
}
