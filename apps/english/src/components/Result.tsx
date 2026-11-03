import type { Exercise } from '../game/exercise';
import type { Summary } from '../game/session';
import { useI18n } from '../i18n/I18nProvider';
import { say } from '../lib/audio';
import { Mascot } from './Mascot';

interface Props {
  summary: Summary;
  exercises: Exercise[];
  lessonTitle: string;
  isReview: boolean;
  onAgain: () => void;
  onHome: () => void;
}

/** What the row should say for an exercise, without any English prose. */
function promptOf(exercise: Exercise): string {
  switch (exercise.kind) {
    case 'picture':
    case 'listen':
    case 'sameSound':
    case 'spell':
      return exercise.word.zh;
    case 'choice':
      return exercise.mode === 'zh2en' ? exercise.word.zh : exercise.word.en;
    case 'sentence':
      return exercise.sentence;
    case 'blank':
      return exercise.sentence;
    case 'match':
      return exercise.pairs.map((p) => p.zh).join(' · ');
  }
}

function answerOf(exercise: Exercise): string {
  switch (exercise.kind) {
    case 'picture':
    case 'choice':
      return exercise.answer;
    case 'listen':
    case 'sameSound':
      return exercise.options.find((w) => w.id === exercise.answer)?.en ?? exercise.word.en;
    case 'spell':
    case 'sentence':
    case 'blank':
      return exercise.answer;
    case 'match':
      return exercise.pairs.map((p) => p.word.en).join(' · ');
  }
}

function speakable(exercise: Exercise): string | null {
  switch (exercise.kind) {
    case 'picture':
    case 'choice':
    case 'spell':
      return exercise.word.en;
    case 'listen':
    case 'sameSound':
      return exercise.word.en;
    case 'sentence':
      return exercise.sentence;
    case 'blank':
      return null;
    case 'match':
      return null;
  }
}

export function Result({ summary, exercises, lessonTitle, isReview, onAgain, onHome }: Props) {
  const { t } = useI18n();
  const pct = Math.round(summary.accuracy * 100);
  const missedRows = summary.missed.map((record) => ({
    record,
    exercise: exercises.find((e) => e.id === record.exerciseId),
  }));
  const seconds = Math.max(1, Math.round(summary.ms / 1000));

  return (
    <div className="result">
      <Mascot mood={summary.stars === 3 ? 'cheer' : 'idle'} size={130} />
      <h1 className="result__title">{t('resultTitle')}</h1>
      <p className="result__lesson">{isReview ? t('reviewDone') : lessonTitle}</p>

      <div className="stars" aria-label={t('stars')}>
        {[1, 2, 3].map((i) => (
          <span key={i} className={`star star--big ${i <= summary.stars ? 'star--on' : ''}`}>
            ★
          </span>
        ))}
      </div>

      <div className="result__stats">
        <div className="stat">
          <span className="stat__value">{pct}%</span>
          <span className="stat__label">{t('accuracy')}</span>
        </div>
        <div className="stat">
          <span className="stat__value">
            {summary.correct}/{summary.total}
          </span>
          <span className="stat__label">{t('lessonDone')}</span>
        </div>
        <div className="stat">
          <span className="stat__value">{seconds}s</span>
          <span className="stat__label">{t('time')}</span>
        </div>
      </div>

      {missedRows.length > 0 ? (
        <section className="missed">
          <h2 className="section-title">{t('missed')}</h2>
          <ul className="missed__list">
            {missedRows.map(({ record, exercise }) => {
              const clip = exercise ? speakable(exercise) : null;
              return (
                <li key={record.exerciseId} className="missed__row">
                  <div className="missed__text">
                    <span className="missed__prompt">{exercise ? promptOf(exercise) : ''}</span>
                    {exercise && record.submitted && record.submitted !== answerOf(exercise) ? (
                      <span className="missed__answer missed__answer--wrong">
                        <small>{t('yourAnswer')}</small> <s>{record.submitted}</s>
                      </span>
                    ) : null}
                    {exercise ? (
                      <span className="missed__answer">
                        <small>{t('correctAnswer')}</small> <b>{answerOf(exercise)}</b>
                      </span>
                    ) : null}
                  </div>
                  {clip ? (
                    <button
                      type="button"
                      className="speaker speaker--small"
                      aria-label={t('listenAgain')}
                      onClick={() => say(clip, { sentence: clip.includes(' ') })}
                    >
                      🔊
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div className="result__actions">
        <button type="button" className="btn btn--primary" onClick={onAgain}>
          {t('playAgain')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onHome}>
          {t('home')}
        </button>
      </div>
    </div>
  );
}
