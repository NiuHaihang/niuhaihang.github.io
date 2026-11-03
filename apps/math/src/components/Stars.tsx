interface StarsProps {
  count: number;
  size?: number;
  /** Animate the stars popping in, one after another. */
  animate?: boolean;
  className?: string;
}

function Star({ filled, delay }: { filled: boolean; delay: number }) {
  return (
    <svg
      viewBox="0 0 40 38"
      width="100%"
      height="100%"
      className={`star ${filled ? 'star--on' : 'star--off'}`}
      style={{ animationDelay: `${delay}ms` }}
      aria-hidden="true"
    >
      <path
        d="M20 2.5l5.2 10.6 11.7 1.7-8.5 8.3 2 11.6L20 29.2 9.6 34.7l2-11.6-8.5-8.3 11.7-1.7z"
        fill={filled ? 'url(#star-fill)' : '#EFE4EE'}
      />
      <defs>
        <linearGradient id="star-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE9A8" />
          <stop offset="1" stopColor="#FFB648" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Stars({ count, size = 44, animate = false, className = '' }: StarsProps) {
  return (
    <div
      className={`stars ${animate ? 'stars--pop' : ''} ${className}`.trim()}
      style={{ height: size }}
      aria-label={`${count} of 3 stars`}
    >
      {[1, 2, 3].map((i) => (
        <div className="stars__slot" key={i} style={{ width: size }}>
          <Star filled={i <= count} delay={animate ? i * 160 : 0} />
        </div>
      ))}
    </div>
  );
}
