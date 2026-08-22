'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { voteOnProposal } from '@/lib/actions/proposals';
import { IDLE } from '@/lib/actions/state';
import { FormError, Spinner } from '@/components/ui/form';

export function VotePanel({ proposalId }: { proposalId: string }) {
  const [state, action] = useActionState(voteOnProposal, IDLE);

  return (
    <form action={action}>
      <input type="hidden" name="proposal_id" value={proposalId} />

      <h2 className="font-display text-lg font-bold text-brand-900">
        ההצבעה שלך
      </h2>
      <p className="mt-0.5 mb-4 text-sm text-ink-2">
        אפשר להצביע פעם אחת בלבד, ואי אפשר לשנות את ההצבעה אחר כך.
      </p>

      <FormError message={state.error} />

      <label className="mt-1 mb-4 flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-surface-2 p-3.5 transition-colors hover:border-line-strong">
        <input
          name="voter_anonymous"
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-brand-600)]"
        />
        <span>
          <span className="block text-sm font-semibold text-ink">
            להצביע בעילום שם
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-ink-2">
            ההצבעה תיספר בתוצאה, אבל השם שלך לא יופיע ברשימת המצביעים כשההצבעה
            תיסגר.
          </span>
        </span>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <VoteButton value="for" label="בעד" tone="ok" />
        <VoteButton value="against" label="נגד" tone="clay" />
      </div>
    </form>
  );
}

function VoteButton({
  value,
  label,
  tone,
}: {
  value: 'for' | 'against';
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
      className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 font-display text-lg font-bold transition-all duration-200 disabled:opacity-50 ${styles}`}
    >
      {pending && <Spinner />}
      {label}
    </button>
  );
}
