import type { Item } from '../game/types';

interface EquationProps {
  item: Item;
  typed: string;
  phase: 'input' | 'correct' | 'wrong';
}

/**
 * The maths expression itself. Only one thing is ever blank, so the child
 * always knows exactly where the answer goes.
 */
export function Equation({ item, typed, phase }: EquationProps) {
  const { a, b, op, total, blank } = item;
  const shown = phase === 'wrong' ? String(item.answer) : typed;

  const blankNode = (
    <span
      key={`${item.id}-${phase}`}
      className={`equation__blank equation__blank--${phase} ${shown ? 'has-value' : ''}`}
    >
      {shown ? <span className="equation__value">{shown}</span> : <span className="equation__caret" />}
    </span>
  );

  const aria = [
    blank === 'a' ? '?' : a,
    op === '+' ? '+' : '−',
    blank === 'b' ? '?' : b,
    '=',
    blank === 'answer' ? '?' : total,
  ].join(' ');

  return (
    <div className={`equation equation--${phase}`} role="img" aria-label={aria}>
      {blank === 'a' ? blankNode : <span className="equation__num">{a}</span>}
      <span className="equation__op" aria-hidden="true">
        {op === '+' ? '+' : '−'}
      </span>
      {blank === 'b' ? blankNode : <span className="equation__num">{b}</span>}
      <span className="equation__eq" aria-hidden="true">
        =
      </span>
      {blank === 'answer' ? blankNode : <span className="equation__num">{total}</span>}
    </div>
  );
}
