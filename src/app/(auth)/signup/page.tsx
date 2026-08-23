import Link from 'next/link';

import { SignupForm } from './signup-form';

export const metadata = { title: 'הרשמה' };

export default async function SignupPage({ searchParams }: PageProps<'/signup'>) {
  const { mode } = await searchParams;
  return (
    <div className="animate-rise">
      <div className="card p-8">
        <span className="eyebrow">הרשמה</span>
        <h1 className="mt-1.5 font-display text-2xl font-bold text-heading">
          פתיחת חשבון
        </h1>
        <p className="mt-2 mb-7 text-sm text-ink-2">
          חשבון אחד לכל דייר. השיוך לבניין ולתפקיד נקבע לפי הקוד — פעם אחת,
          בהרשמה.
        </p>

        <SignupForm initialMode={mode === 'create' ? 'create' : 'join'} />
      </div>

      <p className="mt-5 text-center text-sm text-ink-2">
        כבר רשום?{' '}
        <Link
          href="/login"
          className="font-semibold text-brand-600 underline-offset-4 hover:underline"
        >
          התחברות
        </Link>
      </p>
    </div>
  );
}
