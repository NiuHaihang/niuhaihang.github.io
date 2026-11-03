import { useState } from 'react';
import { Mascot } from './Mascot';
import { Stars } from './Stars';
import { LEVELS } from '../game/levels';
import { TRACKS, type LevelId, type Track } from '../game/types';
import type { Progress } from '../lib/storage';
import { slotKey, streakLength } from '../lib/storage';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';

interface HomeProps {
  progress: Progress;
  selected: LevelId;
  track: Track;
  onSetTrack: (track: Track) => void;
  onSetLevel: (level: LevelId) => void;
  onStart: () => void;
  onPrint: () => void;
  onToggleSound: () => void;
  onToggleLang: () => void;
  onReset: () => void;
}

const FLOWERS: Record<LevelId, string> = {
  sprout: '🌱',
  blossom: '🌸',
  sparkle: '✨',
  starlight: '🌙',
};

const OPS: Record<Track, string> = {
  addsub: '+ −',
  all4: '+ − × ÷',
};

export function Home({
  progress,
  selected,
  track,
  onSetTrack,
  onSetLevel,
  onStart,
  onPrint,
  onToggleSound,
  onToggleLang,
  onReset,
}: HomeProps) {
  const { t } = useI18n();
  const [confirmReset, setConfirmReset] = useState(false);
  const streak = streakLength(progress.days);
  const totalStars = Object.values(progress.stars).reduce((sum, n) => sum + n, 0);

  return (
    <div className="screen home">
      <header className="home__top">
        <span className="brand">
          <span className="brand__ear" aria-hidden="true" />
          {t('app.name')}
        </span>

        <div className="home__tools">
          <button
            type="button"
            className="iconbtn iconbtn--soft"
            onClick={onToggleSound}
            aria-label={progress.sound ? t('home.soundOn') : t('home.soundOff')}
            title={progress.sound ? t('home.soundOn') : t('home.soundOff')}
          >
            <span aria-hidden="true">{progress.sound ? '🔔' : '🔕'}</span>
          </button>
          <button type="button" className="iconbtn iconbtn--soft iconbtn--text" onClick={onToggleLang}>
            {t('home.lang')}
          </button>
          <button
            type="button"
            className={`iconbtn iconbtn--soft iconbtn--text ${confirmReset ? 'is-danger' : ''}`}
            onClick={() => {
              if (!confirmReset) {
                setConfirmReset(true);
                window.setTimeout(() => setConfirmReset(false), 3000);
                return;
              }
              setConfirmReset(false);
              onReset();
            }}
          >
            {confirmReset ? t('home.resetConfirm') : t('home.reset')}
          </button>
        </div>
      </header>

      <section className="home__hero">
        <div className="home__mochi">
          <Mascot mood="idle" size={168} />
        </div>
        <div className="home__bubble">
          <span className="home__hello">{t('home.hello')}</span>
          <h1>{t('home.title')}</h1>
          <p>{t('home.subtitle')}</p>
          <div className="home__pills">
            <span className="pill">
              ⭐ <b>{totalStars}</b> {t('home.stars')}
            </span>
            {streak > 0 ? (
              <span className="pill pill--warm">
                🔥 <b>{streak}</b>{' '}
                {streak === 1 ? t('home.streakOne') : t('home.streak', { n: streak })}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="home__tracks">
        <h2 className="section-title">{t('home.quizSet')}</h2>
        <div className="tracks" role="radiogroup" aria-label={t('home.quizSet')}>
          {TRACKS.map((id) => {
            const active = id === track;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                className={`track track--${id} ${active ? 'is-selected' : ''}`}
                onClick={() => onSetTrack(id)}
              >
                <span className="track__ops" aria-hidden="true">
                  {OPS[id]}
                </span>
                <span className="track__text">
                  <span className="track__name">{t(id === 'addsub' ? 'track.addsub' : 'track.all4')}</span>
                  <span className="track__sub">
                    {t(id === 'addsub' ? 'track.addsub.sub' : 'track.all4.sub')}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="home__levels">
        <h2 className="section-title">{t('home.pick')}</h2>
        <div className="levels" role="radiogroup" aria-label={t('home.pick')}>
          {LEVELS.map((level) => {
            const active = level.id === selected;
            const key = slotKey(track, level.id);
            const best = progress.best[key] ?? 0;
            const stars = progress.stars[key] ?? 0;
            const subKey = (track === 'all4' ? `level.${level.id}.sub4` : `level.${level.id}.sub`) as StringKey;
            return (
              <button
                key={level.id}
                type="button"
                role="radio"
                aria-checked={active}
                className={`level level--${level.accent} ${active ? 'is-selected' : ''}`}
                onClick={() => onSetLevel(level.id)}
              >
                <span className="level__flower" aria-hidden="true">
                  {FLOWERS[level.id]}
                </span>
                <span className="level__name">{t(`level.${level.id}` as StringKey)}</span>
                <span className="level__sub">{t(subKey)}</span>
                <span className="level__stars">
                  <Stars count={stars} size={16} />
                </span>
                {best > 0 ? <span className="level__best">{best}%</span> : null}
              </button>
            );
          })}
        </div>
        {streak > 0 ? <p className="home__streak-note">{t('home.loginStreak')}</p> : null}
      </section>

      <div className="home__actions">
        <button type="button" className="btn btn--primary btn--xl" onClick={onStart}>
          {t('home.start')}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button type="button" className="btn btn--ghost" onClick={onPrint}>
          🖨️ {t('home.print')}
        </button>
      </div>
    </div>
  );
}
