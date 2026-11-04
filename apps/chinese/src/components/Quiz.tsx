import { useState } from 'react';
import type { Answer, Question } from '../game';
import { Mascot } from '../../../english/src/components/Mascot';
import { Speaker } from './Speaker';

interface Props {
  questions: Question[];
  sound: boolean;
  onFinish: (answers: Answer[]) => void;
  onHome: () => void;
}

export function Quiz({ questions, sound, onFinish, onHome }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [choice, setChoice] = useState('');
  const [hint, setHint] = useState(!sound);
  const question = questions[index]!;
  const { target } = question;
  const correct = choice === target.char;

  function next() {
    if (index === questions.length - 1) onFinish(answers);
    else {
      setIndex(index + 1);
      setChoice('');
      setHint(!sound);
    }
  }

  return (
    <div className="lesson-view">
      <header className="bar">
        <button type="button" className="pillbtn pillbtn--text" onClick={onHome}>← 首页</button>
        <div className="bar__progress" role="progressbar" aria-label="闯关进度"
          aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={answers.length}>
          <div className="bar__fill" style={{ width: `${answers.length / questions.length * 100}%` }} />
        </div>
        <span className="bar__count">{index + 1} / {questions.length}</span>
      </header>

      <section className="stage">
        <div className="ex" key={question.id}>
          <h1 className="ex__prompt">
            {question.kind === 'word' ? '选一个字，组成词语' : hint ? '看拼音，选出汉字' : '听一听，选出词语中的生字'}
          </h1>
          {question.kind === 'listen' ? (
            <div className="listening-cue">
              {sound ? <Speaker text={target.word} label="听词语" onUnavailable={() => setHint(true)} /> : null}
              {hint ? (
                <p className="quiz-pinyin" aria-label="拼音提示">{target.pinyin}</p>
              ) : (
                <button type="button" className="pillbtn pillbtn--text" onClick={() => setHint(true)}>看看拼音</button>
              )}
            </div>
          ) : (
            <div className="word-cue">
              <p className="quiz-pinyin">{target.pinyin}</p>
              <p>{target.word.split(target.char).join('＿')}</p>
            </div>
          )}
          <div className="options options--text hanzi-options" aria-label="汉字选项">
            {question.options.map((char) => (
              <button
                type="button"
                key={char}
                disabled={choice !== ''}
                className={`option hanzi-option ${choice && char === target.char ? 'is-correct' : ''} ${choice === char && !correct ? 'is-wrong' : ''}`}
                onClick={() => {
                  setChoice(char);
                  setAnswers([...answers, { questionId: question.id, choice: char, correct: char === target.char }]);
                }}
              >
                {char}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className={`feedback ${choice ? correct ? 'feedback--right' : 'feedback--wrong' : 'feedback--ask'}`}>
        <Mascot size={64} mood={choice ? correct ? 'cheer' : 'oops' : 'idle'} label="麻薯小兔" />
        <div className="feedback__msg" aria-live="polite">
          {choice ? (
            <>
              <strong>{correct ? '认对啦，真棒！' : `再认识一下：${target.char}（${target.pinyin}）`}</strong>
              <span>{target.word}{target.sentence ? ` · ${target.sentence}` : ''}</span>
            </>
          ) : <span>仔细认一认，选出你认识的字。</span>}
        </div>
        {choice ? (
          <button type="button" className="btn btn--primary" onClick={next}>
            {index === questions.length - 1 ? '看看收获' : '下一题 →'}
          </button>
        ) : null}
      </div>
    </div>
  );
}
