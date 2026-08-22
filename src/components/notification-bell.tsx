'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useRef, useState, useTransition } from 'react';

import { markNotificationsSeen } from '@/lib/actions/notifications';
import { relativeTime } from '@/lib/format';
import type { AppNotification, NotificationKind } from '@/lib/database.types';

const ICONS: Record<NotificationKind, { path: string; tone: string }> = {
  fault_new: {
    path: 'M10 3.5 2.8 16h14.4L10 3.5Zm0 4.7v3.4m0 2.4v.1',
    tone: 'bg-clay-50 text-clay-500',
  },
  fault_status: {
    path: 'm4.5 10.5 3.5 3.5 7.5-8',
    tone: 'bg-ok-50 text-ok-500',
  },
  transaction: {
    path: 'M10 4.5v11M6.5 8h5a2 2 0 0 1 0 4h-3a2 2 0 0 0 0 4h5',
    tone: 'bg-brand-50 text-brand-600',
  },
  proposal_new: {
    path: 'M10 3v4M6 8h8l-1 8H7L6 8Z',
    tone: 'bg-brand-50 text-brand-600',
  },
  proposal_closed: {
    path: 'M5.5 9.5h9v6h-9v-6Zm2 0V7.75a2.5 2.5 0 0 1 5 0V9.5',
    tone: 'bg-paper-deep text-ink-2',
  },
};

function hrefFor(item: AppNotification): Route {
  switch (item.kind) {
    case 'fault_new':
    case 'fault_status':
      return `/faults/${item.entity_id}` as Route;
    case 'proposal_new':
    case 'proposal_closed':
      return `/proposals/${item.entity_id}` as Route;
    default:
      return '/budget';
  }
}

export function NotificationBell({ items }: { items: AppNotification[] }) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);
  // Frozen at mount so the "new" markers stay put while the panel is open.
  const [snapshot] = useState(items);

  const unread = items.filter((item) => item.is_new).length;

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      startTransition(() => {
        void markNotificationsSeen();
      });
    }
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={unread > 0 ? `התראות — ${unread} חדשות` : 'התראות'}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-line-strong bg-surface text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
      >
        <svg viewBox="0 0 20 20" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10 3a5 5 0 0 0-5 5c0 3-1.2 4.3-1.2 4.3h12.4S15 11 15 8a5 5 0 0 0-5-5Z" />
          <path d="M8.5 15a1.6 1.6 0 0 0 3 0" />
        </svg>
        {unread > 0 && (
          <span className="num absolute -top-1.5 -left-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-clay-400 px-1 text-[0.625rem] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-rise absolute top-11 left-0 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-lift)]">
          <div className="flex items-baseline justify-between gap-2 border-b border-line px-4 py-3">
            <h2 className="font-display text-sm font-bold text-brand-900">
              מה קרה בבניין
            </h2>
            {unread > 0 && (
              <span className="num text-xs font-semibold text-clay-500">
                {unread} חדשות
              </span>
            )}
          </div>

          {snapshot.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-ink-3">
              עדיין אין פעילות בבניין.
            </p>
          ) : (
            <ul className="max-h-[26rem] divide-y divide-line overflow-y-auto">
              {snapshot.map((item) => {
                const icon = ICONS[item.kind];
                return (
                  <li key={`${item.kind}-${item.entity_id}-${item.at}`}>
                    <Link
                      href={hrefFor(item)}
                      onClick={() => setOpen(false)}
                      className={`flex gap-3 px-4 py-3 transition-colors hover:bg-surface-2 ${
                        item.is_new ? 'bg-brand-50/40' : ''
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${icon.tone}`}
                        aria-hidden="true"
                      >
                        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                          <path d={icon.path} />
                        </svg>
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink">
                          {item.title}
                        </span>
                        <span className="block truncate text-xs text-ink-2">
                          {item.detail}
                        </span>
                        <span className="block text-[0.6875rem] text-ink-3">
                          {relativeTime(item.at)}
                        </span>
                      </span>

                      {item.is_new && (
                        <span
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-clay-400"
                          aria-label="חדש"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
