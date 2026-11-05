'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { signInAsDemo } from '@/lib/actions/auth';
import { IDLE } from '@/lib/actions/state';
import { FormError, Spinner } from '@/components/ui/form';

type Role = 'vaad' | 'dayar';
type Tone = 'light' | 'dark';

/**
 * The demo call to action.
 *
 * The demo needs a role before it can sign anyone in, so it starts as one
 * button and opens into the two roles in place rather than spending three
 * slots in the row before anybody asks for them.
 *
 * On the hero it sits on a dark panel and leads the row, so the colours are
 * passed in rather than baked in.
 */
export function DemoEntry({
  tone = 'light',
  label = 'להתרשם בלי להירשם',
}: {
  tone?: Tone;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  // which button was pressed, so only that one shows the spinner
  const [chosen, setChosen] = useState<Role | null>(null);
  const [state, action] = useActionState(signInAsDemo, IDLE);

  const dark = tone === 'dark';

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          dark
            ? 'group inline-flex items-center gap-2 rounded-xl bg-[#e07f5c] px-5 py-3 text-[0.9375rem] font-bold text-[#2b1208] shadow-[0_8px_30px_-8px_rgba(224,127,92,0.7)] transition-all duration-200 hover:bg-[#eb8d69] active:scale-[0.98]'
            : 'btn btn-ghost group'
        }
      >
        {label}
        <svg
          viewBox="0 0 20 20"
          className={`h-4 w-4 rotate-180 transition-all duration-200 group-hover:-translate-x-0.5 ${
            dark ? 'text-[#2b1208]' : 'text-line-strong group-hover:text-brand-500'
          }`}
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
        <span
          className={`text-sm font-semibold ${dark ? 'text-[#a9c4dc]' : 'text-ink-2'}`}
        >
          להיכנס לבניין לדוגמה כ־
        </span>
        <RoleButton role="vaad" label="חבר ועד" chosen={chosen} onChoose={setChosen} dark={dark} />
        <RoleButton role="dayar" label="דייר" chosen={chosen} onChoose={setChosen} dark={dark} />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className={`text-sm font-semibold underline-offset-4 hover:underline ${
            dark ? 'text-[#7b9bb8] hover:text-[#a9c4dc]' : 'text-ink-3 hover:text-ink-2'
          }`}
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
  dark,
}: {
  role: Role;
  label: string;
  chosen: Role | null;
  onChoose: (role: Role) => void;
  dark: boolean;
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
      className={
        dark
          ? 'inline-flex items-center gap-1.5 rounded-lg bg-[#e07f5c] px-4 py-2 text-sm font-bold text-[#2b1208] transition-all duration-200 hover:bg-[#eb8d69] active:scale-[0.98] disabled:opacity-50'
          : 'btn btn-ghost btn-sm border-brand-400 text-brand-700 hover:bg-brand-50 disabled:opacity-50'
      }
    >
      {busy && <Spinner className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}
