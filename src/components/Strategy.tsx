import type { ReactNode } from 'react';
import type { Item } from '../game/types';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';

type Visual = 'ten' | 'line' | 'part' | 'column' | 'array';

/** A dot array says "rows of" better than words — but only while it fits. */
const ARRAY_LIMIT = 42;

function pickVisual(item: Item): Visual {
  if (item.op === '×' || item.op === '÷') {
    if (item.blank !== 'answer') return 'part';
    // Count the dots the picture would need: a ÷ b draws a dots, not the quotient.
    const dots = item.op === '×' ? item.a * item.b : item.a;
    return dots <= ARRAY_LIMIT ? 'array' : 'part';
  }
  if (item.blank !== 'answer') return 'part';
  if (item.op === '+' && item.a < 10 && item.b < 10) return 'ten';
  if (item.op === '-' && item.b < 10) return 'line';
  return 'column';
}

function titleKeyFor(item: Item, visual: Visual): StringKey {
  if (visual === 'ten') return 'how.makeTen';
  if (visual === 'line') return 'how.countBack';
  if (visual === 'part') return 'how.partPart';
  if (visual === 'array') return item.op === '×' ? 'how.times' : 'how.share';
  if (item.op === '+' && carries(item)) return 'how.carry';
  if (item.op === '-' && borrows(item)) return 'how.borrow';
  return 'how.split';
}

/** Compact, picture-first explanation. One idea per panel, no paragraphs. */
export function Strategy({ item }: { item: Item }) {
  const { t } = useI18n();
  const visual = pickVisual(item);
  const titleKey = titleKeyFor(item, visual);

  return (
    <div className="strategy" data-visual={visual}>
      <span className="strategy__eyebrow">{t('strategy.title')}</span>
      <h3 className="strategy__title">{t(titleKey)}</h3>
      <div className="strategy__visual">
        {visual === 'ten' && <TenFrame a={item.a} b={item.b} />}
        {visual === 'line' && <NumberLine a={item.a} b={item.b} />}
        {visual === 'part' && <PartPart item={item} />}
        {visual === 'column' && <Column item={item} />}
        {visual === 'array' && <ArrayDots item={item} />}
      </div>
      <p className="strategy__caption">{captionFor(item, visual)}</p>
    </div>
  );
}

function carries(item: Item): boolean {
  return item.op === '+' && item.a % 10 + (item.b % 10) >= 10;
}

function borrows(item: Item): boolean {
  return item.op === '-' && item.a % 10 < item.b % 10;
}

const Num = ({ children }: { children: ReactNode }) => <b className="num">{children}</b>;

function captionFor(item: Item, visual: Visual): ReactNode {
  const { a, b, op, total, answer } = item;

  if (visual === 'ten') {
    if (total <= 10) {
      return (
        <>
          <Num>{a}</Num> + <Num>{b}</Num> = <Num>{total}</Num>
        </>
      );
    }
    const fill = 10 - a;
    return (
      <>
        <Num>{a}</Num> + <Num>{fill}</Num> = <Num>10</Num>
        <span className="strategy__arrow">→</span>
        <Num>10</Num> + <Num>{total - 10}</Num> = <Num>{total}</Num>
      </>
    );
  }

  if (visual === 'line') {
    let rest = b;
    let cur = a;
    const steps: ReactNode[] = [];
    if (cur % 10 > 0 && rest >= cur % 10) {
      const hop = cur % 10;
      steps.push(
        <span key="h1">
          <Num>{cur}</Num> − <Num>{hop}</Num> = <Num>{cur - hop}</Num>
        </span>,
      );
      cur -= hop;
      rest -= hop;
    }
    if (rest > 0) {
      steps.push(
        <span key="h2">
          <Num>{cur}</Num> − <Num>{rest}</Num> = <Num>{cur - rest}</Num>
        </span>,
      );
    }
    return <>{steps.map((s, i) => (i === 0 ? s : <span key={i}>{s}</span>))}</>;
  }

  if (visual === 'array') {
    return (
      <>
        <Num>{a}</Num> {op === '×' ? '×' : '÷'} <Num>{b}</Num> = <Num>{total}</Num>
      </>
    );
  }

  if (visual === 'part') {
    if (op === '+') {
      return (
        <>
          <Num>{total}</Num> − <Num>{a}</Num> = <Num>{b}</Num>
        </>
      );
    }
    if (op === '×') {
      if (item.blank === 'a') {
        return (
          <>
            <Num>{total}</Num> ÷ <Num>{b}</Num> = <Num>{a}</Num>
          </>
        );
      }
      if (item.blank === 'b') {
        return (
          <>
            <Num>{total}</Num> ÷ <Num>{a}</Num> = <Num>{b}</Num>
          </>
        );
      }
      return (
        <>
          <Num>{a}</Num> × <Num>{b}</Num> = <Num>{total}</Num>
        </>
      );
    }
    if (op === '÷') {
      // The multiplication fact is true whichever slot was empty.
      return (
        <>
          <Num>{b}</Num> × <Num>{total}</Num> = <Num>{a}</Num>
        </>
      );
    }
    if (item.blank === 'a') {
      return (
        <>
          <Num>{total}</Num> + <Num>{b}</Num> = <Num>{a}</Num>
        </>
      );
    }
    return (
      <>
        <Num>{a}</Num> − <Num>{total}</Num> = <Num>{b}</Num>
      </>
    );
  }

  const a0 = a % 10;
  const b0 = b % 10;
  if (op === '-') {
    return borrows(item) ? (
      <>
        <Num>{a0 + 10}</Num> − <Num>{b0}</Num> = <Num>{a0 + 10 - b0}</Num>
      </>
    ) : (
      <>
        <Num>{a0}</Num> − <Num>{b0}</Num> = <Num>{a0 - b0}</Num>
      </>
    );
  }
  return (
    <>
      <Num>{a0}</Num> + <Num>{b0}</Num> = <Num>{a0 + b0}</Num>
      {carries(item) ? <span className="strategy__hint">· {answer}</span> : null}
    </>
  );
}

/* ------------------------------------------------------------------ ten frame */

function TenFrame({ a, b }: { a: number; b: number }) {
  const total = a + b;
  const cells: Array<'a' | 'b' | 'empty'> = Array.from({ length: 10 }, (_, i) =>
    i < a ? 'a' : i < total ? 'b' : 'empty',
  );
  const rest = Math.max(0, total - 10);

  return (
    <div className="ten">
      <div className="ten__frame">
        {cells.map((kind, i) => (
          <span key={i} className={`ten__cell ten__cell--${kind}`}>
            {kind !== 'empty' ? <span className="ten__dot" /> : null}
          </span>
        ))}
      </div>
      {rest > 0 ? (
        <div className="ten__frame ten__frame--extra">
          {Array.from({ length: rest }, (_, i) => (
            <span key={i} className="ten__cell ten__cell--b">
              <span className="ten__dot" />
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------- number line */

function NumberLine({ a, b }: { a: number; b: number }) {
  const hops: number[] = [];
  let cursor = a;
  let rest = b;
  if (cursor % 10 > 0 && rest >= cursor % 10) {
    const hop = cursor % 10;
    hops.push(hop);
    cursor -= hop;
    rest -= hop;
  }
  if (rest > 0) hops.push(rest);

  const lo = Math.floor((a - b) / 10) * 10;
  let hi = Math.ceil(a / 10) * 10;
  if (hi <= lo) hi = lo + 10;

  const width = 320;
  const height = 120;
  const pad = 26;
  const x = (v: number) => pad + ((v - lo) / (hi - lo)) * (width - pad * 2);
  const y = 78;

  const points: number[] = [a];
  let cur = a;
  for (const hop of hops) {
    cur -= hop;
    points.push(cur);
  }

  const ticks: number[] = [];
  const step = hi - lo > 20 ? 10 : 1;
  for (let v = lo; v <= hi; v += step) ticks.push(v);

  return (
    <svg className="nline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="number line">
      <line x1={pad} y1={y} x2={width - pad} y2={y} className="nline__rail" />
      {ticks.map((v) => {
        const major = v % 10 === 0;
        return (
          <g key={v}>
            <line x1={x(v)} y1={y - (major ? 7 : 4)} x2={x(v)} y2={y + (major ? 7 : 4)} className="nline__tick" />
            {major ? (
              <text x={x(v)} y={y + 22} className="nline__num">
                {v}
              </text>
            ) : null}
          </g>
        );
      })}
      {hops.map((hop, i) => {
        const from = points[i]!;
        const to = points[i + 1]!;
        const midX = (x(from) + x(to)) / 2;
        const top = 34 - i * 6;
        return (
          <g key={i}>
            <path
              d={`M ${x(from)} ${y - 6} Q ${midX} ${top} ${x(to)} ${y - 6}`}
              className="nline__hop"
              markerEnd="url(#nl-arrow)"
            />
            <text x={midX} y={top - 4} className="nline__hop-label">
              −{hop}
            </text>
          </g>
        );
      })}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={x(p)}
          cy={y}
          r={i === 0 ? 7 : 5}
          className={i === points.length - 1 ? 'nline__dot nline__dot--end' : 'nline__dot'}
        />
      ))}
      <text x={x(a)} y={y - 18} className="nline__here">
        {a}
      </text>
      <defs>
        <marker id="nl-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M7,1 L2,4 L7,7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </marker>
      </defs>
    </svg>
  );
}

/* ------------------------------------------------------------------ dot array */

function ArrayDots({ item }: { item: Item }) {
  const { op, a, b, total } = item;
  // Multiplication is commutative: draw the flat version, 2 rows of 9 beats 9 rows of 2.
  const rows = op === '×' ? Math.min(a, b) : b;
  const cols = op === '×' ? Math.max(a, b) : total;
  // Few dots should grow, many dots should shrink — keep the block about 200px.
  const dot = Math.round(Math.max(9, Math.min(24, 200 / cols, 210 / rows)));

  return (
    <div
      className="array"
      role="img"
      aria-label={`${rows} × ${cols}`}
      style={{ ['--dot' as string]: `${dot}px` }}
    >
      {Array.from({ length: rows }, (_, r) => (
        <div className="array__row" key={r}>
          {Array.from({ length: cols }, (_, c) => (
            <span className="array__dot" key={c} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ part-part-whole */

interface Layout {
  whole: number;
  parts: [number, number];
  blankWhole: boolean;
  blankParts: [boolean, boolean];
}

/** Which number sits in the whole, which two in the parts — per operation. */
function partLayout(item: Item): Layout {
  const { op, a, b, total, blank } = item;
  if (op === '-') {
    return { whole: a, parts: [total, b], blankWhole: blank === 'a', blankParts: [false, blank === 'b'] };
  }
  if (op === '÷') {
    // Dividend on top; divisor and quotient underneath.
    return { whole: a, parts: [b, total], blankWhole: blank === 'a', blankParts: [blank === 'b', blank === 'answer'] };
  }
  // Addition and multiplication: the total is the whole.
  return { whole: total, parts: [a, b], blankWhole: false, blankParts: [blank === 'a', blank === 'b'] };
}

function PartPart({ item }: { item: Item }) {
  const { whole, parts, blankWhole, blankParts } = partLayout(item);

  return (
    <div className="ppw">
      <div className={`ppw__node ppw__node--whole ${blankWhole ? 'is-blank' : ''}`}>
        <span className="ppw__value">{whole}</span>
      </div>
      <div className="ppw__legs" aria-hidden="true">
        <span />
        <span />
      </div>
      <div className="ppw__parts">
        <div className={`ppw__node ${blankParts[0] ? 'is-blank' : ''}`}>
          <span className="ppw__value">{parts[0]}</span>
        </div>
        <div className={`ppw__node ${blankParts[1] ? 'is-blank' : ''}`}>
          <span className="ppw__value">{parts[1]}</span>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- column */

function Column({ item }: { item: Item }) {
  const { a, b, op } = item;
  const result = item.total;
  const w = Math.max(String(a).length, String(b).length, String(result).length);

  const as = String(a).padStart(w, ' ');
  const bs = String(b).padStart(w, ' ');
  const rs = String(result).padStart(w, ' ');

  const badges: Array<string | null> = Array.from({ length: w }, () => null);
  const digitsA = [...String(a)].reverse().map(Number);
  const digitsB = [...String(b)].reverse().map(Number);

  if (op === '+') {
    let carry = 0;
    for (let i = 0; i < w; i++) {
      const sum = (digitsA[i] ?? 0) + (digitsB[i] ?? 0) + carry;
      if (sum >= 10 && w - i - 1 > 0) badges[w - i - 1 - 1] = '1';
      carry = sum >= 10 ? 1 : 0;
    }
  } else {
    let borrow = 0;
    for (let i = 0; i < w; i++) {
      let d = (digitsA[i] ?? 0) - borrow - (digitsB[i] ?? 0);
      if (d < 0) {
        d += 10;
        borrow = 1;
        if (w - i - 1 > 0) badges[w - i - 1 - 1] = '−1';
      } else {
        borrow = 0;
      }
    }
  }

  return (
    <div className="col" style={{ ['--cols' as string]: String(w + 1) }}>
      <div className="col__row col__row--badges">
        <span className="col__cell" />
        {badges.map((badge, i) => (
          <span key={i} className="col__cell col__badge">
            {badge ?? ''}
          </span>
        ))}
      </div>
      <div className="col__row">
        <span className="col__cell" />
        {[...as].map((ch, i) => (
          <span key={i} className="col__cell">
            {ch.trim()}
          </span>
        ))}
      </div>
      <div className="col__row">
        <span className="col__cell col__op">{op === '+' ? '+' : '−'}</span>
        {[...bs].map((ch, i) => (
          <span key={i} className="col__cell">
            {ch.trim()}
          </span>
        ))}
      </div>
      <div className="col__rule" />
      <div className="col__row col__row--result">
        <span className="col__cell" />
        {[...rs].map((ch, i) => (
          <span key={i} className="col__cell">
            {ch.trim()}
          </span>
        ))}
      </div>
    </div>
  );
}
