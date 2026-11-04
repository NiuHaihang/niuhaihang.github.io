import { lessonsFor, type Lesson } from '../content';
import type { Grade, Topic } from '../content/types';
import { useI18n } from '../i18n/I18nProvider';
import { Mascot } from './Mascot';

const GRADES: Grade[] = [3, 4, 5, 6];
const TOPICS: Topic[] = ['words', 'phonics', 'grammar'];
const TOPIC_DETAILS = {
  words: { icon: '🔤', label: 'topicWords', hint: 'wordsHint' },
  phonics: { icon: '🎵', label: 'topicPhonics', hint: 'phonicsHint' },
  grammar: { icon: '💬', label: 'topicGrammar', hint: 'grammarHint' },
} as const;

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
  // Recommend the first lesson without a star; practise from the start once all have stars.
  const nextLesson = lessons.find((lesson) => lesson.ready && !stars[lesson.id])
    ?? lessons.find((lesson) => lesson.ready);
  const books = [...new Set(lessons.map((lesson) => lesson.book?.[lang] ?? ''))];

  return (
    <div className="home">
      <header className="home__top">
        <div className="brand">
          <Mascot size={44} />
          <span className="brand__name">{t('appName')}</span>
        </div>
        <nav className="subjects" aria-label={t('subjects')}>
          <a href={`${import.meta.env.BASE_URL}../`}>{t('math')}</a>
          <a href={import.meta.env.BASE_URL} aria-current="page">{t('english')}</a>
          <a href={`${import.meta.env.BASE_URL}../chinese/`}>{t('chinese')}</a>
        </nav>
        <div className="home__tools">
          <button type="button" className="pillbtn pillbtn--text" onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}>
            {t('language')}
          </button>
          <button type="button" className="pillbtn" onClick={onToggleSound} aria-label={sound ? t('soundOn') : t('soundOff')}>
            {sound ? '🔔' : '🔕'}
          </button>
        </div>
      </header>

      <section className="hero">
        <Mascot size={168} className="hero__mascot" />
        <div className="hero__text">
          <p className="hero__hi">{t('hello')}</p>
          <h1 className="hero__title">{t('heroTitle')}</h1>
          <p className="hero__subtitle">{t('heroHint')}</p>
          <div className="hero__pills">
            <span className="pill">⭐ {t('progressStars', { n: totalStars })}</span>
            {streak > 0 ? <span className="pill pill--warm">🔥 {t('streak', { n: streak })}</span> : null}
          </div>
        </div>
      </section>

      <div className="study-layout">
        <aside className="study-settings" aria-label={t('learningChoices')}>
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

          <section className="topic-picker" aria-labelledby="topics-title">
            <h2 className="section-title" id="topics-title">{t('explore')}</h2>
            <nav className="topics" aria-label={t('topics')}>
              {TOPICS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`topic topic--${item} ${item === topic ? 'is-selected' : ''}`}
                  aria-current={item === topic}
                  onClick={() => onTopic(item)}
                >
                  <span className="topic__icon" aria-hidden="true">{TOPIC_DETAILS[item].icon}</span>
                  <span className="topic__text">
                    <strong>{t(TOPIC_DETAILS[item].label)}</strong>
                    <small>{t(TOPIC_DETAILS[item].hint)}</small>
                  </span>
                  <span className="topic__check" aria-hidden="true">{item === topic ? '✓' : ''}</span>
                </button>
              ))}
            </nav>
          </section>
        </aside>
        <div className="study-content">
          <div className="learning-plan">
            {nextLesson ? (
              <section className="next-lesson" aria-labelledby="next-lesson-title">
                <span className="next-lesson__picture" aria-hidden="true">{nextLesson.words[0]?.emoji ?? TOPIC_DETAILS[topic].icon}</span>
                <div className="next-lesson__text">
                  <h2 id="next-lesson-title">{t(stars[nextLesson.id] ? 'practiceLesson' : 'nextLesson')}</h2>
                  <h3>{nextLesson.title}</h3>
                  <p>{nextLesson.book ? nextLesson.book[lang] : t(TOPIC_DETAILS[topic].label)} · {nextLesson.zh}</p>
                </div>
                <button type="button" className="btn btn--primary" onClick={() => onStart(nextLesson)}>
                  {t('startLesson')} <span aria-hidden="true">→</span>
                </button>
              </section>
            ) : null}
            <button
              type="button"
              className={`review-card ${reviewCount > 0 ? 'is-ready' : ''}`}
              onClick={onReview}
              disabled={reviewCount === 0}
            >
              <span className="review-card__icon" aria-hidden="true">🔁</span>
              <span className="review-card__text">
                <strong>{t('review')}</strong>
                <small>{reviewCount > 0 ? t('reviewHint', { n: reviewCount }) : t('reviewEmpty')}</small>
              </span>
              {reviewCount > 0 ? <span className="review-card__count">{reviewCount}</span> : null}
            </button>
          </div>

          <section className="course-list" aria-labelledby="all-lessons-title">
            <div className="course-list__heading">
              <h2 className="section-title" id="all-lessons-title">{t('allLessons')}</h2>
              <span>{t('lessonCount', { n: lessons.length })}</span>
            </div>
            {lessons.length === 0 ? <p className="empty">{t('emptyGrade')}</p> : null}
            {books.map((book) => (
              <section className="course-group" key={book}>
                {book ? <h3 className="course-group__title">{book}</h3> : null}
                <div className="lessons">
                  {lessons.filter((lesson) => (lesson.book?.[lang] ?? '') === book).map((lesson) => {
                    const best = stars[lesson.id] ?? 0;
                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        className={`lesson ${lesson.ready ? '' : 'lesson--locked'}`}
                        disabled={!lesson.ready}
                        onClick={() => onStart(lesson)}
                      >
                        <span className="lesson__icon" aria-hidden="true">{lesson.words[0]?.emoji ?? TOPIC_DETAILS[lesson.topic].icon}</span>
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
                </div>
              </section>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
