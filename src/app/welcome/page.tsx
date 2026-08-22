import { redirect } from 'next/navigation';

import { getProfile } from '@/lib/auth';
import { signOut } from '@/lib/actions/auth';
import { Wordmark } from '@/components/brand';

import { WelcomeForm } from './welcome-form';

export const metadata = { title: 'השלמת הרשמה' };

/**
 * Reached only by an account that exists in Auth but has no building — the
 * invite code was mistyped during signup, or the join failed midway. The email
 * and password are already saved, so only the building step is repeated here.
 */
export default async function WelcomePage() {
  const profile = await getProfile();
  if (profile === null) redirect('/login');
  if (profile !== 'no-profile') redirect('/dashboard');

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between px-5 py-6">
        <Wordmark />
        <form action={signOut}>
          <button type="submit" className="btn btn-ghost btn-sm">
            התנתקות
          </button>
        </form>
      </header>

      <main className="flex flex-1 items-start justify-center px-5 pb-16">
        <div className="animate-rise w-full max-w-lg">
          <div className="card p-8">
            <span className="eyebrow">כמעט שם</span>
            <h1 className="mt-1.5 font-display text-2xl font-bold text-brand-900">
              נשאר רק לשייך אותך לבניין
            </h1>
            <p className="mt-2 mb-6 text-sm leading-relaxed text-ink-2">
              החשבון שלך נוצר, אבל השיוך לבניין לא הושלם — לרוב בגלל קוד הצטרפות
              שגוי. אין צורך להירשם מחדש, רק להזין את הקוד הנכון.
            </p>

            <WelcomeForm />
          </div>
        </div>
      </main>
    </div>
  );
}
