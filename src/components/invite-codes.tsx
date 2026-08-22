'use client';

import { useState } from 'react';

import type { InviteCodes } from '@/lib/database.types';

const CARDS = [
  {
    key: 'dayar_code',
    title: 'קוד לדיירים',
    body: 'מדווחים תקלות, רואים את התקציב, מעלים הצעות ומצביעים.',
    tone: 'brand',
  },
  {
    key: 'vaad_code',
    title: 'קוד לחברי ועד',
    body: 'כל מה שדייר עושה, ובנוסף עדכון סטטוס תקלות והזנת תנועות כספיות.',
    tone: 'clay',
  },
] as const;

const TONES = {
  brand: {
    chip: 'bg-brand-50 border-brand-100 text-brand-800',
    label: 'text-brand-600',
  },
  clay: {
    chip: 'bg-clay-50 border-clay-100 text-clay-600',
    label: 'text-clay-500',
  },
};

export function InviteCodesCard({ codes }: { codes: InviteCodes }) {
  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-brand-900">
          קודי ההצטרפות של הבניין
        </h2>
        <span className="badge badge-neutral">גלוי לחברי ועד בלבד</span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
        העבירו לכל אדם את הקוד שמתאים לתפקיד שלו — למשל בקבוצת הוואטסאפ של
        הבניין. הקוד נדרש פעם אחת בלבד, בהרשמה.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <CodeBlock
            key={card.key}
            title={card.title}
            body={card.body}
            code={codes[card.key]}
            tone={card.tone}
          />
        ))}
      </div>
    </section>
  );
}

function CodeBlock({
  title,
  body,
  code,
  tone,
}: {
  title: string;
  body: string;
  code: string;
  tone: keyof typeof TONES;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked (insecure origin / permissions) — the code is on
      // screen anyway, so there is nothing useful to report here.
    }
  }

  const styles = TONES[tone];

  return (
    <div className={`rounded-xl border p-4 ${styles.chip}`}>
      <p className={`text-xs font-bold ${styles.label}`}>{title}</p>
      <p className="mt-1 text-xs leading-relaxed opacity-80">{body}</p>

      <div className="mt-3 flex items-center gap-2">
        <code className="code-chip flex-1 rounded-lg border border-current/15 bg-surface/70 px-3 py-2 text-center">
          {code}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label={`העתקת ${title}`}
          className="btn btn-ghost btn-sm shrink-0 bg-surface/70"
        >
          {copied ? (
            <>
              <CheckIcon />
              הועתק
            </>
          ) : (
            <>
              <CopyIcon />
              העתק
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="7" y="7" width="9" height="9" rx="2" />
      <path d="M13 5.5A1.5 1.5 0 0 0 11.5 4h-6A1.5 1.5 0 0 0 4 5.5v6A1.5 1.5 0 0 0 5.5 13" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m4.5 10.5 3.5 3.5 7.5-8" />
    </svg>
  );
}
