'use client';

import { useEffect, useRef } from 'react';

import { formatMoney } from '@/lib/format';

type Format = 'money' | 'int';

const INT = new Intl.NumberFormat('he-IL');

function render(value: number, format: Format) {
  return format === 'money' ? formatMoney(value) : INT.format(Math.round(value));
}

/**
 * Counts up to `value` on mount.
 *
 * The server already renders the final string, and the animation runs by
 * writing to the DOM node rather than through state — so there is no hydration
 * mismatch and no flash of a zero before React takes over.
 */
export function Counter({
  value,
  format = 'int',
  duration = 900,
  className = '',
}: {
  value: number;
  format?: Format;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = render(value, format);
      return;
    }

    let frame = 0;
    const started = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = render(value * eased, format);
      if (t < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, format, duration]);

  return (
    <span ref={ref} className={className}>
      {render(value, format)}
    </span>
  );
}
