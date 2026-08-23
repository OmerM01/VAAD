'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { signInAsDemo } from '@/lib/actions/auth';
import { IDLE } from '@/lib/actions/state';
import { FormError, Spinner } from '@/components/ui/form';

export function DemoAccess() {
  const [state, action] = useActionState(signInAsDemo, IDLE);

  return (
    <form action={action} className="card-quiet mt-5 p-5">
      <div className="flex items-start gap-2.5">
        <svg
          viewBox="0 0 20 20"
          className="mt-0.5 h-4.5 w-4.5 shrink-0 text-clay-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10 2.5 2.5 6.2v7.6L10 17.5l7.5-3.7V6.2L10 2.5Z" />
          <path d="M2.5 6.2 10 10m0 0 7.5-3.8M10 10v7.5" />
        </svg>
        <div>
          <h2 className="font-display text-base font-bold text-heading">
            רק רוצה להסתכל?
          </h2>
          <p className="mt-0.5 text-sm leading-relaxed text-ink-2">
            אפשר להיכנס לבניין לדוגמה, מלא בתקלות, תנועות והצבעות. בחר תפקיד —
            ההבדל ביניהם הוא בדיוק ההבדל האמיתי במערכת.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <FormError message={state.error} />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <DemoButton
          role="vaad"
          label="כניסה כחבר ועד"
          hint="מעדכן תקלות ומזין תקציב"
        />
        <DemoButton
          role="dayar"
          label="כניסה כדייר"
          hint="מדווח, צופה ומצביע"
        />
      </div>
    </form>
  );
}

function DemoButton({
  role,
  label,
  hint,
}: {
  role: 'vaad' | 'dayar';
  label: string;
  hint: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name="role"
      value={role}
      disabled={pending}
      className="group flex items-center justify-between gap-2 rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 text-right transition-all duration-200 hover:border-brand-400 active:scale-[0.98] disabled:opacity-50"
    >
      <span>
        <span className="block text-sm font-bold text-heading">{label}</span>
        <span className="mt-0.5 block text-[0.6875rem] text-ink-3">{hint}</span>
      </span>
      {pending ? (
        <Spinner className="h-4 w-4 shrink-0 text-ink-3" />
      ) : (
        <svg
          viewBox="0 0 20 20"
          className="h-4 w-4 shrink-0 rotate-180 text-line-strong transition-all duration-200 group-hover:-translate-x-0.5 group-hover:text-brand-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m8 4 6 6-6 6" />
        </svg>
      )}
    </button>
  );
}
