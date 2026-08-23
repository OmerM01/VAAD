'use client';

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'vaad-theme';

type Theme = 'light' | 'dark';

/**
 * The theme lives on <html>, written by the boot script before first paint.
 * Reading it through useSyncExternalStore keeps the button in step with the
 * document without a render-then-correct pass, and covers the case where the
 * system preference changes while the page is open.
 */
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const onSystem = (event: MediaQueryListEvent) => {
    if (localStorage.getItem(STORAGE_KEY)) return; // an explicit choice wins
    document.documentElement.dataset.theme = event.matches ? 'dark' : 'light';
    notify();
  };
  media.addEventListener('change', onSystem);

  return () => {
    listeners.delete(onChange);
    media.removeEventListener('change', onSystem);
  };
}

function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => 'light' as Theme);
  const isDark = theme === 'dark';

  function toggle() {
    const next: Theme = isDark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage disabled: the choice simply will not survive a reload
    }
    notify();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'מעבר למצב בהיר' : 'מעבר למצב כהה'}
      title={isDark ? 'מצב בהיר' : 'מצב כהה'}
      className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-line-strong bg-surface text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
    >
      <svg
        viewBox="0 0 20 20"
        className={`absolute h-4.5 w-4.5 transition-all duration-300 ${
          isDark ? 'translate-y-6 rotate-90 opacity-0' : 'translate-y-0 rotate-0 opacity-100'
        }`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="10" cy="10" r="3.4" />
        <path d="M10 2.4v1.8M10 15.8v1.8M17.6 10h-1.8M4.2 10H2.4M15.4 4.6l-1.3 1.3M5.9 14.1l-1.3 1.3M15.4 15.4l-1.3-1.3M5.9 5.9 4.6 4.6" />
      </svg>

      <svg
        viewBox="0 0 20 20"
        className={`absolute h-4.5 w-4.5 transition-all duration-300 ${
          isDark ? 'translate-y-0 rotate-0 opacity-100' : '-translate-y-6 -rotate-90 opacity-0'
        }`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M16.5 12.4A7 7 0 0 1 7.6 3.5a7 7 0 1 0 8.9 8.9Z" />
      </svg>
    </button>
  );
}
