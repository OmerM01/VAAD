'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { signInAsDemo } from '@/lib/actions/auth';
import { IDLE } from '@/lib/actions/state';
import { FormError, Spinner } from '@/components/ui/form';

type Role = 'vaad' | 'dayar';

/**
 * The third call to action on the landing page.
 *
 * The demo needs a role before it can sign anyone in, and three buttons in a
 * row would crowd the hero — so it starts as one and opens into the two roles
 * in place, keeping the row at its original width until someone asks.
 */
export function DemoEntry() {
  const [open, setOpen] = useState(false);
  // which button was pressed, so only that one shows the spinner
  const [chosen, setChosen] = useState<Role | null>(null);
  const [state, action] = useActionState(signInAsDemo, IDLE);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-ghost group"
      >
        להתרשם בלי להירשם
        <svg
          viewBox="0 0 20 20"
          className="h-4 w-4 rotate-180 text-line-strong transition-all duration-200 group-hover:-translate-x-0.5 group-hover:text-brand-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m8 4 6 6-6 6" />
        </svg>
      </button>
    );
  }

  return (
    <form action={action} className="animate-slide-in">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-ink-2">להיכנס לבניין לדוגמה כ־</span>
        <RoleButton role="vaad" label="חבר ועד" chosen={chosen} onChoose={setChosen} />
        <RoleButton role="dayar" label="דייר" chosen={chosen} onChoose={setChosen} />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm font-semibold text-ink-3 underline-offset-4 hover:text-ink-2 hover:underline"
        >
          ביטול
        </button>
      </div>

      <div className="mt-2">
        <FormError message={state.error} />
      </div>
    </form>
  );
}

function RoleButton({
  role,
  label,
  chosen,
  onChoose,
}: {
  role: Role;
  label: string;
  chosen: Role | null;
  onChoose: (role: Role) => void;
}) {
  const { pending } = useFormStatus();
  const busy = pending && chosen === role;

  return (
    <button
      type="submit"
      name="role"
      value={role}
      onClick={() => onChoose(role)}
      disabled={pending}
      className="btn btn-ghost btn-sm border-brand-400 text-brand-700 hover:bg-brand-50 disabled:opacity-50"
    >
      {busy && <Spinner className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}
