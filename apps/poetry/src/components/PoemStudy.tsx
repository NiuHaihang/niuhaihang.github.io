import { useState } from 'react';
import type { Poem } from '../content';
import { PoemAudio } from './PoemAudio';

interface Props { poem: Poem; sound: boolean; onHome: () => void; onQuiz: () => void }

export function PoemStudy({ poem, sound, onHome, onQuiz }: Props) {
  const [pinyin, setPinyin] = useState(false);
  const [recite, setRecite] = useState(false);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [line, setLine] = useState(0);

  return <div className="lesson-view poem-study">
    <header className="bar"><button type="button" className="pillbtn pillbtn--text" onClick={onHome}>← 诗词首页</button><strong>读一读，背一背</strong></header>
    <div className="poem-tools">
      <button type="button" className="pillbtn pillbtn--text" aria-pressed={pinyin} disabled={recite}
        onClick={() => setPinyin(!pinyin)}>{pinyin ? '藏起拼音' : '看看拼音'}</button>
      <button type="button" className="pillbtn pillbtn--text" aria-pressed={recite}
        onClick={() => { setRecite(!recite); setPinyin(false); setRevealed([]); }}>{recite ? '返回读诗' : '藏起原文，背一背'}</button>
    </div>
    <article className="poem-paper" aria-labelledby="poem-title">
      <span className="poem-paper__flower" aria-hidden="true">🌸</span>
      <h1 id="poem-title">{poem.title}</h1><p className="poem-byline">〔{poem.era}〕{poem.author}</p>
      <p className="poem-instruction">{recite ? '试着自己背；想不起来时，点一句看看。' : '点选一句，再听一听它的读音。'}</p>
      <div className={`poem-verses ${pinyin ? 'has-pinyin' : ''}`}>
        {poem.lines.map((verse, index) => {
          const hidden = recite && !revealed.includes(index);
          return <button type="button" key={index} className={`poem-verse ${line === index ? 'is-current' : ''}`}
            aria-label={hidden ? `显示第 ${index + 1} 句` : `第 ${index + 1} 句：${verse.text}`}
            aria-pressed={line === index}
            onClick={() => { setLine(index); if (hidden) setRevealed([...revealed, index]); }}>
            {hidden ? <span className="poem-verse__hidden">第 {index + 1} 句 · 点一下提示</span> : [...verse.text].map((character, i) => (
              <ruby key={i}>{character}{pinyin && verse.pinyin[i] ? <rt>{verse.pinyin[i]}</rt> : null}</ruby>
            ))}
          </button>;
        })}
      </div>
    </article>
    {sound ? <PoemAudio poemId={poem.id} line={line} /> : <p className="poem-instruction">朗读已关闭，可回首页开启。</p>}
    {!recite ? <section className="poem-meaning" aria-labelledby="meaning-title"><h2 id="meaning-title">诗里说了什么？</h2><p>{poem.meaning}</p></section> : null}
    <div className="poem-bottom"><p>不用着急，读熟了再试一试。</p><button type="button" className="btn btn--primary" onClick={onQuiz}>读好了，去闯关 →</button></div>
  </div>;
}
