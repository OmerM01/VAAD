import Link from 'next/link';

import { createClient } from '@/lib/supabase/server';
import { getMembers, memberLabel } from '@/lib/members';
import { relativeTime } from '@/lib/format';
import {
  CATEGORY_LABEL,
  FAULT_STATUSES,
  STATUS_BADGE,
  STATUS_LABEL,
  isFaultStatus,
} from '@/lib/faults';
import type { Fault } from '@/lib/database.types';

import { ReportFault } from './report-fault';

export const metadata = { title: 'תקלות' };

export default async function FaultsPage({ searchParams }: PageProps<'/faults'>) {
  const { status } = await searchParams;
  const filter = isFaultStatus(status) ? status : null;

  const supabase = await createClient();
  const [{ data: faults }, members] = await Promise.all([
    supabase
      .from('faults')
      .select('*')
      .order('created_at', { ascending: false })
      .returns<Fault[]>(),
    getMembers(),
  ]);

  const all = faults ?? [];
  const counts = {
    open: all.filter((f) => f.status === 'open').length,
    in_progress: all.filter((f) => f.status === 'in_progress').length,
    closed: all.filter((f) => f.status === 'closed').length,
  };
  const visible = filter ? all.filter((f) => f.status === filter) : all;

  return (
    <div className="space-y-6">
      <div className="animate-rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">מעקב תקלות</span>
          <h1 className="mt-1 font-display text-3xl font-bold text-brand-900">
            תקלות בבניין
          </h1>
          <p className="mt-1.5 text-sm text-ink-2">
            כל דייר יכול לדווח. הסטטוס מתעדכן על ידי חברי הוועד.
          </p>
        </div>
        <ReportFault />
      </div>

      {/* filters */}
      <div className="animate-rise flex flex-wrap gap-2">
        <FilterChip href="/faults" active={filter === null} label="הכל" count={all.length} />
        {FAULT_STATUSES.map((s) => (
          <FilterChip
            key={s.id}
            href={`/faults?status=${s.id}`}
            active={filter === s.id}
            label={s.short}
            count={counts[s.id]}
          />
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState filtered={filter !== null} />
      ) : (
        <ul className="space-y-3">
          {visible.map((fault, i) => (
            <li
              key={fault.id}
              className="animate-rise"
              style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
            >
              <Link
                href={`/faults/${fault.id}`}
                className="card group block p-5 transition-shadow duration-200 hover:shadow-[var(--shadow-lift)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="font-display text-base font-bold text-brand-900 transition-colors group-hover:text-brand-600">
                    {fault.title}
                  </h2>
                  <span className={`badge ${STATUS_BADGE[fault.status]}`}>
                    <span className="badge-dot" />
                    {STATUS_LABEL[fault.status]}
                  </span>
                </div>

                {fault.description && (
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-2">
                    {fault.description}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3">
                  <span className="badge badge-neutral">
                    {CATEGORY_LABEL[fault.category]}
                  </span>
                  <span>{memberLabel(members.get(fault.reported_by))}</span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={fault.created_at}>
                    דווח {relativeTime(fault.created_at)}
                  </time>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href as never}
      aria-current={active ? 'page' : undefined}
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
        active
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-line-strong bg-surface text-ink-2 hover:border-ink-3 hover:text-ink'
      }`}
    >
      {label}
      <span
        className={`num rounded-full px-1.5 text-xs ${
          active ? 'bg-white/20' : 'bg-paper text-ink-3'
        }`}
      >
        {count}
      </span>
    </Link>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="card-quiet animate-rise flex flex-col items-center px-6 py-14 text-center">
      <svg viewBox="0 0 48 48" className="h-12 w-12 text-line-strong" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="9" y="7" width="30" height="34" rx="4" />
        <path d="M16 17h16M16 24h16M16 31h9" strokeLinecap="round" />
      </svg>
      <p className="mt-4 font-display text-lg font-bold text-brand-900">
        {filtered ? 'אין תקלות בסטטוס הזה' : 'אין עדיין תקלות'}
      </p>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-2">
        {filtered
          ? 'נסו לבחור סינון אחר, או להציג את כל התקלות.'
          : 'כשמשהו בבניין לא עובד — דווחו כאן, וכל הדיירים יראו את הסטטוס.'}
      </p>
    </div>
  );
}
