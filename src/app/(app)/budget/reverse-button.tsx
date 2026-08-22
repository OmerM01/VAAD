'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { reverseTransaction } from '@/lib/actions/budget';
import { IDLE } from '@/lib/actions/state';
import { Spinner } from '@/components/ui/form';

export function ReverseButton({
  transactionId,
  description,
}: {
  transactionId: string;
  description: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, action] = useActionState(reverseTransaction, IDLE);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-ink-3 transition-colors hover:bg-danger-50 hover:text-danger-500"
      >
        ביטול
      </button>
    );
  }

  return (
    <form action={action} className="shrink-0">
      <input type="hidden" name="transaction_id" value={transactionId} />
      <div className="flex items-center gap-1.5">
        <span className="hidden text-xs text-ink-2 sm:inline">
          לבטל את &quot;{description.slice(0, 20)}
          {description.length > 20 ? '…' : ''}&quot;?
        </span>
        <ConfirmButton />
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-md px-2 py-1 text-xs font-semibold text-ink-3 hover:text-ink"
        >
          לא
        </button>
      </div>
      {state.error && (
        <p className="mt-1 text-xs font-semibold text-danger-500">{state.error}</p>
      )}
    </form>
  );
}

function ConfirmButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-1 rounded-md bg-danger-500 px-2.5 py-1 text-xs font-bold text-white transition-colors hover:bg-danger-600 disabled:opacity-50"
    >
      {pending && <Spinner className="h-3 w-3" />}
      כן, בטל
    </button>
  );
}
