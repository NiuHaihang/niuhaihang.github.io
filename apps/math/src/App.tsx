import { useEffect, useReducer, useRef, useState } from 'react';
import { Home } from './components/Home';
import { PrintSheet } from './components/PrintSheet';
import { Quiz } from './components/Quiz';
import { Result } from './components/Result';
import { randomSeed } from './game/rng';
import { summarize } from './game/scoring';
import { initialState, reducer } from './game/session';
import type { LevelId, Track } from './game/types';
import { I18nProvider } from './i18n/I18nProvider';
import type { Lang } from './i18n/strings';
import { sound } from './lib/sound';
import { useStudyNavigation } from '../../english/src/lib/useStudyNavigation';
import {
  clearProgress,
  dayKey,
  defaultProgress,
  loadProgress,
  saveProgress,
  slotKey,
} from './lib/storage';
import type { Progress } from './lib/storage';

export function App() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [state, dispatch] = useReducer(reducer, progress, (p) =>
    initialState(p.level, p.track),
  );
  const [printing, setPrinting] = useState(false);
  const recorded = useRef<string | null>(null);
  const navigation = useStudyNavigation({ state, printing }, () => {
    setPrinting(false);
    dispatch({ type: 'home' });
  }, (saved) => {
    setPrinting(saved.printing);
    dispatch({ type: 'restore', state: saved.state });
  });

  /* persist anything the child earns or toggles */
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    sound.setEnabled(progress.sound);
  }, [progress.sound]);

  useEffect(() => {
    document.documentElement.lang = progress.lang;
  }, [progress.lang]);

  /* bank the round once, when it finishes */
  useEffect(() => {
    if (state.screen !== 'result' || state.mode !== 'round') return;
    if (!state.round || state.finishedAt === null) return;
    const key = `${state.round.seed}:${state.finishedAt}`;
    if (recorded.current === key) return;
    recorded.current = key;

    const summary = summarize(state.round, state.answers, state.startedAt, state.finishedAt);
    const slot = slotKey(state.track, state.level);
    const today = dayKey(new Date());

    setProgress((prev) => ({
      ...prev,
      stars: { ...prev.stars, [slot]: Math.max(prev.stars[slot] ?? 0, summary.stars) },
      best: {
        ...prev.best,
        [slot]: Math.max(prev.best[slot] ?? 0, Math.round(summary.accuracy * 100)),
      },
      days: prev.days.includes(today) ? prev.days : [...prev.days, today],
      rounds: prev.rounds + 1,
      correct: prev.correct + summary.correct,
    }));
  }, [
    state.screen,
    state.mode,
    state.round,
    state.finishedAt,
    state.answers,
    state.startedAt,
    state.level,
    state.track,
  ]);

  const setLevel = (level: LevelId) => {
    dispatch({ type: 'setLevel', level });
    setProgress((prev) => ({ ...prev, level }));
  };

  const setTrack = (track: Track) => {
    dispatch({ type: 'setTrack', track });
    setProgress((prev) => ({ ...prev, track }));
  };

  const setLang = (lang: Lang) => setProgress((prev) => ({ ...prev, lang }));

  return (
    <I18nProvider lang={progress.lang} setLang={setLang}>
      <div className="app-shell">
        <div className="app-bg" aria-hidden="true">
          <span className="app-bg__blob app-bg__blob--one" />
          <span className="app-bg__blob app-bg__blob--two" />
          <span className="app-bg__blob app-bg__blob--three" />
        </div>

        {printing ? (
          <PrintSheet level={state.level} track={state.track} onClose={navigation.back} />
        ) : state.screen === 'home' ? (
          <Home
            progress={progress}
            selected={state.level}
            track={state.track}
            onSetTrack={setTrack}
            onSetLevel={setLevel}
            onStart={() => navigation.open(() => dispatch({ type: 'start', level: state.level, seed: randomSeed(), now: Date.now() }))}
            onPrint={() => navigation.open(() => setPrinting(true))}
            onToggleSound={() => setProgress((prev) => ({ ...prev, sound: !prev.sound }))}
            onToggleLang={() => setLang(progress.lang === 'en' ? 'zh' : 'en')}
            onReset={() => {
              clearProgress();
              const fresh = defaultProgress();
              setProgress(fresh);
              recorded.current = null;
              dispatch({ type: 'setLevel', level: fresh.level });
              dispatch({ type: 'setTrack', track: fresh.track });
              dispatch({ type: 'home' });
            }}
          />
        ) : state.screen === 'quiz' ? (
          <Quiz state={state} dispatch={dispatch} soundOn={progress.sound} onHome={navigation.back} />
        ) : (
          <Result state={state} dispatch={dispatch} onHome={navigation.back} />
        )}
      </div>
    </I18nProvider>
  );
}
