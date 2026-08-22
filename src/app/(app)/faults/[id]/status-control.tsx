'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { updateFaultStatus } from '@/lib/actions/faults';
import { IDLE } from '@/lib/actions/state';
import { FAULT_STATUSES } from '@/lib/faults';
import { FormError, Spinner } from '@/components/ui/form';
import type { FaultStatus } from '@/lib/database.types';

export function StatusControl({
  faultId,
  current,
}: {
  faultId: string;
  current: FaultStatus;
}) {
  const [state, action] = useActionState(updateFaultStatus, IDLE);

  return (
    <form action={action}>
      <input type="hidden" name="fault_id" value={faultId} />

      <p className="field-label">עדכון סטטוס</p>
      <div className="grid grid-cols-3 gap-2">
        {FAULT_STATUSES.map((status) => (
          <StatusButton
            key={status.id}
            value={status.id}
            label={status.label}
            active={status.id === current}
          />
        ))}
      </div>

      <div className="mt-3">
        <FormError message={state.error} />
      </div>
    </form>
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
      className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
        active
          ? 'cursor-default border-brand-600 bg-brand-600 text-white shadow-sm'
          : 'border-line-strong bg-surface text-ink-2 hover:border-brand-400 hover:text-brand-700 disabled:opacity-50'
      }`}
    >
      {pending && !active && <Spinner className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}
