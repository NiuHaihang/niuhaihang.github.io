import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Home } from './components/Home';
import { Lesson } from './components/Lesson';
import { Result } from './components/Result';
import { lessonById, type Lesson as LessonContent } from './content';
import type { Grade, Topic } from './content/types';
import { buildLesson } from './game/exercise';
import { buildReview, dueCount, keyFor, record } from './game/review';
import { randomSeed } from './game/rng';
import { initialState, reducer, summarize } from './game/session';
import { useI18n } from './i18n/I18nProvider';
import { dayKey, loadProgress, saveProgress, streakLength } from './lib/storage';
import { stopSpeaking } from './lib/audio';

export function App() {
  const { lang, t } = useI18n();
  const [progress, setProgress] = useState(() => loadProgress());
  const [state, dispatch] = useReducer(reducer, progress.grade, (grade) => initialState(grade, progress.topic));
  const banked = useRef<string>('');

  useEffect(() => {
    setProgress((prev) => ({ ...prev, grade: state.grade, topic: state.topic }));
  }, [state.grade, state.topic]);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    stopSpeaking();
  }, [state.index, state.screen]);

  const start = useCallback(
    (content: LessonContent) => {
      if (!content.ready) return;
      dispatch({
        type: 'start',
        lessonId: content.id,
        lessonTitle: content.title,
        exercises: buildLesson(content, randomSeed()),
        now: Date.now(),
      });
    },
    [],
  );

  const summary = useMemo(() => summarize(state), [state]);

  // Bank the stars once per finished lesson (review rounds do not count).
  useEffect(() => {
    if (state.screen !== 'result' || state.mode === 'review') return;
    const key = `${state.lessonId}:${state.finishedAt}`;
    if (banked.current === key) return;
    banked.current = key;
    setProgress((prev) => {
      const best = Math.max(prev.stars[state.lessonId] ?? 0, summary.stars);
      const today = dayKey();
      return {
        ...prev,
        stars: { ...prev.stars, [state.lessonId]: best },
        days: prev.days.includes(today) ? prev.days : [...prev.days, today],
      };
    });
  }, [state.screen, state.lessonId, state.finishedAt, summary.stars]);

  /** Review round: whatever the memory says is due today. */
  const startReview = useCallback(() => {
    const today = dayKey();
    const exercises = buildReview(progress.memory, today, randomSeed());
    if (exercises.length === 0) return;
    dispatch({
      type: 'start',
      mode: 'review',
      lessonId: 'review',
      lessonTitle: t('review'),
      exercises,
      now: Date.now(),
    });
  }, [progress.memory, t]);

  const onAnswer = useCallback(
    (value: string, correct: boolean) => {
      const exercise = state.exercises[state.index];
      const key = exercise ? keyFor(exercise) : null;
      if (key) {
        setProgress((prev) => ({ ...prev, memory: record(prev.memory, key, correct, dayKey()) }));
      }
      dispatch({ type: 'answer', value, correct, now: Date.now() });
    },
    [state.exercises, state.index],
  );

  const onNext = useCallback(() => {
    dispatch({ type: 'next', now: Date.now() });
  }, []);

  const again = useCallback(() => {
    if (state.mode === 'review') {
      dispatch({ type: 'again', exercises: buildReview(progress.memory, dayKey(), randomSeed()), now: Date.now() });
      return;
    }
    const content = lessonById(state.lessonId);
    if (!content) return;
    dispatch({ type: 'again', exercises: buildLesson(content, randomSeed()), now: Date.now() });
  }, [state.lessonId, state.mode, progress.memory]);

  const streak = streakLength(progress.days);

  return (
    <div className="app" data-screen={state.screen} data-lang={lang}>
      {state.screen === 'home' ? (
        <Home
          grade={state.grade}
          topic={state.topic}
          stars={progress.stars}
          streak={streak}
          sound={progress.sound}
          onGrade={(grade: Grade) => dispatch({ type: 'setGrade', grade })}
          onTopic={(topic: Topic) => dispatch({ type: 'setTopic', topic })}
          onStart={start}
          reviewCount={dueCount(progress.memory, dayKey())}
          onReview={startReview}
          onToggleSound={() => setProgress((prev) => ({ ...prev, sound: !prev.sound }))}
        />
      ) : null}

      {state.screen === 'lesson' ? <Lesson state={state} onAnswer={onAnswer} onNext={onNext} onExit={() => dispatch({ type: 'home' })} /> : null}

      {state.screen === 'result' ? (
        <Result
          summary={summary}
          exercises={state.exercises}
          lessonTitle={state.lessonTitle}
          isReview={state.mode === 'review'}
          onAgain={again}
          onHome={() => dispatch({ type: 'home' })}
        />
      ) : null}
    </div>
  );
}
