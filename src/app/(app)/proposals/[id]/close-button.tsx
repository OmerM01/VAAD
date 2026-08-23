'use client';

import { useActionState, useState } from 'react';

import { closeProposal } from '@/lib/actions/proposals';
import { IDLE } from '@/lib/actions/state';
import { useActionToast } from '@/components/toast';
import { FormError, SubmitButton } from '@/components/ui/form';

export function CloseProposalButton({
  proposalId,
  totalVotes,
}: {
  proposalId: string;
  totalVotes: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, action] = useActionState(closeProposal, IDLE);
  useActionToast(state);

  if (!confirming) {
    return (
      <div className="mt-5 border-t border-line pt-5">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="btn btn-ghost btn-sm"
        >
          סגירת ההצבעה עכשיו
        </button>
        <p className="mt-1.5 text-xs text-ink-3">
          זמין לך כמעלה ההצעה ולחברי הוועד. אחרי הסגירה ייחשפו שמות המצביעים.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-5 border-t border-line pt-5">
      <input type="hidden" name="proposal_id" value={proposalId} />

      <FormError message={state.error} />

      <p className="mt-1 text-sm leading-relaxed text-ink-2">
        לסגור את ההצבעה עכשיו?{' '}
        {totalVotes === 0
          ? 'עדיין לא הצביע אף אחד, וההצעה תיסגר בלי הכרעה.'
          : `${totalVotes} דיירים כבר הצביעו. מי שטרם הצביע לא יוכל לעשות זאת.`}{' '}
        הפעולה אינה הפיכה.
      </p>

      <div className="mt-3 flex gap-2">
        <SubmitButton pendingLabel="סוגר…" className="btn btn-accent btn-sm">
          כן, לסגור את ההצבעה
        </SubmitButton>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="btn btn-ghost btn-sm"
        >
          ביטול
        </button>
      </div>
    </form>
  );
}
