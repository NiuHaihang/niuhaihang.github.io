import { useEffect, useMemo, useState } from 'react';
import type { Word } from '../content/types';
import type { Exercise } from '../game/exercise';
import { say } from '../lib/audio';
import { useI18n } from '../i18n/I18nProvider';

interface Props {
  exercise: Exercise;
  phase: 'ask' | 'right' | 'wrong';
  submitted: string;
  onAnswer: (value: string, correct: boolean) => void;
}

function Speaker({ text, big = false }: { text: string; big?: boolean }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      className={`speaker ${big ? 'speaker--big' : ''}`}
      aria-label={t('listenAgain')}
      onClick={() => void say(text)}
    >
      <span aria-hidden="true">🔊</span>
    </button>
  );
}

function WordCard({
  word,
  onClick,
  hideLabel = false,
}: {
  word: Word;
  onClick?: () => void;
  hideLabel?: boolean;
}) {
  return (
    <button type="button" className="wordcard" onClick={onClick} disabled={!onClick} aria-label={hideLabel ? undefined : word.en}>
      <span className="wordcard__emoji" aria-hidden="true">
        {word.emoji ?? '🔤'}
      </span>
      {hideLabel ? null : <span className="wordcard__en">{word.en}</span>}
    </button>
  );
}

function PictureExercise({ exercise, onAnswer }: { exercise: Extract<Exercise, { kind: 'picture' }>; onAnswer: Props['onAnswer'] }) {
  const { t } = useI18n();
  return (
    <div className="ex ex--picture">
      <p className="ex__prompt">{t('pickWord')}</p>
      <div className="emojibig" aria-hidden="true">
        {exercise.word.emoji ?? '🔤'}
      </div>
      <div className="options options--text">
        {exercise.options.map((option) => (
          <button key={option} type="button" className="option" onClick={() => onAnswer(option, option === exercise.answer)}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function ListenExercise({ exercise, onAnswer }: { exercise: Extract<Exercise, { kind: 'listen' }>; onAnswer: Props['onAnswer'] }) {
  const { t } = useI18n();
  useEffect(() => {
    void say(exercise.word.en, { auto: true });
  }, [exercise.word.en]);
  return (
    <div className="ex ex--listen">
      <p className="ex__prompt">{t('pickPicture')}</p>
      <Speaker text={exercise.word.en} big />
      <div className="options options--cards">
        {exercise.options.map((word) => (
          <WordCard key={word.id} word={word} hideLabel onClick={() => onAnswer(word.id, word.id === exercise.answer)} />
        ))}
      </div>
    </div>
  );
}

function ChoiceExercise({ exercise, onAnswer }: { exercise: Extract<Exercise, { kind: 'choice' }>; onAnswer: Props['onAnswer'] }) {
  const { t } = useI18n();
  return (
    <div className="ex ex--choice">
      <p className="ex__prompt">{exercise.mode === 'zh2en' ? t('pickWord') : t('pickMeaning')}</p>
      <div className="promptbox">
        <span className="promptbox__emoji" aria-hidden="true">
          {exercise.word.emoji ?? '🔤'}
        </span>
        <span className="promptbox__text">{exercise.mode === 'zh2en' ? exercise.word.zh : exercise.word.en}</span>
        {exercise.mode === 'en2zh' ? <Speaker text={exercise.word.en} /> : null}
      </div>
      <div className="options options--text">
        {exercise.options.map((option) => (
          <button key={option} type="button" className="option" onClick={() => onAnswer(option, option === exercise.answer)}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function BlankExercise({ exercise, onAnswer }: { exercise: Extract<Exercise, { kind: 'blank' }>; onAnswer: Props['onAnswer'] }) {
  const { t } = useI18n();
  const [first, ...rest] = exercise.sentence.split('___');
  return (
    <div className="ex ex--blank">
      <p className="ex__prompt">{t('blankHint')}</p>
      <p className="blankline">
        {first}
        <span className="blankline__slot">___</span>
        {rest.join('')}
      </p>
      <div className="options options--text">
        {exercise.options.map((option) => (
          <button key={option} type="button" className="option" onClick={() => onAnswer(option, option === exercise.answer)}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function SameSoundExercise({ exercise, onAnswer }: { exercise: Extract<Exercise, { kind: 'sameSound' }>; onAnswer: Props['onAnswer'] }) {
  const { t } = useI18n();
  return (
    <div className="ex ex--sound">
      <p className="ex__prompt">{t('sameSoundHint')}</p>
      <div className="promptbox">
        <span className="promptbox__emoji" aria-hidden="true">
          {exercise.word.emoji ?? '🔤'}
        </span>
        <span className="promptbox__text">{exercise.word.en}</span>
        <Speaker text={exercise.word.en} />
      </div>
      <div className="options options--text">
        {exercise.options.map((word) => (
          <button key={word.id} type="button" className="option" onClick={() => onAnswer(word.id, word.id === exercise.answer)}>
            {word.en}
          </button>
        ))}
      </div>
    </div>
  );
}

function SpellExercise({ exercise, phase, onAnswer }: { exercise: Extract<Exercise, { kind: 'spell' }>; phase: Props['phase']; onAnswer: Props['onAnswer'] }) {
  const { t } = useI18n();
  const [picked, setPicked] = useState<number[]>([]);
  const letters = exercise.letters;
  const built = picked.map((i) => letters[i]).join('');

  useEffect(() => {
    void say(exercise.word.en, { auto: true });
    setPicked([]);
  }, [exercise]);

  return (
    <div className="ex ex--spell">
      <p className="ex__prompt">{t('spellHint')}</p>
      <div className="promptbox">
        <span className="promptbox__emoji" aria-hidden="true">
          {exercise.word.emoji ?? '🔤'}
        </span>
        <span className="promptbox__text">{exercise.word.zh}</span>
        <Speaker text={exercise.word.en} />
      </div>
      <div className="slots" aria-label={built}>
        {Array.from({ length: exercise.answer.length }, (_, i) => (
          <span key={i} className="slot">
            {built[i] ?? ''}
          </span>
        ))}
      </div>
      <div className="tiles">
        {letters.map((letter, i) => (
          <button
            key={`${letter}-${i}`}
            type="button"
            className="tile"
            disabled={picked.includes(i) || phase !== 'ask'}
            onClick={() => setPicked((prev) => [...prev, i])}
          >
            {letter}
          </button>
        ))}
      </div>
      <div className="ex__actions">
        <button type="button" className="btn btn--ghost" onClick={() => setPicked([])} disabled={phase !== 'ask'}>
          {t('clear')}
        </button>
        <button
          type="button"
          className="btn btn--primary"
          disabled={built.length !== exercise.answer.length || phase !== 'ask'}
          onClick={() => onAnswer(built, built === exercise.answer)}
        >
          {t('check')}
        </button>
      </div>
    </div>
  );
}

function SentenceExercise({ exercise, phase, onAnswer }: { exercise: Extract<Exercise, { kind: 'sentence' }>; phase: Props['phase']; onAnswer: Props['onAnswer'] }) {
  const { t } = useI18n();
  const [picked, setPicked] = useState<number[]>([]);
  const built = picked.map((i) => exercise.tiles[i]).join(' ');

  useEffect(() => {
    void say(exercise.sentence, { sentence: true, auto: true });
    setPicked([]);
  }, [exercise]);

  return (
    <div className="ex ex--sentence">
      <p className="ex__prompt">{t('sentenceHint')}</p>
      <Speaker text={exercise.sentence} big />
      <div className="sentenceline">{built || '\u00a0'}</div>
      <div className="tiles tiles--words">
        {exercise.tiles.map((tile, i) => (
          <button
            key={`${tile}-${i}`}
            type="button"
            className="tile tile--word"
            disabled={picked.includes(i) || phase !== 'ask'}
            onClick={() => setPicked((prev) => [...prev, i])}
          >
            {tile}
          </button>
        ))}
      </div>
      <div className="ex__actions">
        <button type="button" className="btn btn--ghost" onClick={() => setPicked([])} disabled={phase !== 'ask'}>
          {t('clear')}
        </button>
        <button
          type="button"
          className="btn btn--primary"
          disabled={picked.length !== exercise.tiles.length || phase !== 'ask'}
          onClick={() => onAnswer(built, built === exercise.answer)}
        >
          {t('check')}
        </button>
      </div>
    </div>
  );
}

function MatchExercise({ exercise, phase, onAnswer }: { exercise: Extract<Exercise, { kind: 'match' }>; phase: Props['phase']; onAnswer: Props['onAnswer'] }) {
  const { t } = useI18n();
  const meanings = useMemo(() => [...exercise.pairs].map((p) => p.zh).sort(() => Math.random() - 0.5), [exercise]);
  const [left, setLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [misses, setMisses] = useState(0);

  useEffect(() => {
    setLeft(null);
    setMatched([]);
    setMisses(0);
  }, [exercise]);

  const tapMeaning = (zh: string) => {
    if (!left || phase !== 'ask') return;
    const pair = exercise.pairs.find((p) => p.word.en === left);
    if (pair && pair.zh === zh) {
      const next = [...matched, left];
      setMatched(next);
      setLeft(null);
      void say(left);
      if (next.length === exercise.pairs.length) onAnswer('match', misses === 0);
    } else {
      setMisses((n) => n + 1);
      setLeft(null);
    }
  };

  return (
    <div className="ex ex--match">
      <p className="ex__prompt">{matched.length === 0 ? t('matchHint') : t('tapMeaning')}</p>
      <div className="matchgrid">
        <div className="matchcol">
          {exercise.pairs.map((pair) => (
            <button
              key={pair.word.id}
              type="button"
              className={`option ${matched.includes(pair.word.en) ? 'option--done' : ''} ${left === pair.word.en ? 'option--active' : ''}`}
              onClick={() => {
                setLeft(pair.word.en);
                void say(pair.word.en);
              }}
              disabled={matched.includes(pair.word.en) || phase !== 'ask'}
            >
              {pair.word.en}
            </button>
          ))}
        </div>
        <div className="matchcol">
          {meanings.map((zh) => {
            const done = exercise.pairs.some((p) => p.zh === zh && matched.includes(p.word.en));
            return (
              <button key={zh} type="button" className={`option ${done ? 'option--done' : ''}`} onClick={() => tapMeaning(zh)} disabled={done || phase !== 'ask'}>
                {zh}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ExerciseView({ exercise, phase, onAnswer }: Props) {
  switch (exercise.kind) {
    case 'picture':
      return <PictureExercise exercise={exercise} onAnswer={onAnswer} />;
    case 'listen':
      return <ListenExercise exercise={exercise} onAnswer={onAnswer} />;
    case 'choice':
      return <ChoiceExercise exercise={exercise} onAnswer={onAnswer} />;
    case 'blank':
      return <BlankExercise exercise={exercise} onAnswer={onAnswer} />;
    case 'sameSound':
      return <SameSoundExercise exercise={exercise} onAnswer={onAnswer} />;
    case 'spell':
      return <SpellExercise exercise={exercise} phase={phase} onAnswer={onAnswer} />;
    case 'sentence':
      return <SentenceExercise exercise={exercise} phase={phase} onAnswer={onAnswer} />;
    case 'match':
      return <MatchExercise exercise={exercise} phase={phase} onAnswer={onAnswer} />;
  }
}
