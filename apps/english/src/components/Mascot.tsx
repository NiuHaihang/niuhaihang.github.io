interface MascotProps {
  mood?: 'idle' | 'cheer' | 'oops';
  size?: number;
  className?: string;
  label?: string;
}

/** Same bunny as Bunny Math, wearing a blue bow for the English app. */
export function Mascot({ mood = 'idle', size = 120, className = '', label = 'Mochi the bunny' }: MascotProps) {
  const eyeY = mood === 'cheer' ? 42 : 44;
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={`mascot ${className}`}
      role="img"
      aria-label={label}
    >
      <defs>
        <linearGradient id="fur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#FFEFE8" />
        </linearGradient>
        <linearGradient id="bow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9EC9FF" />
          <stop offset="1" stopColor="#5B8DEF" />
        </linearGradient>
      </defs>
      <ellipse cx="34" cy="34" rx="11" ry="24" fill="url(#fur)" transform="rotate(-14 34 34)" />
      <ellipse cx="34" cy="34" rx="5" ry="16" fill="#FFD3DE" transform="rotate(-14 34 34)" />
      <ellipse cx="82" cy="32" rx="11" ry="24" fill="url(#fur)" transform="rotate(12 82 32)" />
      <ellipse cx="82" cy="32" rx="5" ry="16" fill="#FFD3DE" transform="rotate(12 82 32)" />
      <circle cx="58" cy="66" r="34" fill="url(#fur)" />
      <circle cx="46" cy={eyeY} r="4.6" fill="#3B2E4A" />
      <circle cx="70" cy={eyeY} r="4.6" fill="#3B2E4A" />
      <circle cx="47.6" cy={eyeY - 1.6} r="1.5" fill="#FFFFFF" />
      <circle cx="71.6" cy={eyeY - 1.6} r="1.5" fill="#FFFFFF" />
      <ellipse cx="40" cy="76" rx="7" ry="4.4" fill="#FFC2D4" opacity="0.85" />
      <ellipse cx="76" cy="76" rx="7" ry="4.4" fill="#FFC2D4" opacity="0.85" />
      <path
        d={mood === 'oops' ? 'M54 80c2-3 6-3 8 0' : 'M54 79c1.8 2.6 6.2 2.6 8 0'}
        stroke="#E4577A"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="58" cy="74" rx="3.2" ry="2.4" fill="#E4577A" />
      <g transform="translate(86 34) rotate(16)">
        <path d="M0 0c-6-5-14-3-14 4s8 9 14 4z" fill="url(#bow)" />
        <path d="M0 0c6-5 14-3 14 4s-8 9-14 4z" fill="url(#bow)" />
        <circle cx="0" cy="4" r="3" fill="#DCE9FF" />
      </g>
      {mood === 'cheer' ? <circle cx="96" cy="18" r="3" fill="#FFD166" /> : null}
    </svg>
  );
}
