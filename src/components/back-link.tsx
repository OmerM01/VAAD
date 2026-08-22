'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';

/**
 * Steps back through history when there is somewhere to go back to, and falls
 * back to the home page when the visitor landed here directly — a plain
 * router.back() on a fresh tab leaves people staring at the same screen.
 *
 * It renders as a real link to `fallback`, so it still works before hydration
 * and shows a sensible target on hover; the handler only takes over when there
 * is genuine history behind it.
 */
export function BackLink({
  fallback = '/',
  label = 'חזרה',
}: {
  fallback?: Route;
  label?: string;
}) {
  const router = useRouter();

  return (
    <Link
      href={fallback}
      onClick={(event) => {
        if (window.history.length > 1) {
          event.preventDefault();
          router.back();
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-ink-2 transition-colors hover:bg-surface hover:text-brand-600"
    >
      <svg
        viewBox="0 0 20 20"
        className="h-4 w-4 rotate-180"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m8 4 6 6-6 6" />
      </svg>
      {label}
    </Link>
  );
}
