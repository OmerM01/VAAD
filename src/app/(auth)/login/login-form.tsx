'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { signIn } from '@/lib/actions/auth';
import { IDLE } from '@/lib/actions/state';
import { Field, FormError, SubmitButton } from '@/components/ui/form';

export function LoginForm() {
  const [state, action] = useActionState(signIn, IDLE);

  return (
    <form action={action} className="space-y-4">
      <FormError message={state.error} />

      <Field label="אימייל">
        <input
          name="email"
          type="email"
          dir="ltr"
          autoComplete="email"
          required
          className="input text-left"
          placeholder="you@example.com"
        />
      </Field>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label className="field-label">סיסמה</label>
          <Link
            href="/forgot-password"
            className="mb-1.5 text-xs font-semibold text-brand-600 underline-offset-4 hover:underline"
          >
            שכחתי סיסמה
          </Link>
        </div>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
          placeholder="••••••••"
        />
      </div>

      <SubmitButton pendingLabel="מתחבר…">כניסה</SubmitButton>
    </form>
  );
}
