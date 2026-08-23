import Link from 'next/link';
import type { Route } from 'next';

import { ForgotPasswordForm } from './forgot-form';

export const metadata = { title: 'איפוס סיסמה' };

export default async function ForgotPasswordPage({
  searchParams,
}: PageProps<'/forgot-password'>) {
  const { expired, email } = await searchParams;
  const prefill = typeof email === 'string' ? email : '';
  const backHref = (prefill ? `/login?email=${encodeURIComponent(prefill)}` : '/login') as Route;

  return (
    <div className="animate-rise">
      <div className="card p-8">
        <span className="eyebrow">שכחת סיסמה</span>
        <h1 className="mt-1.5 font-display text-2xl font-bold text-heading">
          איפוס סיסמה
        </h1>
        <p className="mt-2 mb-7 text-sm leading-relaxed text-ink-2">
          נשלח אליך קישור לבחירת סיסמה חדשה. אין צורך בקוד ההצטרפות — השיוך
          שלך לבניין נשמר.
        </p>

        {expired === '1' && (
          <p className="form-error mb-5" role="alert">
            <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm.75 4.5a.75.75 0 0 0-1.5 0v4a.75.75 0 0 0 1.5 0v-4ZM10 13a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              הקישור פג תוקף או כבר נוצל. אפשר לבקש קישור חדש כאן.
            </span>
          </p>
        )}

        <ForgotPasswordForm initialEmail={prefill} />
      </div>

      <p className="mt-5 text-center text-sm text-ink-2">
        נזכרת בסיסמה?{' '}
        <Link
          href={backHref}
          className="font-semibold text-brand-600 underline-offset-4 hover:underline"
        >
          חזרה להתחברות
        </Link>
      </p>
    </div>
  );
}
