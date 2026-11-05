import type { Exercise } from '../game/exercise';
import type { Summary } from '../game/session';
import { useI18n } from '../i18n/I18nProvider';
import { say } from '../lib/audio';
import { Mascot } from './Mascot';
import { StarCollection, StarReward } from './StarCollection';

interface Props {
  summary: Summary;
  totalStars: number;
  rewardTotal: number;
  exercises: Exercise[];
  lessonTitle: string;
  isReview: boolean;
  isChallenge: boolean;
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

export function Result({ summary, totalStars, rewardTotal, exercises, lessonTitle, isReview, isChallenge, onAgain, onHome }: Props) {
  const { lang, t } = useI18n();
  const missedRows = summary.missed.map((record) => ({
    record,
    exercise: exercises.find((e) => e.id === record.exerciseId),
  }));

  return (
    <div className={`result ${isChallenge ? '' : 'result--learning'}`}>
      <Mascot mood="cheer" size={130} />
      <h1 className="result__title">{t(isChallenge ? 'challengeDone' : 'resultTitle')}</h1>
      <p className="result__lesson">{isReview ? t('reviewDone') : lessonTitle}</p>

      <StarReward total={rewardTotal} correct={summary.correct} lang={lang} />

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
      <StarCollection total={totalStars} lang={lang} compact />

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
