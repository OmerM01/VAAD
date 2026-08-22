import Link from 'next/link';

import { Wordmark } from '@/components/brand';

const FEATURES = [
  {
    label: 'תקלות',
    title: 'כל תקלה עם סטטוס ברור',
    body: 'דייר מדווח, הוועד מעדכן — פתוח, בטיפול או סגור. אף אחד לא צריך לשאול בוואטסאפ אם מישהו טיפל בזה.',
    accent: 'clay',
  },
  {
    label: 'תקציב',
    title: 'שקוף לכל דייר בבניין',
    body: 'כל הכנסה וכל הוצאה מתועדות, והיתרה מחושבת מהתנועות עצמן. לא עוד אקסל שרק לגזבר יש גישה אליו.',
    accent: 'brand',
  },
  {
    label: 'הצעות',
    title: 'רעיונות שמגיעים להכרעה',
    body: 'מעלים הצעה, קובעים תאריך סגירה ומצביעים. אפשר להצביע בעילום שם — התוצאה תמיד גלויה.',
    accent: 'ok',
  },
] as const;

const ACCENTS: Record<string, string> = {
  clay: 'bg-clay-50 text-clay-600 border-clay-100',
  brand: 'bg-brand-50 text-brand-700 border-brand-100',
  ok: 'bg-ok-50 text-ok-600 border-ok-100',
};

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-line/70 bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <Wordmark />
          <nav className="flex items-center gap-2">
            <Link href="/login" className="btn btn-ghost btn-sm">
              התחברות
            </Link>
            <Link href="/signup" className="btn btn-primary btn-sm">
              הרשמה
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* hero */}
        <section className="mx-auto w-full max-w-6xl px-5 pt-16 pb-14 sm:pt-24 sm:pb-20">
          <div className="max-w-3xl">
            <span className="badge badge-brand animate-fade">
              <span className="badge-dot" />
              ניהול ועד בית, בלי קבוצת הוואטסאפ
            </span>

            <h1 className="animate-rise mt-6 font-display text-4xl leading-[1.15] font-bold text-brand-900 sm:text-6xl">
              הבניין שלכם,
              <br />
              <span className="text-clay-500">מנוהל במקום אחד.</span>
            </h1>

            <p
              className="animate-rise mt-6 max-w-xl text-lg leading-relaxed text-ink-2"
              style={{ animationDelay: '80ms' }}
            >
              תקלות, תקציב והצבעות — לכל דייר יש את אותה תמונה, ולוועד יש כלי
              לעבוד איתו. כל בניין מנוהל בנפרד, עם קוד הצטרפות משלו.
            </p>

            <div
              className="animate-rise mt-9 flex flex-wrap items-center gap-3"
              style={{ animationDelay: '160ms' }}
            >
              <Link href="/signup" className="btn btn-primary">
                יצירת בניין חדש
              </Link>
              <Link href="/signup" className="btn btn-ghost">
                יש לי קוד הצטרפות
              </Link>
            </div>
          </div>
        </section>

        {/* features */}
        <section className="border-y border-line/70 bg-surface/60">
          <div className="mx-auto grid w-full max-w-6xl gap-px bg-line/70 px-0 sm:grid-cols-3">
            {FEATURES.map((f, i) => (
              <article
                key={f.label}
                className="animate-rise bg-surface p-7 sm:p-8"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <span className={`badge border ${ACCENTS[f.accent]}`}>{f.label}</span>
                <h2 className="mt-4 font-display text-xl font-bold text-brand-900">
                  {f.title}
                </h2>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-2">
                  {f.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* how it works */}
        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-20">
          <span className="eyebrow">איך מצטרפים</span>
          <h2 className="mt-2 font-display text-2xl font-bold text-brand-900 sm:text-3xl">
            שלושה צעדים, בלי טפסים
          </h2>

          <ol className="mt-8 grid gap-5 sm:grid-cols-3">
            {[
              ['הדייר הראשון פותח בניין', 'ומקבל שני קודי הצטרפות — אחד לדיירים ואחד לחברי ועד.'],
              ['מעבירים את הקוד', 'בקבוצת הוואטסאפ של הבניין, לפי מי אמור לקבל אילו הרשאות.'],
              ['כל אחד נרשם עם הקוד', 'והמערכת משייכת אותו לבניין ולתפקיד הנכון אוטומטית.'],
            ].map(([title, body], i) => (
              <li key={title} className="card relative p-6">
                <span className="num absolute -top-3 right-5 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-1 font-display text-base font-bold text-brand-900">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{body}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-t border-line/70 bg-surface/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-7 text-sm text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <span>ועד בית — פרויקט גמר בקורס פולסטאק</span>
          <span className="num">Next.js · TypeScript · Supabase</span>
        </div>
      </footer>
    </div>
  );
}
