'use client';

import { useActionState } from 'react';

import { requestPasswordReset } from '@/lib/actions/auth';
import { RESET_IDLE } from '@/lib/actions/state';
import { Field, FormError, SubmitButton } from '@/components/ui/form';

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, RESET_IDLE);

  if (state.sent) {
    return (
      <div className="animate-fade flex items-start gap-3 rounded-xl border border-ok-100 bg-ok-50 p-4 text-ok-600">
        <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
          <path d="m3 6 7 5 7-5" />
        </svg>
        <div>
          <p className="font-display text-base font-bold">בדוק את תיבת המייל</p>
          <p className="mt-0.5 text-sm leading-relaxed">
            אם הכתובת רשומה במערכת, נשלח אליה קישור לבחירת סיסמה חדשה. הקישור
            תקף לשעה אחת וניתן לשימוש פעם אחת. שווה להציץ גם בתיקיית הספאם.
          </p>
        </div>
      </div>
    );
  }

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
          autoFocus
          className="input text-left"
          placeholder="you@example.com"
        />
      </Field>

      <SubmitButton pendingLabel="שולח…">שליחת קישור לאיפוס</SubmitButton>
    </form>
  );
}
