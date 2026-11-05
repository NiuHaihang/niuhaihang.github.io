import { POEMS, GRADES, type Grade, type Poem } from '../content';
import type { Progress } from '../lib/storage';
import { Mascot } from '../../../english/src/components/Mascot';
import { StarCollection } from '../../../english/src/components/StarCollection';

interface Props {
  progress: Progress;
  totalStars: number;
  onGrade: (grade: Grade) => void;
  onToggleSound: () => void;
  onStudy: (poem: Poem) => void;
  onQuiz: (poem: Poem) => void;
}

export function Home({ progress, totalStars, onGrade, onToggleSound, onStudy, onQuiz }: Props) {
  const poems = POEMS.filter((poem) => progress.grade === 0 || poem.grade === progress.grade);
  const next = poems.find((poem) => !progress.studied.includes(poem.id)) ?? poems[0]!;
  const learned = progress.studied.length;

  return <div className="home">
    <header className="home__top">
      <div className="brand"><Mascot size={44} label="麻薯小兔" /><span className="brand__name">小兔古诗词</span></div>
      <nav className="subjects" aria-label="学习科目">
        <a href={`${import.meta.env.BASE_URL}../`}>学数学</a>
        <a href={`${import.meta.env.BASE_URL}../english/`}>学英语</a>
        <a href={`${import.meta.env.BASE_URL}../chinese/`}>学语文</a>
        <a href={import.meta.env.BASE_URL} aria-current="page">古诗词</a>
      </nav>
      <div className="home__tools"><button type="button" className="pillbtn" onClick={onToggleSound}
        aria-label={progress.sound ? '关闭朗读' : '开启朗读'}>{progress.sound ? '🔔' : '🔕'}</button></div>
    </header>

    <section className="hero">
      <Mascot size={168} className="hero__mascot" label="麻薯小兔" />
      <div className="hero__text">
        <p className="hero__hi">你好，小小读诗人！</p>
        <h1 className="hero__title">一起读古诗吧</h1>
        <p className="hero__subtitle">听朗读、读诗句、懂诗意，慢慢学会背诵。</p>
        <div className="hero__pills"><span className="pill pill--warm">🌷 已学习 {learned} / {POEMS.length} 篇</span></div>
      </div>
    </section>

    <div className="study-layout">
      <aside className="study-settings" aria-label="诗词学习选择">
        <section>
          <h2 className="section-title">建议学习年级</h2>
          <div className="grades poetry-grades" role="radiogroup" aria-label="建议学习年级">
            {([0, ...GRADES] as Grade[]).map((grade) => <button key={grade} type="button" role="radio"
              aria-checked={progress.grade === grade} className={`grade ${progress.grade === grade ? 'is-selected' : ''}`}
              onClick={() => onGrade(grade)}>{grade === 0 ? '全部诗词' : `${grade} 年级`}</button>)}
          </div>
        </section>
        <div className="poetry-note">
          <strong>一首一首，慢慢来</strong>
          <p>先听读，再理解诗意，最后试着背一背。学完也可以用小闯关练一练。</p>
          <p>收录课标推荐 75 篇与 2 篇拓展。按难度建议分级，不代表教材年级、上下册。</p>
        </div>
        <StarCollection total={totalStars} lang="zh" compact />
      </aside>
      <div className="study-content">
        <section className="next-lesson" aria-labelledby="next-poem-title">
          <span className="next-lesson__picture" aria-hidden="true">📖</span>
          <div className="next-lesson__text">
            <h2 id="next-poem-title">{progress.studied.includes(next.id) ? '再读一遍，也有新发现' : '今天读这一首'}</h2>
            <h3>{next.title}</h3><p>{next.era} · {next.author}</p>
          </div>
          <div className="lesson-actions"><button type="button" className="btn btn--primary" onClick={() => onStudy(next)}>开始读诗 →</button>
            <button type="button" className="pillbtn pillbtn--text" onClick={() => onQuiz(next)}>诗词小闯关</button></div>
        </section>
        <section className="course-list" aria-labelledby="poems-title">
          <div className="course-list__heading"><h2 className="section-title" id="poems-title">读诗小花园</h2><span>{poems.length} 篇诗词</span></div>
          <div className="lessons">
            {poems.map((poem) => <article className="lesson poem-card" key={poem.id}>
              <button type="button" className="lesson__start" onClick={() => onStudy(poem)} aria-label={`读诗：${poem.title}`}>
              <span className="poem-card__tag">{poem.theme}{poem.core ? '' : ' · 拓展'}</span>
              <strong className="lesson__title">{poem.title}</strong>
              <span className="lesson__zh">{poem.era} · {poem.author}</span>
              <span className="poem-card__opening">{poem.lines[0]!.text}</span>
              <span className="lesson__foot"><span className="adventure-badge">{progress.studied.includes(poem.id) ? '🌷 已学习' : '📖 读一读'}</span><span className="poem-card__length">{poem.lines.length} 句</span></span>
              </button><button type="button" className="lesson__extra" onClick={() => onQuiz(poem)} aria-label={`小闯关：${poem.title}`}>诗词小闯关</button>
            </article>)}
          </div>
        </section>
        <details className="poetry-source"><summary>篇目与学习说明</summary>
          <p>基础篇目依据《义务教育语文课程标准（2022年版）》附录1小学阶段推荐目录；另收录《清平乐·村居》《西江月·夜行黄沙道中》。诗意为面向儿童的原创简述。</p>
          <p>《古朗月行》收录开头四句，已标注节选；同名诗以首句区分。星星来自诗意、补字、接句和排序练习，不代表系统评测了口头背诵。</p>
          <a href="https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582344386456.pdf" target="_blank" rel="noreferrer">查看课程标准</a>
        </details>
      </div>
    </div>
  </div>;
}
