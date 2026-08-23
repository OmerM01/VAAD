import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ViewTransition } from 'react';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getMembers } from '@/lib/members';
import { formatDateTime, relativeTime } from '@/lib/format';
import { CATEGORY_LABEL } from '@/lib/faults';
import type { Fault } from '@/lib/database.types';

import { FaultStatusCard } from './fault-status';

export const metadata = { title: 'פרטי תקלה' };

export default async function FaultPage({ params }: PageProps<'/faults/[id]'>) {
  const { id } = await params;
  const profile = await requireProfile();

  const supabase = await createClient();
  const [{ data: fault }, members] = await Promise.all([
    supabase.from('faults').select('*').eq('id', id).maybeSingle<Fault>(),
    getMembers(),
  ]);

  // RLS hides faults from other buildings, so "not visible" and "does not
  // exist" both end up as a 404. Ids cannot be probed across buildings.
  if (!fault) notFound();

  const reporter = members.get(fault.reported_by);
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

      <FaultStatusCard
        faultId={fault.id}
        status={fault.status}
        isVaad={profile.role === 'vaad'}
        category={CATEGORY_LABEL[fault.category]}
      >
        <ViewTransition name={`fault-${fault.id}`} share="morph" default="none">
          <h1 className="mt-3 font-display text-2xl leading-snug font-bold text-heading">
            {fault.title}
          </h1>
        </ViewTransition>

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
      </FaultStatusCard>
    </div>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-ink">{children}</dd>
    </div>
  );
}
