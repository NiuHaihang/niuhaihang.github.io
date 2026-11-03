import { useMemo } from 'react';
import type { CSSProperties } from 'react';

interface SparklesProps {
  /** Change this number to fire a new burst. */
  burst: number;
  count?: number;
  tone?: 'berry' | 'mint' | 'lilac' | 'butter';
}

/** A little confetti of hearts and stars, drawn with divs + CSS keyframes. */
export function Sparkles({ burst, count = 14, tone = 'berry' }: SparklesProps) {
  const bits = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (360 / count) * i + (i % 3) * 7;
      const distance = 90 + (i % 5) * 26;
      const style = {
        '--angle': `${angle}deg`,
        '--distance': `${distance}px`,
        '--delay': `${(i % 4) * 40}ms`,
        '--size': `${8 + (i % 4) * 3}px`,
      } as CSSProperties;
      return { style, kind: i % 3 };
    });
  }, [count]);

  if (burst === 0) return null;

  return (
    <div className={`sparkles sparkles--${tone}`} key={burst} aria-hidden="true">
      {bits.map((bit, i) => (
        <span
          key={i}
          className={`sparkles__bit sparkles__bit--${bit.kind}`}
          style={bit.style}
        />
      ))}
    </div>
  );
}
