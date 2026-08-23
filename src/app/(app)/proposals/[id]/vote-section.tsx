'use client';

import { useActionState, useOptimistic } from 'react';
import { useFormStatus } from 'react-dom';

import { voteOnProposal } from '@/lib/actions/proposals';
import { IDLE } from '@/lib/actions/state';
import { VOTE_LABEL, isVoteChoice } from '@/lib/proposals';
import { useActionToast } from '@/components/toast';
import { VoteBar } from '@/components/vote-bar';
import { FormError, Spinner } from '@/components/ui/form';
import type { VoteChoice } from '@/lib/database.types';

import { CloseProposalButton } from './close-button';

type Tally = { votesFor: number; votesAgainst: number; myVote: VoteChoice | null };

/**
 * Owns the tally and the ballot together so a vote can land optimistically:
 * the bar moves and the panel switches to "you voted" on click, then the
 * server result replaces it. If the server refuses, React discards the
 * optimistic value and the real numbers come back on their own.
 */
export function VoteSection({
  proposalId,
  isOpen,
  votesFor,
  votesAgainst,
  myVote,
  canClose,
  closedLabel,
}: {
  proposalId: string;
  isOpen: boolean;
  votesFor: number;
  votesAgainst: number;
  myVote: VoteChoice | null;
  canClose: boolean;
  closedLabel: string;
}) {
  const [state, action] = useActionState(voteOnProposal, IDLE);
  useActionToast(state);

  const [tally, applyVote] = useOptimistic(
    { votesFor, votesAgainst, myVote },
    (current: Tally, choice: VoteChoice): Tally => ({
      votesFor: current.votesFor + (choice === 'for' ? 1 : 0),
      votesAgainst: current.votesAgainst + (choice === 'against' ? 1 : 0),
      myVote: choice,
    }),
  );

  function submit(formData: FormData) {
    const choice = formData.get('vote');
    if (isVoteChoice(choice)) applyVote(choice);
    return action(formData);
  }

  return (
    <section className="card animate-rise p-6">
      <p className="eyebrow mb-2.5">התוצאה עד כה</p>
      <VoteBar votesFor={tally.votesFor} votesAgainst={tally.votesAgainst} />

      <div className="mt-6 border-t border-line pt-5">
        {!isOpen ? (
          <ClosedNotice result={closedLabel} />
        ) : tally.myVote ? (
          <AlreadyVoted choice={VOTE_LABEL[tally.myVote]} />
        ) : (
          <form action={submit}>
            <input type="hidden" name="proposal_id" value={proposalId} />

            <h2 className="font-display text-lg font-bold text-heading">ההצבעה שלך</h2>
            <p className="mt-0.5 mb-4 text-sm text-ink-2">
              אפשר להצביע פעם אחת בלבד, ואי אפשר לשנות את ההצבעה אחר כך.
            </p>

            <FormError message={state.error} />

            <label className="mt-1 mb-4 flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-surface-2 p-3.5 transition-colors hover:border-line-strong">
              <input
                name="voter_anonymous"
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-cta)]"
              />
              <span>
                <span className="block text-sm font-semibold text-ink">
                  להצביע בעילום שם
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-ink-2">
                  ההצבעה תיספר בתוצאה, אבל השם שלך לא יופיע ברשימת המצביעים
                  כשההצבעה תיסגר.
                </span>
              </span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <VoteButton value="for" label="בעד" tone="ok" />
              <VoteButton value="against" label="נגד" tone="clay" />
            </div>
          </form>
        )}

        {canClose && (
          <CloseProposalButton
            proposalId={proposalId}
            totalVotes={tally.votesFor + tally.votesAgainst}
          />
        )}
      </div>
    </section>
  );
}

function VoteButton({
  value,
  label,
  tone,
}: {
  value: VoteChoice;
  label: string;
  tone: 'ok' | 'clay';
}) {
  const { pending } = useFormStatus();

  const styles =
    tone === 'ok'
      ? 'border-ok-100 bg-ok-50 text-ok-600 hover:border-ok-500 hover:bg-ok-500 hover:text-white'
      : 'border-clay-100 bg-clay-50 text-clay-600 hover:border-clay-400 hover:bg-clay-400 hover:text-white';

  return (
    <button
      type="submit"
      name="vote"
      value={value}
      disabled={pending}
      className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 font-display text-lg font-bold transition-all duration-200 active:scale-[0.97] disabled:opacity-50 ${styles}`}
    >
      {pending && <Spinner />}
      {label}
    </button>
  );
}

function AlreadyVoted({ choice }: { choice: string }) {
  return (
    <div className="animate-rise flex items-start gap-3">
      <svg
        viewBox="0 0 20 20"
        className="mt-0.5 h-5 w-5 shrink-0 text-ok-500"
        fill="currentColor"
        aria-hidden="true"
        style={{ animation: 'pop 0.45s cubic-bezier(0.16,1,0.3,1) both' }}
      >
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
