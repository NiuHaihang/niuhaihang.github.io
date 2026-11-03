import { useMemo, useState } from 'react';
import { Mascot, mascotMood } from './Mascot';
import { Sparkles } from './Sparkles';
import { Stars } from './Stars';
import { Strategy } from './Strategy';
import { summarize } from '../game/scoring';
import { randomSeed } from '../game/rng';
import type { Action, SessionState } from '../game/session';
import type { Item } from '../game/types';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';

interface ResultProps {
  state: SessionState;
  dispatch: (action: Action) => void;
}

export function Result({ state, dispatch }: ResultProps) {
  const { t } = useI18n();
  const [sheet, setSheet] = useState<Item | null>(null);
  const [burst] = useState(1);

  const summary = useMemo(() => {
    if (!state.round) return null;
    return summarize(state.round, state.answers, state.startedAt, state.finishedAt ?? Date.now());
  }, [state.round, state.answers, state.startedAt, state.finishedAt]);

  if (!summary) return null;

  const pct = Math.round(summary.accuracy * 100);
  const isPractice = state.mode === 'practice';

  return (
    <div className="screen result">
      <Sparkles burst={burst} count={18} />

      <section className="result__hero">
        <div className="result__mascot">
          <Mascot mood={mascotMood(summary.accuracy)} size={150} />
        </div>
        <h1 className="result__title">{isPractice ? t('result.practiceDone') : t('result.title')}</h1>
        <Stars count={summary.stars} size={56} animate />
        <p className="result__pct">{t('result.pct', { n: pct })}</p>
        <p className="result__time">
          {t('result.time', {
            m: Math.floor(summary.ms / 60000),
            s: String(Math.round(summary.ms / 1000) % 60).padStart(2, '0'),
          })}
        </p>
      </section>

      <section className="result__panel">
        <h2 className="section-title">{t('result.skills')}</h2>
        <ul className="skilllist">
          {summary.skills.map((row) => {
            const ratio = row.total === 0 ? 0 : row.correct / row.total;
            return (
              <li key={row.skill} className="skillrow">
                <span className="skillrow__label">{t(`skill.${row.skill}` as StringKey)}</span>
                <span className="skillrow__bar" aria-hidden="true">
                  <i style={{ width: `${Math.round(ratio * 100)}%` }} />
                </span>
                <span className="skillrow__count">
                  {row.correct}/{row.total}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="result__panel">
        <h2 className="section-title">{t('result.mistakes')}</h2>
        {summary.mistakes.length === 0 ? (
          <p className="result__none">🌸 {t('result.noMistakes')}</p>
        ) : (
          <ul className="mistakes">
            {summary.mistakes.map(({ item, typed }) => (
              <li key={item.id} className="mistake">
                <span className="mistake__eq">
                  {item.a} {item.op === '+' ? '+' : '−'} {item.b} ={' '}
                  <b>{item.total}</b>
                </span>
                <span className="mistake__typed">{t('result.youWrote', { n: typed })}</span>
                <button type="button" className="chip" onClick={() => setSheet(item)}>
                  {t('result.review')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="result__actions">
        <button
          type="button"
          className="btn btn--primary btn--xl"
          onClick={() => dispatch({ type: 'playAgain', seed: randomSeed(), now: Date.now() })}
        >
          {t('result.playAgain')}
        </button>

        {summary.weakest ? (
          <button
            type="button"
            className="btn btn--soft"
            onClick={() =>
              dispatch({
                type: 'startPractice',
                skill: summary.weakest!,
                seed: randomSeed(),
                now: Date.now(),
              })
            }
          >
            {t('result.practice')} · {t(`skill.${summary.weakest}` as StringKey)}
          </button>
        ) : null}

        <button type="button" className="btn btn--ghost" onClick={() => dispatch({ type: 'home' })}>
          {t('result.home')}
        </button>
      </div>

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
    </div>
  );
}
