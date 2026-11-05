import { constellation, STAR_TIERS, upgradedTier } from '../lib/starCollection';
import type { Lang } from '../i18n/strings';

interface Props { total: number; lang: Lang }

/** The same collection and conversion language appears in both subjects. */
export function StarCollection({ total, lang, compact = false }: Props & { compact?: boolean }) {
  const sky = constellation(total);
  const { stars } = sky;
  const zh = lang === 'zh';
  const next = upgradedTier(total, total + 10 - stars)!;
  if (compact) return <details className="learning-rewards">
    <summary><span>{zh ? '我的学习收获' : 'My learning rewards'}</span><span className="learning-rewards__tokens">
      {STAR_TIERS.filter((tier) => sky[tier.key] > 0 || tier.key === 'stars').map((tier) =>
        <span key={tier.key} aria-label={`${zh ? tier.zh : tier.en}: ${sky[tier.key]}`}>{tier.icon} {sky[tier.key]}</span>)}
    </span></summary>
    <StarCollection total={total} lang={lang} />
  </details>;
  return <section className="star-collection" aria-label={zh ? '星光收藏' : 'Starlight collection'}>
    <div className="star-collection__intro"><h2>{zh ? '我的星光收藏' : 'My starlight collection'}</h2>
      <p>{zh ? '英语和古诗，一起点亮小宇宙。' : 'English and poetry light up the same sky.'}</p></div>
    <div className="star-collection__treasures">
      {STAR_TIERS.map((tier) => <div className="star-collection__treasure" key={tier.key}><span aria-hidden="true">{tier.icon}</span><strong>{sky[tier.key]}</strong><small>{zh ? tier.zh : tier.en}</small></div>)}
    </div>
    <div className="star-collection__next">
      <div className="star-collection__slots" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <span className={i < stars ? 'is-lit' : ''} key={i}>★</span>)}<span className="star-collection__moon">{next.icon}</span></div>
      <p>{zh ? `再集 ${10 - stars} 颗星，合成下一个${next.zh}` : `${10 - stars} more stars until your next ${next.singular}`}</p>
      <small>{zh ? '每满 10 个合成下一级，宇宙可以继续累积' : 'Every 10 become the next reward. Universes keep adding up.'}</small>
    </div>
    <details className="star-collection__rules"><summary>{zh ? '怎样收集星光？' : 'How do I collect starlight?'}</summary>
      <p>{zh ? '10 星星 → 1 月亮；10 月亮 → 1 太阳；10 太阳 → 1 星系；10 星系 → 1 宇宙。' : '10 stars → 1 moon; 10 moons → 1 sun; 10 suns → 1 galaxy; 10 galaxies → 1 universe.'}</p>
      <p>{zh ? '完整闯过一关，得到 1 颗努力星；当轮每个首次答对的小挑战再得 1 颗。答错不扣星，复习和重复闯关也能收集。中途离开不结算。' : 'Finish a round for 1 effort star. Each challenge you get right on the first try adds 1 more. No stars are taken away. Reviews and replays count too. Finish the round to collect them.'}</p>
      <p>{zh ? '旧课程星星会在首次进入对应学科时加入一次。收藏保存在当前浏览器。' : 'Your old lesson stars join once when you visit each subject. Your collection is saved in this browser.'}</p>
    </details>
  </section>;
}

export function StarReward({ total, correct, lang }: Props & { correct: number }) {
  const earned = correct + 1;
  const before = total - earned;
  const zh = lang === 'zh';
  const promotion = upgradedTier(before, total);
  return <div className="star-reward" role="status">
    <span className="star-reward__icon" aria-hidden="true">{promotion?.icon ?? '⭐'}</span>
    <strong>{zh ? `收获 ${earned} 颗星光` : `${earned} stars collected!`}</strong>
    <p>{zh ? `完成练习 +1${correct ? ` · 用心答对 +${correct}` : ''}` : `Practice complete +1${correct ? ` · Correct answers +${correct}` : ''}`}</p>
    {promotion ? <b>{zh ? `合成新${promotion.zh}啦！` : `You made a new ${promotion.singular}!`}</b> : null}
  </div>;
}

export function ChallengeTrail({ step, count, stars, lang }: { step: number; count: number; stars: number; lang: Lang }) {
  const zh = lang === 'zh';
  return <div className="challenge-trail">
    <div><span>{zh ? `小挑战 ${step + 1} / ${count}` : `Challenge ${step + 1} of ${count}`}</span><strong>⭐ {stars} <small>{zh ? '完成后收藏' : 'collect when you finish'}</small></strong></div>
    <progress value={step} max={count} aria-label={zh ? '闯关进度' : 'Adventure progress'} />
  </div>;
}
