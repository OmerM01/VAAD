import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ViewTransition } from 'react';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatDateTime, relativeTime } from '@/lib/format';
import { OUTCOME_TEXT, VOTE_LABEL, outcome } from '@/lib/proposals';
import { Author } from '@/components/author';
import type { ProposalResults, ProposalView } from '@/lib/database.types';

import { VoteSection } from './vote-section';

export const metadata = { title: 'הצעה' };

export default async function ProposalPage({
  params,
}: PageProps<'/proposals/[id]'>) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data } = await supabase.rpc('get_proposals', { p_id: id });
  const proposal = (data as ProposalView[] | null)?.[0];

  // get_proposals() is scoped to the caller's building by RLS, so a proposal
  // from another building looks the same as one that does not exist.
  if (!proposal) notFound();

  const { data: resultRows } = await supabase.rpc('get_proposal_results', {
    p_proposal_id: id,
  });
  const results = (resultRows as ProposalResults[] | null)?.[0];
  const voters = results?.voters ?? [];

  const isOpen = proposal.status === 'open';
  const result = outcome(proposal.votes_for, proposal.votes_against);
  // The member who raised it (anonymous or not), plus any vaad member.
  const canClose = isOpen && (proposal.is_mine || profile.role === 'vaad');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/proposals"
        className="animate-fade inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 transition-colors hover:text-brand-600"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4 rotate-180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m8 4 6 6-6 6" />
        </svg>
        חזרה לרשימת ההצעות
      </Link>

      <article className="card animate-rise p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <span className={`badge ${isOpen ? 'badge-brand' : OUTCOME_TEXT[result].badge}`}>
            <span className="badge-dot" />
            {isOpen ? 'ההצבעה פתוחה' : OUTCOME_TEXT[result].label}
          </span>
          {proposal.closes_at && (
            <span className="text-xs text-ink-3">
              נסגר{' '}
              {relativeTime(proposal.closes_at)} · {formatDateTime(proposal.closes_at)}
            </span>
          )}
        </div>

        <ViewTransition name={`proposal-${proposal.id}`} share="morph" default="none">
          <h1 className="mt-3 font-display text-2xl leading-snug font-bold text-heading">
            {proposal.title}
          </h1>
        </ViewTransition>

        <p className="mt-2 text-sm text-ink-3">
          הועלה על ידי{' '}
          <Author name={proposal.creator_name} isMine={proposal.is_mine} />
        </p>

        {proposal.description ? (
          <p className="mt-5 leading-relaxed whitespace-pre-wrap text-ink-2">
            {proposal.description}
          </p>
        ) : (
          <p className="mt-5 text-sm text-ink-3">לא נוסף פירוט להצעה.</p>
        )}
      </article>

      <VoteSection
        proposalId={proposal.id}
        isOpen={isOpen}
        votesFor={proposal.votes_for}
        votesAgainst={proposal.votes_against}
        myVote={proposal.my_vote}
        canClose={canClose}
        closedLabel={OUTCOME_TEXT[result].label}
      />

      {/* voter roll, populated only once the vote has closed */}
      {!isOpen && (
        <section className="card animate-rise p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-bold text-heading">
              מי הצביע
            </h2>
            <span className="num text-sm text-ink-3">{voters.length} מצביעים</span>
          </div>
          <p className="mt-0.5 text-sm text-ink-2">
            רשימת המצביעים נחשפת רק אחרי סגירת ההצבעה, ורק למי שלא ביקש עילום
            שם.
          </p>

          {voters.length === 0 ? (
            <p className="mt-5 text-sm text-ink-3">איש לא הצביע על ההצעה הזו.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {voters.map((voter, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    {voter.anonymous ? (
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-ink-3">
                        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                          <circle cx="10" cy="7" r="3" />
                          <path d="M4.5 16.5a5.5 5.5 0 0 1 11 0" strokeLinecap="round" />
                        </svg>
                        מצביע אנונימי
                      </span>
                    ) : (
                      <>
                        <span className="block truncate text-sm font-semibold text-ink">
                          {voter.name}
                        </span>
                        {voter.apartment && (
                          <span className="num block text-xs text-ink-3">
                            דירה {voter.apartment}
                          </span>
                        )}
                      </>
                    )}
                  </span>
                  <span
                    className={`badge ${voter.vote === 'for' ? 'badge-closed' : 'badge-open'}`}
                  >
                    {VOTE_LABEL[voter.vote]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}


