import type { Exercise } from '../game/exercise';
import type { SessionState } from '../game/session';
import { useI18n } from '../i18n/I18nProvider';
import { ExerciseView } from './Exercise';
import { ChallengeTrail } from './StarCollection';

interface Props {
  state: SessionState;
  onAnswer: (value: string, correct: boolean) => void;
  onNext: () => void;
  onExit: () => void;
}

function answerText(exercise: Exercise): string {
  switch (exercise.kind) {
    case 'picture':
    case 'choice':
      return exercise.answer;
    case 'listen':
    case 'sameSound':
      return exercise.options.find((w) => w.id === exercise.answer)?.en ?? exercise.answer;
    case 'spell':
    case 'sentence':
      return exercise.answer;
    case 'blank':
      return exercise.answer;
    case 'match':
      return '';
  }
}

export function Lesson({ state, onAnswer, onNext, onExit }: Props) {
  const { lang, t } = useI18n();
  const exercise = state.exercises[state.index];
  if (!exercise) return null;
  const total = state.exercises.length;
  const isLast = state.index === total - 1;

  return (
    <div className="lesson-view">
      <header className="bar">
        <button type="button" className="iconbtn" onClick={onExit} aria-label={t('home')}>
          ←
        </button>
        <strong className="adventure-title">{state.lessonTitle}</strong>
      </header>
      {state.mode === 'challenge' ? <ChallengeTrail step={state.index} count={total} stars={state.answers.filter((answer) => answer.correct).length} lang={lang} /> :
        <div className="learning-progress"><span>{t('questionOf', { i: state.index + 1, n: total })}</span>
          <progress value={state.index} max={total} aria-label={t('lessonProgress')} /></div>}

      <main className="stage">
        <ExerciseView exercise={exercise} phase={state.phase} submitted={state.submitted} onAnswer={onAnswer} />
      </main>

      <footer className={`feedback feedback--${state.phase}`}>
        {state.phase === 'ask' ? (
          <span className="feedback__hint">{t('takeTime')}</span>
        ) : (
          <>
            <div className="feedback__msg">
              <strong>{state.phase === 'right' ? t('right') : t('wrong')}</strong>
              {state.phase === 'wrong' ? <span>{t('answerIs', { answer: answerText(exercise) })}</span> : null}
            </div>
            <button type="button" className="btn btn--primary" onClick={onNext} autoFocus>
              {isLast ? t('finish') : t('next')}
            </button>
          </>
        )}
      </footer>
    </div>
  );
}
