import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatDateTime, relativeTime } from '@/lib/format';
import { OUTCOME_TEXT, VOTE_LABEL, outcome } from '@/lib/proposals';
import { VoteBar } from '@/components/vote-bar';
import { Author } from '@/components/author';
import type { ProposalResults, ProposalView } from '@/lib/database.types';

import { VotePanel } from './vote-panel';
import { CloseProposalButton } from './close-button';

export const metadata = { title: 'הצעה' };

export default async function ProposalPage({
  params,
}: PageProps<'/proposals/[id]'>) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data } = await supabase.rpc('get_proposals', { p_id: id });
  const proposal = (data as ProposalView[] | null)?.[0];

  // RLS scopes get_proposals() to the caller's building, so a proposal from
  // another building is indistinguishable from one that does not exist.
  if (!proposal) notFound();

  const { data: resultRows } = await supabase.rpc('get_proposal_results', {
    p_proposal_id: id,
  });
  const results = (resultRows as ProposalResults[] | null)?.[0];
  const voters = results?.voters ?? [];

  const isOpen = proposal.status === 'open';
  const result = outcome(proposal.votes_for, proposal.votes_against);
  // whoever raised it — anonymously or not — plus any vaad member
  const canClose = isOpen && (proposal.is_mine || profile.role === 'vaad');
  const totalVotes = proposal.votes_for + proposal.votes_against;

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

        <h1 className="mt-3 font-display text-2xl leading-snug font-bold text-brand-900">
          {proposal.title}
        </h1>

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

        <div className="mt-7 border-t border-line pt-5">
          <p className="eyebrow mb-2.5">התוצאה עד כה</p>
          <VoteBar votesFor={proposal.votes_for} votesAgainst={proposal.votes_against} />
        </div>
      </article>

      {/* voting */}
      <section className="card animate-rise p-6">
        {!isOpen ? (
          <ClosedNotice result={OUTCOME_TEXT[result].label} />
        ) : proposal.my_vote ? (
          <AlreadyVoted choice={VOTE_LABEL[proposal.my_vote]} />
        ) : (
          <VotePanel proposalId={proposal.id} />
        )}

        {canClose && (
          <CloseProposalButton proposalId={proposal.id} totalVotes={totalVotes} />
        )}
      </section>

      {/* voter roll — only ever populated once the vote has closed */}
      {!isOpen && (
        <section className="card animate-rise p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-bold text-brand-900">
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

function AlreadyVoted({ choice }: { choice: string }) {
  return (
    <div className="flex items-start gap-3">
      <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0 text-ok-500" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm3.7 6.2a.75.75 0 0 0-1.15-.96l-3.4 4.07-1.7-1.7a.75.75 0 1 0-1.06 1.06l2.28 2.28a.75.75 0 0 0 1.1-.05l3.93-4.7Z"
          clipRule="evenodd"
        />
      </svg>
      <div>
        <p className="text-sm font-semibold text-ink">
          הצבעת <span className="text-ok-500">{choice}</span>
        </p>
        <p className="mt-0.5 text-sm leading-relaxed text-ink-2">
          כל דייר מצביע פעם אחת. המגבלה נאכפת גם באילוץ ייחודיות בבסיס הנתונים,
          ולא רק בממשק.
        </p>
      </div>
    </div>
  );
}

function ClosedNotice({ result }: { result: string }) {
  return (
    <div className="flex items-start gap-3">
      <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0 text-ink-3" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <rect x="4.5" y="8.5" width="11" height="8" rx="2" />
        <path d="M7.5 8.5V6.75a2.5 2.5 0 0 1 5 0V8.5" />
      </svg>
      <div>
        <p className="text-sm font-semibold text-ink">ההצבעה נסגרה — {result}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-ink-2">
          לא ניתן להוסיף הצבעות אחרי מועד הסגירה.
        </p>
      </div>
    </div>
  );
}
