import { useState } from 'react';
import { BOOKS, GRADES, UNITS, type Grade, type Term, type Unit } from '../content';
import type { Progress } from '../lib/storage';
import { streakLength } from '../../../english/src/lib/storage';
import { Mascot } from '../../../english/src/components/Mascot';

interface Props {
  progress: Progress;
  onGrade: (grade: Grade) => void;
  onTerm: (term: Term) => void;
  onStart: (unit: Unit) => void;
  onReview: () => void;
  onToggleSound: () => void;
}

export function Home({ progress, onGrade, onTerm, onStart, onReview, onToggleSound }: Props) {
  const [page, setPage] = useState(0);
  const book = BOOKS.find((book) => book.grade === progress.grade && book.term === progress.term)!;
  const units = UNITS.filter((unit) => unit.bookId === book.id);
  const pages = Math.ceil(units.length / 12);
  const visibleUnits = units.slice(page * 12, page * 12 + 12);
  const next = units.find((unit) => !progress.stars[unit.id]) ?? units[0]!;
  const totalStars = Object.values(progress.stars).reduce((sum, stars) => sum + stars, 0);
  const streak = streakLength(progress.days);
  return <div className="home">
    <header className="home__top">
      <div className="brand">
        <Mascot size={44} label="麻薯小兔" />
        <span className="brand__name">小兔语文</span>
      </div>
      <nav className="subjects" aria-label="学习科目">
        <a href={`${import.meta.env.BASE_URL}../`}>学数学</a>
        <a href={`${import.meta.env.BASE_URL}../english/`}>学英语</a>
        <a href={import.meta.env.BASE_URL} aria-current="page">学语文</a>
      </nav>
      <button type="button" className="pillbtn" onClick={onToggleSound} aria-label={progress.sound ? '关闭朗读' : '开启朗读'}>
        {progress.sound ? '🔔' : '🔕'}
      </button>
    </header>
    <section className="hero">
      <Mascot size={168} className="hero__mascot" label="麻薯小兔" />
      <div className="hero__text">
        <p className="hero__hi">你好，小小识字家！</p>
        <h1 className="hero__title">一起认识汉字吧！</h1>
        <p className="hero__subtitle">听一听，认一认，每天学会几个字。</p>
        <div className="hero__pills">
          <span className="pill">⭐ {totalStars} 颗星星</span>
          <span className="pill pill--warm">🌱 练过 {progress.studied.length} 个字</span>
          {streak > 0 ? <span className="pill">🔥 连续 {streak} 天</span> : null}
        </div>
      </div>
    </section>
    <div className="study-layout">
      <aside className="study-settings" aria-label="学习选择">
        <section className="picker">
          <h2 className="section-title">你上几年级？</h2>
          <div className="grades" role="radiogroup" aria-label="选择年级">
            {GRADES.map((grade) => (
              <button
                type="button"
                role="radio"
                aria-checked={progress.grade === grade}
                className={`grade ${progress.grade === grade ? 'is-selected' : ''}`}
                key={grade}
                onClick={() => onGrade(grade)}
              >
                {grade} 年级
              </button>
            ))}
          </div>
        </section>
        <section className="book-picker" aria-label="选择学期">
          <h2 className="section-title">学哪一册？</h2>
          <div className="terms" role="radiogroup" aria-label="选择上下册">
            {(['upper', 'lower'] as const).map((term) => (
              <button type="button" role="radio" aria-checked={progress.term === term}
                className={`pillbtn pillbtn--text ${progress.term === term ? 'is-selected' : ''}`}
                key={term} onClick={() => onTerm(term)}>{term === 'upper' ? '上册' : '下册'}</button>
            ))}
          </div>
          <div className="content-note book-picker__info">
            <strong>人教版语文</strong>
            <span>{book.list} · {book.newCharacters} 个{book.list === '识字表' ? '新字' : '字'}</span>
            {book.characters.length > book.newCharacters ? <span>另含 {book.characters.length - book.newCharacters} 个多音字学习项</span> : null}
          </div>
        </section>
      </aside>
      <div className="study-content">
        <div className="learning-plan">
          <section className="next-lesson" aria-labelledby="next-title">
            <span className="next-lesson__picture" aria-hidden="true">{next.icon}</span>
            <div className="next-lesson__text">
              <h2 id="next-title">{progress.stars[next.id] ? '再来巩固一下' : '今天从这里开始'}</h2>
              <h3>{next.title}</h3>
              <p>认识 {next.characters.length} 个字 · 再来闯一关</p>
            </div>
            <button type="button" className="btn btn--primary" onClick={() => onStart(next)}>开始认字 →</button>
          </section>
          <button
            type="button"
            className={`review-card ${progress.mistakes.length ? 'is-ready' : ''}`}
            disabled={progress.mistakes.length === 0}
            onClick={onReview}
          >
            <span className="review-card__icon" aria-hidden="true">🔁</span>
            <span className="review-card__text">
              <strong>错字小口袋</strong>
              <small>{progress.mistakes.length ? `${progress.mistakes.length} 个字，再认识一下` : '错过的字会收在这里'}</small>
            </span>
          </button>
        </div>
        <section className="course-list" aria-labelledby="units-title">
          <div className="course-list__heading">
            <h2 className="section-title" id="units-title">识字小乐园</h2>
            <span>{units.length} 组 · 每组最多 6 个字</span>
          </div>
          <div className="lessons">
            {visibleUnits.map((unit) => (
              <button type="button" className="lesson" key={unit.id} onClick={() => onStart(unit)}>
                <span className="lesson__icon" aria-hidden="true">{unit.icon}</span>
                <span className="lesson__title">{unit.title}</span>
                <span className="lesson__zh character-preview">
                  {unit.characters.map((character) => <span key={character.id}>{character.char}</span>)}
                </span>
                <span className="lesson__foot">
                  <span className="lesson__stars" aria-label={`已获得 ${progress.stars[unit.id] ?? 0} 颗星，共 3 颗`}>
                    {[1, 2, 3].map((star) => (
                      <span key={star} className={`star ${star <= (progress.stars[unit.id] ?? 0) ? 'star--on' : ''}`}>★</span>
                    ))}
                  </span>
                  <span className="lesson__soon">{unit.characters.length} 个字</span>
                </span>
              </button>
            ))}
          </div>
          <nav className="unit-pages" aria-label="识字分组翻页">
            <button type="button" className="pillbtn pillbtn--text" disabled={page === 0} onClick={() => setPage(page - 1)}>← 上一页</button>
            <span>第 <strong>{page + 1}</strong> / {pages} 页</span>
            <button type="button" className="pillbtn pillbtn--text" disabled={page === pages - 1} onClick={() => setPage(page + 1)}>下一页 →</button>
          </nav>
          <details className="content-note textbook-source">
            <summary>教材与字库说明</summary>
            <p>按本册{book.list}编排练习；多音字按读音分别学习。每组是练习分组，不代表教材课次。组词用于辅助认读，例句为原创内容。</p>
            <p>依据：人教社《语文》{progress.grade}年级{progress.term === 'upper' ? '上' : '下'}册，{book.edition}，第 {book.pages} 页。
              <a href={book.source} target="_blank" rel="noreferrer">查看教材目录</a>
            </p>
          </details>
        </section>
      </div>
    </div>
  </div>;
}
