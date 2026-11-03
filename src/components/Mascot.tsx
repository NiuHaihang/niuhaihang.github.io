import type { CSSProperties } from 'react';

export type Mood = 'idle' | 'cheer' | 'think' | 'oops' | 'sleep';

interface MascotProps {
  mood?: Mood;
  size?: number;
  className?: string;
  /** Decorative when set: hides the mascot from screen readers. */
  decorative?: boolean;
}

/** Mochi, the bunny. Inline SVG so she can blink, cheer and tilt without assets. */
export function Mascot({ mood = 'idle', size = 120, className = '', decorative = false }: MascotProps) {
  const eyesOpen = mood !== 'cheer';
  const sleep = mood === 'sleep';

  return (
    <svg
      viewBox="0 0 240 240"
      width={size}
      height={size}
      className={`mascot mascot--${mood} ${className}`.trim()}
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : 'Mochi the bunny'}
    >
      <defs>
        <linearGradient id="mochi-fur" x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.65" stopColor="#FFF9F5" />
          <stop offset="1" stopColor="#FFEDE6" />
        </linearGradient>
        <linearGradient id="mochi-bow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFA8BC" />
          <stop offset="1" stopColor="#E4577A" />
        </linearGradient>
      </defs>

      {/* ears */}
      <g className="mascot__ears">
        <g transform="rotate(-14 92 70)">
          <ellipse cx="92" cy="70" rx="21" ry="47" fill="url(#mochi-fur)" stroke="#F2DAD9" strokeWidth="2.5" />
          <ellipse cx="92" cy="74" rx="10" ry="31" fill="#FFC9D8" />
        </g>
        <g transform="rotate(14 150 70)">
          <ellipse cx="150" cy="70" rx="21" ry="47" fill="url(#mochi-fur)" stroke="#F2DAD9" strokeWidth="2.5" />
          <ellipse cx="150" cy="74" rx="10" ry="31" fill="#FFC9D8" />
        </g>
      </g>

      {/* head */}
      <ellipse cx="120" cy="144" rx="66" ry="58" fill="url(#mochi-fur)" stroke="#F2DAD9" strokeWidth="2.5" />

      {/* bow */}
      <g transform="translate(156 78) rotate(-12)" className="mascot__bow">
        <path d="M0 0 L-26 -13 Q-32 0 -26 13 Z" fill="url(#mochi-bow)" />
        <path d="M0 0 L26 -13 Q32 0 26 13 Z" fill="url(#mochi-bow)" />
        <circle cx="0" cy="0" r="7" fill="#FFD9E3" stroke="#E4577A" strokeWidth="2" />
      </g>

      {/* blush */}
      <ellipse cx="80" cy="160" rx="13" ry="8" fill="#FFC2D4" opacity="0.85" />
      <ellipse cx="160" cy="160" rx="13" ry="8" fill="#FFC2D4" opacity="0.85" />

      {/* eyes */}
      {sleep || !eyesOpen ? (
        <g stroke="#3D2C3A" strokeWidth="5" strokeLinecap="round" fill="none">
          <path d="M88 136 q10 9 20 0" className="mascot__eye-left" />
          <path d="M132 136 q10 9 20 0" className="mascot__eye-right" />
        </g>
      ) : (
        <g className="mascot__eyes">
          <g className="mascot__eye-left">
            <ellipse cx="98" cy="136" rx="7" ry="9" fill="#3D2C3A" />
            <circle cx="100.5" cy="133" r="2.4" fill="#FFFFFF" />
          </g>
          <g className="mascot__eye-right">
            <ellipse cx="142" cy="136" rx="7" ry="9" fill="#3D2C3A" />
            <circle cx="144.5" cy="133" r="2.4" fill="#FFFFFF" />
          </g>
        </g>
      )}

      {/* nose + mouth */}
      <path d="M114 152 h12 q2 0 1.4 2 L121 160 q-1 1.4 -2 0 L112.6 154 q-.6 -2 1.4 -2 Z" fill="#E4577A" />
      {mood === 'cheer' ? (
        <ellipse cx="120" cy="168" rx="9" ry="7" fill="#E4577A" />
      ) : mood === 'oops' ? (
        <path d="M112 168 q8 -4 16 0" stroke="#3D2C3A" strokeWidth="4" strokeLinecap="round" fill="none" />
      ) : (
        <path d="M112 163 q4 6 8 6 q4 0 8 -6" stroke="#3D2C3A" strokeWidth="3.6" strokeLinecap="round" fill="none" />
      )}

      {/* whiskers */}
      <g stroke="#E8C9C9" strokeWidth="2.6" strokeLinecap="round">
        <path d="M54 150 q-12 -2 -20 -7" />
        <path d="M54 158 q-12 2 -20 6" />
        <path d="M186 150 q12 -2 20 -7" />
        <path d="M186 158 q12 2 20 6" />
      </g>

      {mood === 'oops' && <circle cx="176" cy="112" r="5" fill="#A9D8F5" />}
      {mood === 'think' && (
        <g fill="#C7B6F5">
          <circle cx="188" cy="96" r="4" />
          <circle cx="196" cy="84" r="5.5" />
          <circle cx="206" cy="69" r="7.5" />
        </g>
      )}
    </svg>
  );
}

export function mascotMood(accuracy: number): Mood {
  if (accuracy >= 0.9) return 'cheer';
  if (accuracy >= 0.6) return 'idle';
  return 'think';
}

export type { CSSProperties };
