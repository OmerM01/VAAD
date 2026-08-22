import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

import { ResetPasswordForm } from './reset-form';

export const metadata = { title: 'סיסמה חדשה' };

/**
 * Reached only after /auth/reset exchanged the emailed code for a session.
 * Without one there is nothing to update, so the visitor goes back to ask for
 * a fresh link.
 */
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/forgot-password?expired=1');

  return (
    <div className="animate-rise">
      <div className="card p-8">
        <span className="eyebrow">כמעט סיימנו</span>
        <h1 className="mt-1.5 font-display text-2xl font-bold text-brand-900">
          בחירת סיסמה חדשה
        </h1>
        <p className="mt-2 mb-7 text-sm leading-relaxed text-ink-2">
          מגדירים סיסמה חדשה ל-{user.email} וממשיכים ישר לבניין.
        </p>

        <ResetPasswordForm />
      </div>
    </div>
  );
}
