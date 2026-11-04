import { useState } from 'react';
import type { Unit } from '../content';
import { Speaker } from './Speaker';

interface Props {
  unit: Unit;
  sound: boolean;
  onQuiz: () => void;
  onHome: () => void;
}

export function Learn({ unit, sound, onQuiz, onHome }: Props) {
  const [index, setIndex] = useState(0);
  const [pinyin, setPinyin] = useState(false);
  const character = unit.characters[index]!;
  const last = index === unit.characters.length - 1;
  return (
    <div className="lesson-view">
      <header className="bar">
        <button type="button" className="pillbtn pillbtn--text" onClick={onHome}>← 首页</button>
        <strong>{unit.title}</strong>
        <span className="bar__count">{index + 1} / {unit.characters.length}</span>
      </header>
      <section className="character-study" aria-labelledby="learn-title">
        <h1 id="learn-title">认识这个字</h1>
        <div className="character-study__pinyin" aria-label="拼音">{pinyin ? character.pinyin : '· · ·'}</div>
        <div className="character-grid"><span>{character.char}</span></div>
        <button type="button" className="pillbtn pillbtn--text" aria-pressed={pinyin} onClick={() => setPinyin(!pinyin)}>
          {pinyin ? '藏起拼音，认一认' : '看看拼音'}
        </button>
        <div className="character-example" key={character.id}>
          <h2>{character.word}</h2>
          {character.sentence ? <p>{character.sentence}</p> : null}
          {sound ? <Speaker text={character.word} sentence={character.sentence} label="听词语" /> : null}
        </div>
      </section>
      <div className="study-actions">
        <button type="button" className="btn btn--ghost" disabled={index === 0} onClick={() => {
          setIndex(index - 1);
          setPinyin(false);
        }}>上一个字</button>
        <button type="button" className="btn btn--primary" onClick={() => {
          if (last) {
            onQuiz();
          } else {
            setIndex(index + 1);
            setPinyin(false);
          }
        }}>
          {last ? '学好了，去闯关 →' : '下一个字 →'}
        </button>
      </div>
    </div>
  );
}
