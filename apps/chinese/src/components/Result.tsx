import { missedCharacters, type Answer, type Question } from '../game';
import { starsFor } from '../../../english/src/game/session';
import { Mascot } from '../../../english/src/components/Mascot';
import type { Character } from '../content';
import { Speaker } from './Speaker';

interface Props {
  title: string;
  isReview: boolean;
  questions: Question[];
  answers: Answer[];
  sound: boolean;
  onReview: (characters: Character[]) => void;
  onAgain: () => void;
  onHome: () => void;
}

export function Result({ title, isReview, questions, answers, sound, onReview, onAgain, onHome }: Props) {
  const correct = answers.filter((answer) => answer.correct).length;
  const accuracy = correct / answers.length;
  const stars = starsFor(accuracy);
  const missed = missedCharacters(questions, answers);
  return (
    <div className="result">
      <Mascot size={130} mood={stars === 3 ? 'cheer' : 'idle'} label="麻薯小兔" />
      <h1 className="result__title">又有新收获！</h1>
      <p className="result__lesson">{title} · 闯关完成</p>
      <div className="stars" aria-label={`本次获得 ${stars} 颗星，共 3 颗`}>
        {[1, 2, 3].map((star) => <span key={star} className={`star star--big ${star <= stars ? 'star--on' : ''}`}>★</span>)}
      </div>
      <div className="result__stats">
        <div className="stat">
          <span className="stat__value">{Math.round(accuracy * 100)}%</span>
          <span className="stat__label">正确率</span>
        </div>
        <div className="stat">
          <span className="stat__value">{correct}/{answers.length}</span>
          <span className="stat__label">答对题目</span>
        </div>
        <div className="stat">
          <span className="stat__value">{new Set(questions.map((question) => question.target.char)).size}</span>
          <span className="stat__label">练习汉字</span>
        </div>
      </div>

      {missed.length > 0 ? (
        <section className="missed">
          <h2 className="section-title">这些字，再看一眼</h2>
          <ul className="missed__list">
            {missed.map((character) => (
              <li className="missed__row" key={character.id}>
                <div className="missed__text">
                  <strong className="missed-character">{character.char} <small>{character.pinyin}</small></strong>
                  <span>{character.word}{character.sentence ? ` · ${character.sentence}` : ''}</span>
                </div>
                {sound ? <Speaker text={`${character.char}。${character.word}`} /> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : <p>这些字都认对了，继续保持！</p>}

      <div className="result__actions">
        {missed.length > 0 ? <button type="button" className="btn btn--primary" onClick={() => onReview(missed)}>再练错字</button> : null}
        <button type="button" className={`btn ${missed.length ? 'btn--ghost' : 'btn--primary'}`} onClick={onAgain}>
          {isReview ? '再练一次' : '再学一次'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onHome}>回首页</button>
      </div>
    </div>
  );
}
