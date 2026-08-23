'use client';

import { useActionState, useState } from 'react';

import { createProposal } from '@/lib/actions/proposals';
import { IDLE } from '@/lib/actions/state';
import { VOTING_PERIODS } from '@/lib/proposals';
import { Field, FormError, SubmitButton } from '@/components/ui/form';

export function NewProposal() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createProposal, IDLE);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-primary">
        <PlusIcon />
        העלאת הצעה
      </button>
    );
  }

  return (
    <section className="card animate-rise w-full p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-heading">
            הצעה חדשה להצבעה
          </h2>
          <p className="mt-0.5 text-sm text-ink-2">
            כל דייר בבניין יוכל להצביע בעד או נגד, פעם אחת.
          </p>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">
          ביטול
        </button>
      </div>

      <form action={action} className="mt-5 space-y-4">
        <FormError message={state.error} />

        <Field label="מה ההצעה?">
          <input
            name="title"
            type="text"
            required
            maxLength={120}
            autoFocus
            className="input"
            placeholder="להתקין מצלמות אבטחה בכניסה ובחניון"
          />
        </Field>

        <Field label="פירוט" hint="לא חובה">
          <textarea
            name="description"
            maxLength={2000}
            className="input"
            placeholder="כמה זה עולה, מי הספק, ולמה זה נחוץ דווקא עכשיו"
          />
        </Field>

        <Field label="משך ההצבעה">
          <select name="voting_days" required defaultValue={7} className="input">
            {VOTING_PERIODS.map((period) => (
              <option key={period.days} value={period.days}>
                {period.label}
              </option>
            ))}
          </select>
        </Field>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-surface-2 p-3.5 transition-colors hover:border-line-strong">
          <input
            name="creator_anonymous"
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-brand-600)]"
          />
          <span>
            <span className="block text-sm font-semibold text-ink">
              להעלות את ההצעה בעילום שם
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-ink-2">
              השם שלך לא יוצג לאף אחד — גם לא לחברי הוועד. ההגבלה נאכפת בבסיס
              הנתונים, כך שאי אפשר לחשוף אותך דרך ה-API.
            </span>
          </span>
        </label>

        <SubmitButton pendingLabel="מעלה…">פרסום ההצעה</SubmitButton>
      </form>
    </section>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M10 4.5v11M4.5 10h11" />
    </svg>
  );
}
