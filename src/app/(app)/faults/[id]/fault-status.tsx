'use client';

import { useActionState, useOptimistic } from 'react';
import { useFormStatus } from 'react-dom';

import { updateFaultStatus } from '@/lib/actions/faults';
import { IDLE } from '@/lib/actions/state';
import {
  FAULT_STATUSES,
  STATUS_BADGE,
  STATUS_LABEL,
  isFaultStatus,
} from '@/lib/faults';
import { useActionToast } from '@/components/toast';
import { FormError, Spinner } from '@/components/ui/form';
import type { FaultStatus } from '@/lib/database.types';

/**
 * Owns the progress rail, the badge and the three buttons together, so a status
 * change shows in all of them the moment it is clicked rather than after the
 * round trip. If the server refuses, React rolls all three back at once.
 */
export function FaultStatusCard({
  faultId,
  status,
  isVaad,
  category,
  children,
}: {
  faultId: string;
  status: FaultStatus;
  isVaad: boolean;
  category: string;
  /** The parts of the card that do not depend on the status. */
  children: React.ReactNode;
}) {
  const [state, action] = useActionState(updateFaultStatus, IDLE);
  useActionToast(state);

  const [current, applyStatus] = useOptimistic(
    status,
    (_prev: FaultStatus, next: FaultStatus) => next,
  );

  const stepIndex = FAULT_STATUSES.findIndex((s) => s.id === current);

  function submit(formData: FormData) {
    const next = formData.get('status');
    if (isFaultStatus(next)) applyStatus(next);
    return action(formData);
  }

  return (
    <>
      <article className="card animate-rise overflow-hidden">
        <div className="flex h-1.5">
          {FAULT_STATUSES.map((step, i) => (
            <span
              key={step.id}
              className={`h-full flex-1 transition-colors duration-500 ${
                i <= stepIndex ? 'bg-clay-400' : 'bg-line'
              }`}
            />
          ))}
        </div>

        <div className="p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <span className="badge badge-neutral">{category}</span>
            <span
              key={current}
              className={`badge ${STATUS_BADGE[current]}`}
              style={{ animation: 'pop 0.4s cubic-bezier(0.16,1,0.3,1) both' }}
            >
              <span className="badge-dot" />
              {STATUS_LABEL[current]}
            </span>
          </div>
          {children}
        </div>
      </article>

      <section className="card animate-rise p-6">
        {isVaad ? (
          <form action={submit}>
            <input type="hidden" name="fault_id" value={faultId} />

            <p className="field-label">עדכון סטטוס</p>
            <div className="grid grid-cols-3 gap-2">
              {FAULT_STATUSES.map((s) => (
                <StatusButton
                  key={s.id}
                  value={s.id}
                  label={s.label}
                  active={s.id === current}
                />
              ))}
            </div>

            <div className="mt-3">
              <FormError message={state.error} />
            </div>
          </form>
        ) : (
          <div className="flex items-start gap-3">
            <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0 text-ink-3" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <rect x="4.5" y="8.5" width="11" height="8" rx="2" />
              <path d="M7.5 8.5V6.75a2.5 2.5 0 0 1 5 0V8.5" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-ink">
                עדכון הסטטוס שמור לחברי הוועד
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-ink-2">
                ההגבלה נאכפת בבסיס הנתונים עצמו, ולא רק בממשק. תוכל לעקוב כאן
                אחרי כל שינוי בסטטוס.
              </p>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function StatusButton({
  value,
  label,
  active,
}: {
  value: FaultStatus;
  label: string;
  active: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name="status"
      value={value}
      disabled={active || pending}
      aria-pressed={active}
      className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.97] ${
        active
          ? 'cursor-default border-cta bg-cta text-cta-ink shadow-sm'
          : 'border-line-strong bg-surface text-ink-2 hover:border-brand-400 hover:text-brand-700 disabled:opacity-50'
      }`}
    >
      {pending && !active && <Spinner className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}
