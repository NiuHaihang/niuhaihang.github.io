import { useCallback, useEffect, useState } from 'react';
import { COLLECTION_KEY, claimStars, importStars, loadCollection, type StarSubject } from './starCollection';

export function useStarCollection(subject: StarSubject, legacyStars: number) {
  const [collection, setCollection] = useState(loadCollection);

  useEffect(() => {
    const current = loadCollection();
    const next = importStars(current, subject, legacyStars);
    if (next !== current) localStorage.setItem(COLLECTION_KEY, JSON.stringify(next));
    setCollection(next);
  }, [subject, legacyStars]);

  // Another subject may be open in a second tab. Read its saved collection
  // before awarding too, so an old React snapshot cannot overwrite its stars.
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === COLLECTION_KEY) setCollection(loadCollection());
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const claim = useCallback((round: string, correct: number) => {
    const current = loadCollection();
    const next = claimStars(current, subject, round, correct);
    if (next !== current) localStorage.setItem(COLLECTION_KEY, JSON.stringify(next));
    setCollection(next);
    return next.total;
  }, [subject]);

  return { total: collection.total, claim };
}
