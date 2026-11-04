import { lessonsFor, type Lesson } from '../content';
import type { Grade, Topic } from '../content/types';
import { useI18n } from '../i18n/I18nProvider';
import { Mascot } from './Mascot';

const GRADES: Grade[] = [3, 4, 5, 6];
const TOPICS: Topic[] = ['words', 'phonics', 'grammar'];

interface Props {
  grade: Grade;
  topic: Topic;
  stars: Record<string, number>;
  streak: number;
  sound: boolean;
  onGrade: (grade: Grade) => void;
  onTopic: (topic: Topic) => void;
  onStart: (lesson: Lesson) => void;
  reviewCount: number;
  onReview: () => void;
  onToggleSound: () => void;
}

function topicKey(topic: Topic) {
  return topic === 'words' ? 'topicWords' : topic === 'phonics' ? 'topicPhonics' : 'topicGrammar';
}

export function Home({
  grade,
  topic,
  stars,
  streak,
  sound,
  onGrade,
  onTopic,
  onStart,
  reviewCount,
  onReview,
  onToggleSound,
}: Props) {
  const { lang, setLang, t } = useI18n();
  const lessons = lessonsFor(grade, topic);
  const totalStars = Object.values(stars).reduce((sum, n) => sum + n, 0);

  return (
    <div className="home">
      <header className="home__top">
        <div className="brand">
          <Mascot size={44} />
          <span className="brand__name">{t('appName')}</span>
        </div>
        <div className="home__tools">
          <button type="button" className="pillbtn pillbtn--text" onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}>
            {t('language')}
          </button>
          <button type="button" className="pillbtn" onClick={onToggleSound} aria-label={sound ? t('soundOn') : t('soundOff')}>
            {sound ? '🔔' : '🔕'}
          </button>
          <span className="pill">{t('progressStars', { n: totalStars })}</span>
          {streak > 0 ? <span className="pill pill--warm">🔥 {t('streak', { n: streak })}</span> : null}
        </div>
      </header>

      <nav className="subjects" aria-label={t('subjects')}>
        <a href={`${import.meta.env.BASE_URL}../`}>{t('math')}</a>
        <a href={import.meta.env.BASE_URL} aria-current="page">{t('english')}</a>
      </nav>

      <section className="hero">
        <div className="hero__text">
          <p className="hero__hi">{t('tagline')}</p>
          <h1 className="hero__title">{t('appName')}</h1>
        </div>
        <Mascot size={108} className="hero__mascot" />
      </section>

      <button
        type="button"
        className={`review-card ${reviewCount > 0 ? 'is-ready' : ''}`}
        onClick={onReview}
        disabled={reviewCount === 0}
      >
        <span className="review-card__icon" aria-hidden="true">
          🔁
        </span>
        <span className="review-card__text">
          <strong>{t('review')}</strong>
          <small>{reviewCount > 0 ? t('reviewHint', { n: reviewCount }) : t('reviewEmpty')}</small>
        </span>
        {reviewCount > 0 ? <span className="review-card__count">{reviewCount}</span> : null}
      </button>

      <section className="picker">
        <h2 className="section-title">{t('chooseGrade')}</h2>
        <div className="grades" role="radiogroup" aria-label={t('chooseGrade')}>
          {GRADES.map((g) => (
            <button
              key={g}
              type="button"
              role="radio"
              aria-checked={g === grade}
              className={`grade ${g === grade ? 'is-selected' : ''}`}
              onClick={() => onGrade(g)}
            >
              {t('gradeLabel', { n: g })}
            </button>
          ))}
        </div>
      </section>

      <nav className="topics" aria-label={t('topics')}>
        {TOPICS.map((item) => (
          <button
            key={item}
            type="button"
            className={`topic ${item === topic ? 'is-selected' : ''}`}
            aria-current={item === topic}
            onClick={() => onTopic(item)}
          >
            {t(topicKey(item))}
          </button>
        ))}
      </nav>

      <section className="lessons">
        {lessons.length === 0 ? <p className="empty">{t('emptyGrade')}</p> : null}
        {lessons.map((lesson) => {
          const best = stars[lesson.id] ?? 0;
          return (
            <button
              key={lesson.id}
              type="button"
              className={`lesson ${lesson.ready ? '' : 'lesson--locked'}`}
              disabled={!lesson.ready}
              onClick={() => onStart(lesson)}
            >
              {lesson.book ? <span className="lesson__book">{lesson.book[lang]}</span> : null}
              <span className="lesson__title">{lesson.title}</span>
              <span className="lesson__zh">{lesson.zh}</span>
              <span className="lesson__foot">
                {lesson.ready ? (
                  <span className="lesson__stars" aria-label={t('stars')}>
                    {[1, 2, 3].map((i) => (
                      <span key={i} className={i <= best ? 'star star--on' : 'star'}>
                        ★
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="lesson__soon">{t('comingSoon')}</span>
                )}
              </span>
            </button>
          );
        })}
      </section>
    </div>
  );
}
