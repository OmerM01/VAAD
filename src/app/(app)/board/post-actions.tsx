'use client';

import { useActionState, useOptimistic } from 'react';
import { useFormStatus } from 'react-dom';

import { closePost, toggleInterest } from '@/lib/actions/board';
import { IDLE } from '@/lib/actions/state';
import { useActionToast } from '@/components/toast';
import { Spinner } from '@/components/ui/form';

/**
 * Putting your hand up. The count and the button flip on click rather than
 * after the round trip, which matters most on a shared order where people watch
 * the number climb.
 */
export function InterestButton({
  postId,
  interested,
  count,
}: {
  postId: string;
  interested: boolean;
  count: number;
}) {
  const [state, action] = useActionState(toggleInterest, IDLE);
  useActionToast(state);

  const [view, apply] = useOptimistic(
    { interested, count },
    (current: { interested: boolean; count: number }) => ({
      interested: !current.interested,
      count: current.count + (current.interested ? -1 : 1),
    }),
  );

  function submit(formData: FormData) {
    apply(null);
    return action(formData);
  }

  return (
    <form action={submit} className="flex items-center gap-2.5">
      <input type="hidden" name="post_id" value={postId} />
      <input type="hidden" name="interested" value={view.interested ? 'yes' : 'no'} />

      <Toggle interested={view.interested} />

      {view.count > 0 && (
        <span className="num text-xs font-semibold text-ink-3">
          {view.count} מעוניינים
        </span>
      )}
    </form>
  );
}

function Toggle({ interested }: { interested: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`btn btn-sm transition-all active:scale-[0.97] ${
        interested
          ? 'border border-ok-100 bg-ok-50 text-ok-600'
          : 'btn-ghost'
      }`}
    >
      {pending ? (
        <Spinner className="h-3.5 w-3.5" />
      ) : interested ? (
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm3.7 6.2a.75.75 0 0 0-1.15-.96l-3.4 4.07-1.7-1.7a.75.75 0 1 0-1.06 1.06l2.28 2.28a.75.75 0 0 0 1.1-.05l3.93-4.7Z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M10 4.5v11M4.5 10h11" />
        </svg>
      )}
      {interested ? 'רשום' : 'אני מעוניין'}
    </button>
  );
}

/** Author or vaad member takes a notice down. */
export function ClosePostButton({ postId }: { postId: string }) {
  const [state, action] = useActionState(closePost, IDLE);
  useActionToast(state);

  return (
    <form action={action}>
      <input type="hidden" name="post_id" value={postId} />
      <RemoveButton />
    </form>
  );
}

function RemoveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md px-2 py-1 text-xs font-semibold text-ink-3 transition-colors hover:bg-danger-50 hover:text-danger-500 disabled:opacity-50"
    >
      {pending ? 'מסיר…' : 'הסרה מהלוח'}
    </button>
  );
}
