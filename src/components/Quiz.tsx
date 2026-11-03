import { useEffect, useRef, useState } from 'react';
import { Equation } from './Equation';
import { Keypad } from './Keypad';
import { Sparkles } from './Sparkles';
import { Strategy } from './Strategy';
import { currentStreak } from '../game/session';
import type { Action, SessionState } from '../game/session';
import type { Item } from '../game/types';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { useSoundFeedback } from '../lib/sound';

interface QuizProps {
  state: SessionState;
  dispatch: (action: Action) => void;
  soundOn: boolean;
}

function nudgeKey(item: Item): StringKey {
  if (item.blank !== 'answer') return 'hint.cover';
  if (item.op === '+' && item.a < 10 && item.b < 10) return 'hint.countOn';
  if (item.op === '+') return 'hint.tensFirst';
  return 'hint.countBack';
}

export function Quiz({ state, dispatch, soundOn }: QuizProps) {
  const { t } = useI18n();
  const { sound, haptic } = useSoundFeedback(soundOn);
  const [sheet, setSheet] = useState<Item | null>(null);
  const [nudge, setNudge] = useState(false);
  const [leaveAsk, setLeaveAsk] = useState(false);
  const [burst, setBurst] = useState(0);

  const item = state.round?.items[state.index];
  const total = state.round?.items.length ?? 0;
  const streak = currentStreak(state.answers);
  const progress = total > 0 ? (state.index / total) * 100 : 0;

  const latest = useRef(state);
  latest.current = state;

  /* sounds + confetti when an answer lands */
  const prevPhase = useRef(state.phase);
  useEffect(() => {
    const previous = prevPhase.current;
    prevPhase.current = state.phase;
    if (previous === state.phase) return;
    if (state.phase === 'correct') {
      sound.correct();
      haptic(12);
      setBurst((n) => n + 1);
    } else if (state.phase === 'wrong') {
      sound.wrong();
    }
  }, [state.phase, sound, haptic]);

  /* a correct answer moves on by itself, the way a game should */
  useEffect(() => {
    if (state.phase !== 'correct') return undefined;
    const timer = window.setTimeout(() => dispatch({ type: 'next', now: Date.now() }), 1050);
    return () => window.clearTimeout(timer);
  }, [state.phase, state.index, dispatch]);

  /* physical keyboards work too — tablets are not the only device */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const current = latest.current;
      if (event.key >= '0' && event.key <= '9') {
        sound.tap();
        dispatch({ type: 'digit', digit: event.key, now: Date.now() });
        event.preventDefault();
      } else if (event.key === 'Backspace') {
        dispatch({ type: 'backspace' });
        event.preventDefault();
      } else if (event.key === 'Enter') {
        if (current.phase === 'input') dispatch({ type: 'submit', now: Date.now() });
        else dispatch({ type: 'next', now: Date.now() });
        event.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, sound]);

  /* a new question closes any leftover panels */
  useEffect(() => {
    setSheet(null);
    setNudge(false);
  }, [state.index]);

  if (!item) return null;

  return (
    <div className="screen quiz">
      <header className="quiz__bar">
        <button
          type="button"
          className="iconbtn"
          onClick={() => setLeaveAsk(true)}
          aria-label={t('quiz.back')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="quiz__progress">
          <div className="quiz__track">
            <div className="quiz__fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="quiz__count">{t('quiz.progress', { n: state.index + 1, m: total })}</span>
        </div>

        <button
          type="button"
          className="iconbtn"
          onClick={() => setNudge(true)}
          aria-label={t('quiz.hint')}
        >
          <span aria-hidden="true">💡</span>
        </button>
      </header>

      <main className="quiz__stage">
        <div className="quiz__question">
          {streak >= 3 ? (
            <span className="quiz__streak">🔥 {t('quiz.streak', { n: streak })}</span>
          ) : (
            <span className="quiz__streak quiz__streak--ghost">{t('quiz.cheer')}</span>
          )}

          <Equation item={item} typed={state.typed} phase={state.phase} />

          <div className={`quiz__feedback ${state.phase === 'input' ? 'is-hidden' : 'is-shown'}`}>
            {state.phase !== 'input' ? (
              <>
                <span className={`quiz__mark quiz__mark--${state.phase}`} aria-hidden="true">
                  {state.phase === 'correct' ? '✓' : '✕'}
                </span>
                <span className="quiz__verdict">
                  <span>{state.phase === 'correct' ? t('feedback.correct2') : t('feedback.wrong')}</span>
                  {state.phase === 'wrong' ? (
                    <span className="quiz__verdict-sub">{t('feedback.wrongAns', { n: item.answer })}</span>
                  ) : null}
                </span>
                {state.phase === 'wrong' ? (
                  <button type="button" className="chip" onClick={() => setSheet(item)}>
                    {t('feedback.show')}
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        <div className="quiz__pad">
          <Keypad
            phase={state.phase}
            canSubmit={state.typed !== ''}
            onDigit={(digit) => {
              sound.tap();
              dispatch({ type: 'digit', digit, now: Date.now() });
            }}
            onBackspace={() => dispatch({ type: 'backspace' })}
            onSubmit={() => dispatch({ type: 'submit', now: Date.now() })}
            onNext={() => dispatch({ type: 'next', now: Date.now() })}
          />
        </div>
      </main>

      <Sparkles burst={burst} count={12} />

      {nudge ? (
        <div className="nudge" role="status">
          <span className="nudge__bulb" aria-hidden="true">
            💡
          </span>
          <p>{t(nudgeKey(item))}</p>
          <button type="button" className="nudge__close" onClick={() => setNudge(false)} aria-label={t('strategy.close')}>
            ✕
          </button>
        </div>
      ) : null}

      {sheet ? (
        <div className="sheet" role="dialog" aria-modal="true" aria-label={t('strategy.title')}>
          <button type="button" className="sheet__scrim" onClick={() => setSheet(null)} aria-label={t('strategy.close')} />
          <div className="sheet__panel">
            <Strategy item={sheet} />
            <button type="button" className="btn btn--primary btn--wide" onClick={() => setSheet(null)}>
              {t('strategy.close')}
            </button>
          </div>
        </div>
      ) : null}

      {leaveAsk ? (
        <div className="sheet" role="dialog" aria-modal="true" aria-label={t('quiz.backTitle')}>
          <button type="button" className="sheet__scrim" onClick={() => setLeaveAsk(false)} aria-label={t('quiz.stay')} />
          <div className="sheet__panel sheet__panel--center">
            <h2 className="sheet__title">{t('quiz.backTitle')}</h2>
            <p className="sheet__body">{t('quiz.backBody')}</p>
            <div className="sheet__actions">
              <button type="button" className="btn btn--ghost" onClick={() => setLeaveAsk(false)}>
                {t('quiz.stay')}
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  setLeaveAsk(false);
                  dispatch({ type: 'home' });
                }}
              >
                {t('quiz.leave')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
