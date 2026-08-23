import Link from 'next/link';

import { LoginForm } from './login-form';

export const metadata = { title: 'התחברות' };

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const { email } = await searchParams;
  return (
    <div className="animate-rise">
      <div className="card p-8">
        <span className="eyebrow">ברוך שובך</span>
        <h1 className="mt-1.5 font-display text-2xl font-bold text-heading">
          התחברות לחשבון
        </h1>
        <p className="mt-2 mb-7 text-sm text-ink-2">
          אחרי ההרשמה הראשונה כבר לא צריך קוד — רק אימייל וסיסמה.
        </p>

        <LoginForm initialEmail={typeof email === 'string' ? email : ''} />
      </div>

      <p className="mt-5 text-center text-sm text-ink-2">
        עדיין אין לך חשבון?{' '}
        <Link
          href="/signup"
          className="font-semibold text-brand-600 underline-offset-4 hover:underline"
        >
          הרשמה עם קוד הצטרפות
        </Link>
      </p>
    </div>
  );
}
