import Link from 'next/link';

import { Wordmark } from '@/components/brand';

export const metadata = { title: 'הרשמה' };

/** Placeholder — the real form arrives with the auth module (step 2). */
export default function Page() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-20">
      <div className="card animate-rise w-full max-w-md p-8 text-center">
        <Wordmark className="justify-center" />
        <h1 className="mt-6 font-display text-2xl font-bold text-brand-900">הרשמה</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-2">
          המסך הזה ייבנה בשלב הבא — הרשמה והתחברות עם קוד הצטרפות.
        </p>
        <Link href="/" className="btn btn-ghost mt-6">
          חזרה לדף הבית
        </Link>
      </div>
    </main>
  );
}
