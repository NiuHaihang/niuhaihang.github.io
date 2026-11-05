import { useState } from 'react';
import type { Poem } from '../content';
import { buildRound, isCorrect } from '../game';
import { randomSeed } from '../../../english/src/game/rng';
import { Mascot } from '../../../english/src/components/Mascot';
import { ChallengeTrail, StarCollection, StarReward } from '../../../english/src/components/StarCollection';

interface Props {
  poem: Poem;
  totalStars: number;
  onHome: () => void;
  onStudy: () => void;
  onAgain: () => void;
  onNext: () => void;
  onFinish: (correct: number, total: number, token: string) => number;
}

export function PoemQuiz({ poem, totalStars, onHome, onStudy, onAgain, onNext, onFinish }: Props) {
  const [token] = useState(() => crypto.randomUUID());
  const [questions] = useState(() => buildRound(poem, randomSeed()));
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<string | string[]>('');
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  // Freeze this round's celebration while the shared collection stays live.
  const [finished, setFinished] = useState<number | null>(null);
  const question = questions[index]!;
  const correct = isCorrect(question, choice);
  const picked = Array.isArray(choice) ? choice : [];
  const ready = question.kind === 'order' ? picked.length === question.options.length : choice !== '';

  if (finished !== null) return <div className="poem-result">
    <Mascot size={140} mood="cheer" label="开心的麻薯小兔" />
    <h1>又和一首诗交上朋友啦！</h1><p>{poem.title}</p>
    <StarReward total={finished} correct={correctCount} lang="zh" />
    <StarCollection total={totalStars} lang="zh" compact />
    <p className="poem-instruction">也可以请家人听你背一遍。</p>
    <div className="poem-audio__buttons"><button type="button" className="btn btn--primary" onClick={onNext}>下一关 🐾</button><button type="button" className="btn btn--ghost" onClick={onAgain}>再闯一次</button><button type="button" className="btn btn--ghost" onClick={onStudy}>回去再读读</button><button type="button" className="btn btn--ghost" onClick={onHome}>回诗词首页</button></div>
  </div>;

  return <div className="lesson-view poem-quiz">
    <header className="bar"><button type="button" className="pillbtn pillbtn--text" onClick={onHome}>← 诗词首页</button><strong>诗词小闯关</strong><button type="button" className="pillbtn pillbtn--text" onClick={onStudy}>读一读</button></header>
    <ChallengeTrail step={index} count={questions.length} stars={correctCount + Number(checked && correct)} lang="zh" />
    <section className="poem-question" aria-labelledby="question-title">
      <span className="poem-card__tag">{poem.title}</span>
      <h1 id="question-title">{question.kind === 'next' ? '下一句是什么？' : question.kind === 'blank' ? '这句少了哪个字？' : question.prompt}</h1>
      {question.kind === 'next' || question.kind === 'blank' ? <p className="poem-question__verse">{question.prompt}</p> : null}
      {question.kind === 'order' ? <div className="poem-order">
        <ol aria-label="你排好的诗句">{picked.map((text) => <li key={text}>{text}</li>)}</ol>
        <div className="poem-order__choices">{question.options.map((option) => <button type="button" className="btn btn--ghost" key={option}
          disabled={checked || picked.includes(option)} onClick={() => setChoice([...picked, option])}>{option}</button>)}</div>
        <button type="button" className="pillbtn pillbtn--text" disabled={checked || picked.length === 0} onClick={() => setChoice(picked.slice(0, -1))}>撤回一句</button>
      </div> : <div className={`poem-choices ${question.kind === 'meaning' ? 'poem-choices--meaning' : ''}`}>
        {question.options.map((option) => <button type="button" className={`poem-choice ${choice === option ? 'is-selected' : ''}`} key={option}
          disabled={checked} aria-pressed={choice === option} onClick={() => setChoice(option)}>{option}</button>)}
      </div>}
    </section>
    {checked ? <div className={`poem-feedback ${correct ? 'is-correct' : ''}`} role="status">
      <strong>{correct ? '⭐ 点亮一颗星光！' : '发现一个新线索，再读一遍就更熟啦。'}</strong>
      {!correct ? <p>正确答案：{question.kind === 'order' ? question.answer.join('，') : question.answer}</p> : null}
    </div> : null}
    <div className="poem-bottom"><p>离开未完成的闯关不会记星星。</p>
      <button type="button" className="btn btn--primary" disabled={!ready} onClick={() => {
        if (!checked) { setChecked(true); return; }
        const totalCorrect = correctCount + Number(correct);
        if (index === questions.length - 1) {
          const savedTotal = onFinish(totalCorrect, questions.length, token);
          setCorrectCount(totalCorrect);
          setFinished(savedTotal);
          window.scrollTo({ top: 0 });
        } else {
          setCorrectCount(totalCorrect); setIndex(index + 1); setChecked(false); setChoice('');
          window.scrollTo({ top: 0 });
        }
      }}>{!checked ? '试试看' : index === questions.length - 1 ? '收集星光' : '继续冒险 →'}</button>
    </div>
  </div>;
}
