import Link from 'next/link';

import { createClient } from '@/lib/supabase/server';
import { relativeTime } from '@/lib/format';
import { OUTCOME_TEXT, VOTE_LABEL, outcome } from '@/lib/proposals';
import { VoteBar } from '@/components/vote-bar';
import { Author } from '@/components/author';
import type { ProposalView } from '@/lib/database.types';

import { NewProposal } from './new-proposal';

export const metadata = { title: 'הצעות' };

export default async function ProposalsPage({
  searchParams,
}: PageProps<'/proposals'>) {
  const { status } = await searchParams;
  const filter = status === 'open' || status === 'closed' ? status : null;

  const supabase = await createClient();
  const { data } = await supabase.rpc('get_proposals', { p_id: null });
  const all = (data ?? []) as ProposalView[];

  const counts = {
    open: all.filter((p) => p.status === 'open').length,
    closed: all.filter((p) => p.status === 'closed').length,
  };
  const visible = filter ? all.filter((p) => p.status === filter) : all;

  return (
    <div className="space-y-6">
      <div className="animate-rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">החלטות הבניין</span>
          <h1 className="mt-1 font-display text-3xl font-bold text-brand-900">
            הצעות והצבעות
          </h1>
          <p className="mt-1.5 text-sm text-ink-2">
            כל דייר מעלה הצעות ומצביע — פעם אחת לכל הצעה, בשם או בעילום שם.
          </p>
        </div>
        <NewProposal />
      </div>

      <div className="animate-rise flex flex-wrap gap-2">
        <FilterChip href="/proposals" active={filter === null} label="הכל" count={all.length} />
        <FilterChip href="/proposals?status=open" active={filter === 'open'} label="בהצבעה" count={counts.open} />
        <FilterChip href="/proposals?status=closed" active={filter === 'closed'} label="הסתיימו" count={counts.closed} />
      </div>

      {visible.length === 0 ? (
        <EmptyState filtered={filter !== null} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {visible.map((proposal, i) => (
            <li
              key={proposal.id}
              className="animate-rise"
              style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
            >
              <ProposalCard proposal={proposal} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProposalCard({ proposal }: { proposal: ProposalView }) {
  const isOpen = proposal.status === 'open';
  const result = outcome(proposal.votes_for, proposal.votes_against);

  return (
    <Link
      href={`/proposals/${proposal.id}`}
      className="card group flex h-full flex-col p-5 transition-shadow duration-200 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`badge ${isOpen ? 'badge-brand' : OUTCOME_TEXT[result].badge}`}>
          <span className="badge-dot" />
          {isOpen ? 'בהצבעה' : OUTCOME_TEXT[result].label}
        </span>
        {proposal.my_vote && (
          <span className="badge badge-neutral">
            הצבעת {VOTE_LABEL[proposal.my_vote]}
          </span>
        )}
      </div>

      <h2 className="mt-3 font-display text-base leading-snug font-bold text-brand-900 transition-colors group-hover:text-brand-600">
        {proposal.title}
      </h2>

      {proposal.description && (
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-2">
          {proposal.description}
        </p>
      )}

      <div className="mt-4 flex-1" />

      <VoteBar votesFor={proposal.votes_for} votesAgainst={proposal.votes_against} size="sm" />

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line pt-3 text-xs text-ink-3">
        <Author name={proposal.creator_name} isMine={proposal.is_mine} />
        <span aria-hidden="true">·</span>
        {proposal.closes_at && (
          <time dateTime={proposal.closes_at}>
            נסגר{' '}
            {relativeTime(proposal.closes_at)}
          </time>
        )}
      </div>
    </Link>
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
      <span className={`num rounded-full px-1.5 text-xs ${active ? 'bg-white/20' : 'bg-paper text-ink-3'}`}>
        {count}
      </span>
    </Link>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="card-quiet animate-rise flex flex-col items-center px-6 py-14 text-center">
      <svg viewBox="0 0 48 48" className="h-12 w-12 text-line-strong" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M24 6v10M12 20h24l-3 18a3 3 0 0 1-3 2.6H18a3 3 0 0 1-3-2.6L12 20Z" strokeLinejoin="round" />
        <circle cx="24" cy="6" r="2.5" />
      </svg>
      <p className="mt-4 font-display text-lg font-bold text-brand-900">
        {filtered ? 'אין הצעות בסטטוס הזה' : 'עדיין לא הועלו הצעות'}
      </p>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-2">
        {filtered
          ? 'נסו לבחור סינון אחר, או להציג את כל ההצעות.'
          : 'רעיון לשיפור בבניין? העלו אותו כאן, וכל הדיירים יוכלו להצביע עליו.'}
      </p>
    </div>
  );
}
