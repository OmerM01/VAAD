'use client';

import { useActionState } from 'react';

import { updatePassword } from '@/lib/actions/auth';
import { IDLE } from '@/lib/actions/state';
import { Field, FormError, SubmitButton } from '@/components/ui/form';

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePassword, IDLE);

  return (
    <form action={action} className="space-y-4">
      <FormError message={state.error} />

      <Field label="סיסמה חדשה" hint="לפחות 8 תווים">
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          autoFocus
          className="input"
          placeholder="••••••••"
        />
      </Field>

      <Field label="אימות הסיסמה">
        <input
          name="password_confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="input"
          placeholder="••••••••"
        />
      </Field>

      <SubmitButton pendingLabel="שומר…">שמירת הסיסמה החדשה</SubmitButton>
    </form>
  );
}
