import Link from 'next/link';

import { DemoEntry } from '@/components/demo-entry';

/* The hero panel is deliberately dark in both themes, so its colours are
   literals rather than tokens — the token ramps invert under dark mode and
   would turn this panel light. */
const NIGHT = '#0b1824';
const PANEL = '#13263a';
const EDGE = '#24435f';
const SKY = '#8fb3d1';
const DIM = '#6d8ead';
const FLAME = '#e07f5c';

/* Which windows of the building are lit. A fixed pattern rather than a random
   one: the server and the browser have to agree on it. */
const WINDOWS = [
  1, 0, 1, 1, 0,
  1, 1, 0, 1, 1,
  0, 1, 1, 0, 1,
  1, 1, 0, 1, 0,
  1, 0, 1, 1, 1,
  0, 1, 1, 0, 1,
];

const FEATURES = [
  {
    tag: 'תקלות',
    title: 'כל תקלה עם סטטוס, לא עם סימן שאלה',
    body: 'דייר מדווח, הוועד מעדכן, וכל אחד בבניין רואה אם זה פתוח, בטיפול או סגור. אף אחד לא צריך לשאול שוב.',
    accent: 'clay',
  },
  {
    tag: 'תקציב',
    title: 'הקופה פתוחה לכל דייר',
    body: 'כל שקל שנכנס ויצא רשום, והיתרה מחושבת מהתנועות עצמן. תנועה לא נמחקת, רק מבוטלת בתנועת נגד.',
    accent: 'ok',
  },
  {
    tag: 'הצעות',
    title: 'רעיון שנגמר בהחלטה',
    body: 'מעלים הצעה, קובעים תאריך סגירה, מצביעים. אפשר גם בעילום שם — וגם הוועד לא רואה מי הצביע מה.',
    accent: 'brand',
  },
  {
    tag: 'לוח שכנים',
    title: 'מה שהשכנים נותנים זה לזה',
    body: 'בייביסיטר, הוצאת כלב, ארגז ירקות בהזמנה משותפת או מקדחה להשאלה. הבניין הוא גם קהילה, לא רק הוצאות.',
    accent: 'warn',
  },
] as const;

const TAGS: Record<string, string> = {
  clay: 'bg-clay-50 text-clay-600 border-clay-100',
  brand: 'bg-brand-50 text-brand-700 border-brand-100',
  ok: 'bg-ok-50 text-ok-600 border-ok-100',
  warn: 'bg-warn-50 text-warn-600 border-warn-100',
};

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      {/* ================================================================== */}
      {/*  Hero                                                              */}
      {/* ================================================================== */}
      <section className="relative overflow-hidden" style={{ background: NIGHT }}>
        {/* a soft pool of warmth behind the building */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/4 h-[36rem] w-[36rem] rounded-full opacity-50 blur-3xl"
          style={{ background: 'radial-gradient(circle, #1d4668 0%, transparent 70%)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-52 right-0 h-[30rem] w-[30rem] rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, #8a4028 0%, transparent 70%)' }}
        />

        <header className="relative">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
            <span className="flex items-center gap-2.5">
              <BuildingMark />
              <span className="font-display text-lg font-bold text-white">ועד בית</span>
            </span>
            <nav className="flex items-center gap-1.5">
              <Link
                href="/login"
                className="rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors duration-200 hover:bg-white/10"
                style={{ color: SKY }}
              >
                התחברות
              </Link>
              <Link
                href="/signup"
                className="rounded-lg border px-3.5 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10"
                style={{ borderColor: EDGE }}
              >
                הרשמה
              </Link>
            </nav>
          </div>
        </header>

        <div className="relative mx-auto grid w-full max-w-6xl gap-14 px-5 pt-14 pb-20 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:pt-20 lg:pb-28">
          <div>
            <div className="animate-fade flex flex-wrap items-center gap-1.5">
              {['תקלות', 'תקציב', 'הצבעות', 'לוח שכנים'].map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border px-2.5 py-1 text-xs font-semibold"
                  style={{ borderColor: EDGE, color: SKY }}
                >
                  {tag}
                </span>
              ))}
            </div>

            <h1
              className="animate-rise mt-7 font-display text-[2.5rem] leading-[1.1] font-bold sm:text-6xl"
              style={{ color: '#ffffff' }}
            >
              ועד בית הוא הדבר
              <br />
              הכי משעמם בעולם.
              <br />
              <span style={{ color: FLAME }}>בנינו אותו יפה בכל זאת.</span>
            </h1>

            {/* a thread of light under the headline */}
            <div
              aria-hidden
              className="sweep relative mt-7 h-px w-40 overflow-hidden"
              style={{ background: EDGE }}
            />

            <p
              className="animate-rise mt-7 max-w-lg text-lg leading-relaxed"
              style={{ animationDelay: '80ms', color: SKY }}
            >
              תקלות, תקציב והצבעות של הבניין במקום אחד. כל דייר רואה בדיוק את
              אותה תמונה, בלי לשאול אף אחד.
            </p>

            <div
              className="animate-rise mt-9 flex flex-wrap items-center gap-3"
              style={{ animationDelay: '160ms' }}
            >
              {/* the demo leads the row: a visitor should be inside in one click */}
              {process.env.DEMO_PASSWORD && (
                <DemoEntry tone="dark" label="להיכנס לבניין לדוגמה" />
              )}
              <Link
                href="/signup?mode=create"
                className="rounded-xl border px-5 py-3 text-[0.9375rem] font-semibold text-white transition-colors duration-200 hover:bg-white/10"
                style={{ borderColor: EDGE }}
              >
                יצירת בניין חדש
              </Link>
              <Link
                href="/signup?mode=join"
                className="rounded-xl border px-5 py-3 text-[0.9375rem] font-semibold transition-colors duration-200 hover:bg-white/10"
                style={{ borderColor: EDGE, color: SKY }}
              >
                יש לי קוד הצטרפות
              </Link>
            </div>

            <p className="mt-5 text-xs" style={{ color: DIM }}>
              בלי הרשמה ובלי סיסמה. בוחרים תפקיד ונכנסים.
            </p>
          </div>

          <BuildingArt />
        </div>
      </section>

      <main className="flex-1">
        {/* ================================================================== */}
        {/*  The argument: the message gets buried, the status does not        */}
        {/* ================================================================== */}
        <section className="border-b border-line/70 bg-paper">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-24">
            <div className="reveal max-w-2xl">
              <span className="eyebrow">הבעיה</span>
              <h2 className="mt-2 font-display text-3xl leading-tight font-bold text-heading sm:text-4xl">
                הודעה בקבוצה נבלעת.
                <br />
                סטטוס על מסך לא.
              </h2>
              <p className="mt-4 max-w-lg text-[1.0625rem] leading-relaxed text-ink-2">
                זה אותו דיווח בדיוק, פעמיים. ההבדל הוא רק איפה הוא נוחת.
              </p>
            </div>

            <div className="reveal mt-11 grid gap-5 lg:grid-cols-2">
              <WhatsAppThread />
              <FaultRow />
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/*  What is in it                                                     */}
        {/* ================================================================== */}
        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-24">
          <div className="reveal max-w-2xl">
            <span className="eyebrow">מה יש בפנים</span>
            <h2 className="mt-2 font-display text-3xl leading-tight font-bold text-heading sm:text-4xl">
              ארבעה דברים, מסך אחד
            </h2>
          </div>

          <div className="reveal mt-10 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <article
                key={f.tag}
                className="group card p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift sm:p-8"
              >
                <span className={`badge border ${TAGS[f.accent]}`}>{f.tag}</span>
                <h3 className="mt-4 font-display text-xl leading-snug font-bold text-heading">
                  {f.title}
                </h3>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-2">
                  {f.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ================================================================== */}
        {/*  Roles                                                             */}
        {/* ================================================================== */}
        <section className="border-y border-line/70 bg-surface-2">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-20">
            <div className="reveal grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
              <div>
                <span className="eyebrow">הרשאות</span>
                <h2 className="mt-2 font-display text-3xl leading-tight font-bold text-heading sm:text-4xl">
                  אותו מסך,
                  <br />
                  שני תפקידים
                </h2>
                <p className="mt-4 text-[1.0625rem] leading-relaxed text-ink-2">
                  קוד ההצטרפות קובע מי אתה. ההבדל אינו בעיצוב אלא במה שמותר
                  לעשות, וזה נאכף בבסיס הנתונים ולא בכפתורים.
                </p>
                <p className="mt-4 text-sm leading-relaxed text-ink-3">
                  שווה להיכנס לדמו פעם כחבר ועד ופעם כדייר. ההבדל בין שתי
                  הכניסות הוא כל הסיפור.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <RoleCard
                  name="דייר"
                  can={['מדווח תקלות', 'רואה את התקציב', 'מעלה הצעות ומצביע', 'מפרסם בלוח']}
                />
                <RoleCard
                  name="חבר ועד"
                  accent
                  can={[
                    'כל מה שדייר עושה',
                    'מעדכן סטטוס תקלות',
                    'מזין ומבטל תנועות',
                    'סוגר הצבעות',
                  ]}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/*  Closing                                                           */}
        {/* ================================================================== */}
        <section className="relative overflow-hidden" style={{ background: NIGHT }}>
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 left-1/3 h-96 w-96 rounded-full opacity-40 blur-3xl"
            style={{ background: 'radial-gradient(circle, #8a4028 0%, transparent 70%)' }}
          />
          <div className="relative mx-auto w-full max-w-3xl px-5 py-20 text-center sm:py-28">
            <h2
              className="font-display text-3xl leading-tight font-bold sm:text-5xl"
              style={{ color: '#ffffff' }}
            >
              הבניין לדוגמה פתוח.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed" style={{ color: SKY }}>
              שבעה דיירים, תקלות בכל הסטטוסים, חמישה חודשי תנועות והצבעה פתוחה
              שמחכה לקול שלך.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              {process.env.DEMO_PASSWORD && (
                <DemoEntry tone="dark" label="להיכנס לבניין לדוגמה" />
              )}
            </div>
          </div>
        </section>
      </main>

      <footer style={{ background: NIGHT, borderTop: `1px solid ${EDGE}` }}>
        <div
          className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between"
          style={{ color: DIM }}
        >
          <span>ועד בית — ניהול בניין משותף</span>
          <span className="num">Next.js · TypeScript · Supabase</span>
        </div>
      </footer>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function BuildingMark() {
  return (
    <span
      className="flex h-9 w-9 items-center justify-center rounded-lg"
      style={{ background: PANEL, border: `1px solid ${EDGE}` }}
    >
      <svg viewBox="0 0 20 20" className="h-4.5 w-4.5" aria-hidden="true">
        {[0, 1, 2].map((row) =>
          [0, 1].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={6 + col * 5}
              y={4 + row * 4.5}
              width="3"
              height="3"
              rx="0.6"
              fill={(row + col) % 2 === 0 ? FLAME : SKY}
              opacity={(row + col) % 2 === 0 ? 1 : 0.55}
            />
          )),
        )}
      </svg>
    </span>
  );
}

/** The hero's building: windows coming on, with three readings floating off it. */
function BuildingArt() {
  return (
    <div className="animate-fade relative mx-auto w-full max-w-[20rem]" style={{ animationDelay: '240ms' }}>
      <div
        className="rounded-3xl p-5 shadow-2xl"
        style={{ background: PANEL, border: `1px solid ${EDGE}` }}
      >
        <div className="mb-5 flex items-center justify-between">
          <span className="text-xs font-semibold" style={{ color: DIM }}>
            רוטשילד 42
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: SKY }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#4fb383' }} />
            7 דיירים
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {WINDOWS.map((lit, i) => (
            <span
              key={i}
              className={lit ? 'lamp' : ''}
              style={{
                display: 'block',
                aspectRatio: '1 / 1',
                borderRadius: '0.25rem',
                background: lit ? (i % 7 === 0 ? FLAME : '#f0c987') : '#1b3048',
                opacity: lit ? undefined : 0.14,
                animationDelay: `${(i % 9) * 0.32}s`,
              }}
            />
          ))}
        </div>

        <div className="mt-5 h-1.5 rounded-full" style={{ background: EDGE }} />
      </div>

      {/* readings lifted off the building */}
      <Floating className="-top-9 -left-12" delay="0s" label="יתרת הקופה" value="‏9,541 ₪" />
      <Floating className="top-[46%] -right-14" delay="1.4s" label="תקלות פתוחות" value="5" tone={FLAME} />
      <Floating className="-bottom-7 left-0" delay="2.6s" label="הצבעה נסגרת" value="בעוד 8 ימים" />
    </div>
  );
}

function Floating({
  className,
  label,
  value,
  delay,
  tone,
}: {
  className: string;
  label: string;
  value: string;
  delay: string;
  tone?: string;
}) {
  return (
    <div
      className={`drift absolute hidden rounded-xl px-3.5 py-2.5 shadow-xl sm:block ${className}`}
      style={{
        background: '#1a3049',
        border: `1px solid ${EDGE}`,
        animationDelay: delay,
      }}
    >
      <span className="block text-[0.625rem] font-semibold" style={{ color: DIM }}>
        {label}
      </span>
      <span
        className="num block text-base leading-tight font-bold"
        style={{ color: tone ?? '#ffffff' }}
      >
        {value}
      </span>
    </div>
  );
}

/** The report as it lands in a group chat, where it is one of forty. */
function WhatsAppThread() {
  const messages = [
    { who: 'דנה, דירה 2', text: 'מישהו יודע מתי באים לתקן את המעלית?', mine: false },
    { who: 'יוסי', text: 'אני חושב שדיברו עם טכנאי', mine: false },
    { who: 'אתה', text: 'אין מים חמים בקומה 3 כבר יומיים', mine: true },
    { who: 'רונית', text: '+1', mine: false },
    { who: 'משה', text: 'מישהו ראה את החבילה שלי?', mine: false },
    { who: 'דנה, דירה 2', text: 'אז מה עם המעלית', mine: false },
  ];

  return (
    <div className="card overflow-hidden p-0">
      <div className="flex items-center gap-2 border-b border-line/70 bg-chip px-5 py-3">
        <span className="h-2 w-2 rounded-full bg-ink-3" />
        <span className="text-sm font-bold text-ink-2">קבוצת הבניין</span>
        <span className="mr-auto text-xs text-ink-3">41 הודעות היום</span>
      </div>
      <div className="space-y-2.5 p-5">
        {messages.map((m, i) => (
          <div key={i} className={m.mine ? 'flex justify-start' : 'flex justify-end'}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-[0.8125rem] leading-snug ${
                m.mine
                  ? 'bg-clay-50 text-clay-600 ring-1 ring-clay-200'
                  : 'bg-chip text-ink-3'
              }`}
            >
              <span className="block text-[0.625rem] font-semibold opacity-70">{m.who}</span>
              {m.text}
            </div>
          </div>
        ))}
        <p className="pt-2 text-center text-xs text-ink-3">
          הדיווח שלך נמצא איפשהו למעלה. אף אחד לא יודע אם טיפלו בו.
        </p>
      </div>
    </div>
  );
}

/** The same report, as a row with a state. */
function FaultRow() {
  return (
    <div className="card flex flex-col overflow-hidden p-0">
      <div className="flex items-center gap-2 border-b border-line/70 bg-brand-50 px-5 py-3">
        <span className="h-2 w-2 rounded-full bg-brand-500" />
        <span className="text-sm font-bold text-brand-700">תקלות הבניין</span>
        <span className="mr-auto text-xs text-brand-500">5 פתוחות · 4 בטיפול</span>
      </div>
      <div className="flex flex-1 flex-col justify-center p-5">
        <div className="rounded-xl border border-line bg-surface-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-bold text-heading">
                אין מים חמים בקומה 3
              </h3>
              <p className="mt-1 text-xs text-ink-3">
                אינסטלציה · עומר קדוש · דירה 9 · שלשום
              </p>
            </div>
            <span className="badge badge-open shrink-0">
              <span className="badge-dot" />
              פתוח
            </span>
          </div>

          <ol className="mt-5 flex items-center gap-1.5">
            {[
              ['פתוח', true],
              ['בטיפול', false],
              ['סגור', false],
            ].map(([label, done], i) => (
              <li key={i} className="flex-1">
                <span
                  className={`block h-1.5 rounded-full ${done ? 'bg-clay-400' : 'bg-line'}`}
                />
                <span
                  className={`mt-1.5 block text-[0.625rem] font-semibold ${
                    done ? 'text-clay-600' : 'text-ink-3'
                  }`}
                >
                  {label}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <p className="pt-4 text-center text-xs text-ink-3">
          דיווח אחד, מצב אחד, וכל הבניין רואה אותו.
        </p>
      </div>
    </div>
  );
}

function RoleCard({
  name,
  can,
  accent = false,
}: {
  name: string;
  can: readonly string[];
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-card border p-6 ${
        accent ? 'border-clay-200 bg-clay-50' : 'border-line bg-surface'
      }`}
    >
      <h3
        className={`font-display text-lg font-bold ${
          accent ? 'text-clay-600' : 'text-heading'
        }`}
      >
        {name}
      </h3>
      <ul className="mt-3 space-y-2">
        {can.map((item) => (
          <li
            key={item}
            className={`flex items-start gap-2 text-sm leading-snug ${
              accent ? 'text-clay-600' : 'text-ink-2'
            }`}
          >
            <svg
              viewBox="0 0 16 16"
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m3 8.5 3.5 3.5L13 5" />
            </svg>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
