'use client';

import { useActionState, useOptimistic, useState } from 'react';
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
 * Owns the tally and the ballot together so a vote can land optimistically: the
 * bar moves and the panel switches on click, then the server result replaces
 * it. If the server refuses, React discards the optimistic value.
 */
export function VoteSection({
  proposalId,
  isOpen,
  votesFor,
  votesAgainst,
  myVote,
  myVoteAnonymous,
  canClose,
  closedLabel,
}: {
  proposalId: string;
  isOpen: boolean;
  votesFor: number;
  votesAgainst: number;
  myVote: VoteChoice | null;
  myVoteAnonymous: boolean;
  canClose: boolean;
  closedLabel: string;
}) {
  const [state, action] = useActionState(voteOnProposal, IDLE);
  useActionToast(state);

  const [editing, setEditing] = useState(false);

  const [tally, applyVote] = useOptimistic(
    { votesFor, votesAgainst, myVote },
    (current: Tally, choice: VoteChoice): Tally => {
      // moving a vote takes it off the other side rather than adding a second
      const wasFor = current.myVote === 'for';
      const wasAgainst = current.myVote === 'against';
      return {
        votesFor: current.votesFor - (wasFor ? 1 : 0) + (choice === 'for' ? 1 : 0),
        votesAgainst:
          current.votesAgainst - (wasAgainst ? 1 : 0) + (choice === 'against' ? 1 : 0),
        myVote: choice,
      };
    },
  );

  function submit(formData: FormData) {
    const choice = formData.get('vote');
    if (isVoteChoice(choice)) applyVote(choice);
    setEditing(false);
    return action(formData);
  }

  const showBallot = isOpen && (!tally.myVote || editing);

  return (
    <section className="card animate-rise p-6">
      <p className="eyebrow mb-2.5">התוצאה עד כה</p>
      <VoteBar votesFor={tally.votesFor} votesAgainst={tally.votesAgainst} />

      <div className="mt-6 border-t border-line pt-5">
        {!isOpen ? (
          <ClosedNotice result={closedLabel} />
        ) : showBallot ? (
          <form action={submit}>
            <input type="hidden" name="proposal_id" value={proposalId} />

            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-heading">
                  {tally.myVote ? 'שינוי ההצבעה שלך' : 'ההצבעה שלך'}
                </h2>
                <p className="mt-0.5 mb-4 text-sm text-ink-2">
                  {tally.myVote
                    ? 'אפשר להחליף בעד ונגד כמה פעמים שרוצים, עד שההצבעה תיסגר.'
                    : 'אפשר לשנות את ההצבעה כל עוד ההצבעה פתוחה.'}
                </p>
              </div>
              {tally.myVote && (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="btn btn-ghost btn-sm"
                >
                  ביטול
                </button>
              )}
            </div>

            <FormError message={state.error} />

            <label className="mt-1 mb-4 flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-surface-2 p-3.5 transition-colors hover:border-line-strong">
              <input
                name="voter_anonymous"
                type="checkbox"
                defaultChecked={myVoteAnonymous}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-cta)]"
              />
              <span>
                <span className="block text-sm font-semibold text-ink">
                  להצביע בעילום שם
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-ink-2">
                  הקול שלך ייספר בתוצאה, אבל השם שלך לא יופיע לאף אחד — גם לא
                  לחברי הוועד.
                </span>
              </span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <VoteButton value="for" label="בעד" tone="ok" current={tally.myVote} />
              <VoteButton value="against" label="נגד" tone="clay" current={tally.myVote} />
            </div>
          </form>
        ) : (
          <AlreadyVoted
            choice={VOTE_LABEL[tally.myVote as VoteChoice]}
            anonymous={myVoteAnonymous}
            onChange={() => setEditing(true)}
          />
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
  current,
}: {
  value: VoteChoice;
  label: string;
  tone: 'ok' | 'clay';
  current: VoteChoice | null;
}) {
  const { pending } = useFormStatus();
  const isCurrent = current === value;

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
      className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 font-display text-lg font-bold transition-all duration-200 active:scale-[0.97] disabled:opacity-50 ${styles} ${
        isCurrent ? 'ring-2 ring-ink-3/30 ring-offset-2 ring-offset-surface' : ''
      }`}
    >
      {pending && <Spinner />}
      {label}
      {isCurrent && <span className="text-xs font-semibold opacity-70">נבחר</span>}
    </button>
  );
}

function AlreadyVoted({
  choice,
  anonymous,
  onChange,
}: {
  choice: string;
  anonymous: boolean;
  onChange: () => void;
}) {
  return (
    <div className="animate-rise flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
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
            {anonymous && (
              <span className="mr-1.5 text-xs font-normal text-ink-3">
                (בעילום שם)
              </span>
            )}
          </p>
          <p className="mt-0.5 text-sm leading-relaxed text-ink-2">
            אפשר לשנות את ההצבעה כל עוד היא פתוחה. לכל דייר נספר קול אחד.
          </p>
        </div>
      </div>

      <button type="button" onClick={onChange} className="btn btn-ghost btn-sm">
        שינוי ההצבעה
      </button>
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
          לא ניתן להוסיף או לשנות הצבעות אחרי מועד הסגירה.
        </p>
      </div>
    </div>
  );
}
