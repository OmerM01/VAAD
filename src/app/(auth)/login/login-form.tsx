'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import type { Route } from 'next';

import { signIn } from '@/lib/actions/auth';
import { IDLE } from '@/lib/actions/state';
import {
  Field,
  FormError,
  SubmitButton,
  useStickyFields,
} from '@/components/ui/form';

export function LoginForm({ initialEmail = '' }: { initialEmail?: string }) {
  const [state, action] = useActionState(signIn, IDLE);
  const { values, field } = useStickyFields({ email: initialEmail });

  // carry whatever was typed over to the reset screen rather than asking for it
  const forgotHref = (
    values.email
      ? `/forgot-password?email=${encodeURIComponent(values.email)}`
      : '/forgot-password'
  ) as Route;

  return (
    <form action={action} className="space-y-4">
      <FormError message={state.error} />

      <Field label="אימייל">
        <input
          {...field('email')}
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
            href={forgotHref}
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
