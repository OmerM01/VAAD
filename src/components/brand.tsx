/** The building mark — three stacked floors with a lit window. */
export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="5.5"
        y="4.5"
        width="21"
        height="23"
        rx="2.5"
        className="fill-brand-600"
      />
      <g className="fill-brand-200">
        <rect x="9.5" y="8.5" width="4" height="4" rx="0.8" />
        <rect x="18.5" y="8.5" width="4" height="4" rx="0.8" />
        <rect x="9.5" y="15" width="4" height="4" rx="0.8" />
        <rect x="9.5" y="21.5" width="4" height="4" rx="0.8" />
        <rect x="18.5" y="21.5" width="4" height="4" rx="0.8" />
      </g>
      <rect x="18.5" y="15" width="4" height="4" rx="0.8" className="fill-clay-300" />
    </svg>
  );
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <Logo />
      <span className="font-display text-xl font-bold tracking-tight text-brand-800">
        ועד בית
      </span>
    </span>
  );
}
