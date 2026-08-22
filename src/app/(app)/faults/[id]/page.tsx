import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getMembers } from '@/lib/members';
import { formatDateTime, relativeTime } from '@/lib/format';
import {
  CATEGORY_LABEL,
  FAULT_STATUSES,
  STATUS_BADGE,
  STATUS_LABEL,
} from '@/lib/faults';
import type { Fault } from '@/lib/database.types';

import { StatusControl } from './status-control';

export const metadata = { title: 'פרטי תקלה' };

export default async function FaultPage({ params }: PageProps<'/faults/[id]'>) {
  const { id } = await params;
  const profile = await requireProfile();

  const supabase = await createClient();
  const [{ data: fault }, members] = await Promise.all([
    supabase
      .from('faults')
      .select('*')
      .eq('id', id)
      .maybeSingle<Fault>(),
    getMembers(),
  ]);

  // RLS hides faults from other buildings, so "not visible" and "does not
  // exist" collapse into the same 404 — no cross-building probing.
  if (!fault) notFound();

  const reporter = members.get(fault.reported_by);
  const isVaad = profile.role === 'vaad';
  const stepIndex = FAULT_STATUSES.findIndex((s) => s.id === fault.status);
  const wasUpdated = fault.updated_at !== fault.created_at;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/faults"
        className="animate-fade inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 transition-colors hover:text-brand-600"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4 rotate-180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m8 4 6 6-6 6" />
        </svg>
        חזרה לרשימת התקלות
      </Link>

      <article className="card animate-rise overflow-hidden">
        {/* status rail */}
        <div className="flex h-1.5">
          {FAULT_STATUSES.map((step, i) => (
            <span
              key={step.id}
              className={`h-full flex-1 origin-right transition-colors ${
                i <= stepIndex ? 'bg-clay-400' : 'bg-line'
              }`}
              style={
                i <= stepIndex
                  ? { animation: 'grow-bar 0.5s cubic-bezier(0.16,1,0.3,1) both', animationDelay: `${i * 110}ms` }
                  : undefined
              }
            />
          ))}
        </div>

        <div className="p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <span className="badge badge-neutral">
              {CATEGORY_LABEL[fault.category]}
            </span>
            <span className={`badge ${STATUS_BADGE[fault.status]}`}>
              <span className="badge-dot" />
              {STATUS_LABEL[fault.status]}
            </span>
          </div>

          <h1 className="mt-3 font-display text-2xl leading-snug font-bold text-brand-900">
            {fault.title}
          </h1>

          {fault.description ? (
            <p className="mt-4 leading-relaxed whitespace-pre-wrap text-ink-2">
              {fault.description}
            </p>
          ) : (
            <p className="mt-4 text-sm text-ink-3">לא נוסף פירוט לדיווח.</p>
          )}

          <dl className="mt-7 grid gap-4 border-t border-line pt-5 sm:grid-cols-3">
            <Meta label="דווח על ידי">
              {reporter?.full_name ?? 'דייר לא מזוהה'}
              {reporter?.apartment_number && (
                <span className="num block text-xs font-normal text-ink-3">
                  דירה {reporter.apartment_number}
                </span>
              )}
            </Meta>
            <Meta label="מועד הדיווח">
              {relativeTime(fault.created_at)}
              <span className="block text-xs font-normal text-ink-3">
                {formatDateTime(fault.created_at)}
              </span>
            </Meta>
            <Meta label="עדכון אחרון">
              {wasUpdated ? relativeTime(fault.updated_at) : '—'}
              {wasUpdated && (
                <span className="block text-xs font-normal text-ink-3">
                  {formatDateTime(fault.updated_at)}
                </span>
              )}
            </Meta>
          </dl>
        </div>
      </article>

      <section className="card animate-rise p-6">
        {isVaad ? (
          <StatusControl faultId={fault.id} current={fault.status} />
        ) : (
          <div className="flex items-start gap-3">
            <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0 text-ink-3" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <rect x="4.5" y="8.5" width="11" height="8" rx="2" />
              <path d="M7.5 8.5V6.75a2.5 2.5 0 0 1 5 0V8.5" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-ink">
                עדכון הסטטוס שמור לחברי הוועד
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-ink-2">
                ההגבלה נאכפת בבסיס הנתונים עצמו, ולא רק בממשק. תוכל לעקוב כאן
                אחרי כל שינוי בסטטוס.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Meta({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-ink">{children}</dd>
    </div>
  );
}
