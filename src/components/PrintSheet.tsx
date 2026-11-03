import { useMemo, useState } from 'react';
import { generateRound } from '../game/generator';
import { randomSeed } from '../game/rng';
import type { Item, LevelId } from '../game/types';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';

interface PrintSheetProps {
  level: LevelId;
  onClose: () => void;
}

const SHEET_SIZE = 24;

function prompt(item: Item): string {
  const sign = item.op === '+' ? '+' : '−';
  const left = item.blank === 'a' ? '____' : String(item.a);
  const right = item.blank === 'b' ? '____' : String(item.b);
  const result = item.blank === 'answer' ? '____' : String(item.total);
  return `${left} ${sign} ${right} = ${result}`;
}

export function PrintSheet({ level, onClose }: PrintSheetProps) {
  const { t } = useI18n();
  const [seed, setSeed] = useState(() => randomSeed());
  const [answers, setAnswers] = useState(false);

  const items = useMemo(() => {
    // A printed sheet should read easy → hard, not in generation order.
    return generateRound(level, seed, SHEET_SIZE).items
      .slice()
      .sort((x, y) => x.difficulty - y.difficulty || x.answer - y.answer);
  }, [level, seed]);

  return (
    <div className="screen print-screen">
      <header className="print-screen__bar no-print">
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          {t('print.back')}
        </button>
        <button type="button" className="btn btn--soft" onClick={() => setSeed(randomSeed())}>
          🔄 {t('print.shuffle')}
        </button>
        <button type="button" className="btn btn--soft" onClick={() => setAnswers((v) => !v)}>
          {answers ? t('print.hideAnswers') : t('print.answers')}
        </button>
        <button type="button" className="btn btn--primary" onClick={() => window.print()}>
          🖨️ {t('print.print')}
        </button>
      </header>

      <article className="print-sheet">
        <header className="print-sheet__head">
          <h1>{t('print.title')}</h1>
          <div className="print-sheet__meta">
            <span>
              {t('print.name')} <i className="print-line" />
            </span>
            <span>
              {t('print.date')} <i className="print-line" />
            </span>
            <span className="print-sheet__level">{t(`level.${level}` as StringKey)}</span>
          </div>
        </header>

        <ol className="print-sheet__grid">
          {items.map((item, index) => (
            <li key={item.id} className="print-item">
              <span className="print-item__no">{index + 1}.</span>
              <span className="print-item__eq">{prompt(item)}</span>
              {answers ? <span className="print-item__answer">{item.answer}</span> : null}
            </li>
          ))}
        </ol>

        <footer className="print-sheet__foot">
          <span>🌸 {t('app.name')}</span>
          <span>{t(`level.${level}.sub` as StringKey)}</span>
        </footer>
      </article>
    </div>
  );
}
