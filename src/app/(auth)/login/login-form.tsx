'use client';

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

      <Field label="סיסמה">
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
          placeholder="••••••••"
        />
      </Field>

      <SubmitButton pendingLabel="מתחבר…">כניסה</SubmitButton>
    </form>
  );
}
