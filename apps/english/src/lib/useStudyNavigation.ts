import { useCallback, useLayoutEffect, useRef } from 'react';
import { createStudyNavigation } from './studyNavigation';

/** Shared by all subjects so page buttons and native Back follow one path. */
export function useStudyNavigation<T>(view: T, home: () => void, restore: (view: T) => void) {
  const latest = useRef({ view, home, restore });
  const navigation = useRef<ReturnType<typeof createStudyNavigation<T>>>(null);
  useLayoutEffect(() => { latest.current = { view, home, restore }; });
  useLayoutEffect(() => {
    const controller = createStudyNavigation({
      read: () => latest.current.view,
      home: () => latest.current.home(),
      restore: (next: T) => latest.current.restore(next),
    });
    navigation.current = controller;
    return () => controller.dispose();
  }, []);
  useLayoutEffect(() => { navigation.current!.restoreScroll(); });

  const open = useCallback((action: () => void) => navigation.current!.open(action), []);
  const back = useCallback(() => navigation.current!.back(), []);
  return { open, back };
}
