'use client';

import { useActionState, useState } from 'react';

import { createFault } from '@/lib/actions/faults';
import { IDLE } from '@/lib/actions/state';
import { FAULT_CATEGORIES } from '@/lib/faults';
import { Field, FormError, SubmitButton } from '@/components/ui/form';

export function ReportFault() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createFault, IDLE);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-accent"
      >
        <PlusIcon />
        דיווח תקלה
      </button>
    );
  }

  return (
    <section className="card animate-rise w-full p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-brand-900">
            דיווח תקלה חדשה
          </h2>
          <p className="mt-0.5 text-sm text-ink-2">
            התקלה תופיע מיד לכל דיירי הבניין, בסטטוס &quot;פתוח&quot;.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn btn-ghost btn-sm"
        >
          ביטול
        </button>
      </div>

      <form action={action} className="mt-5 space-y-4">
        <FormError message={state.error} />

        <Field label="מה קרה?">
          <input
            name="title"
            type="text"
            required
            maxLength={120}
            autoFocus
            className="input"
            placeholder="נורה שרופה בחדר המדרגות, קומה 3"
          />
        </Field>

        <Field label="קטגוריה">
          <select name="category" required defaultValue="other" className="input">
            {FAULT_CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="פירוט" hint="לא חובה">
          <textarea
            name="description"
            maxLength={2000}
            className="input"
            placeholder="מתי זה התחיל, איפה בדיוק, ומה כבר ניסיתם"
          />
        </Field>

        <SubmitButton pendingLabel="שולח…" className="btn btn-accent w-full">
          שליחת הדיווח
        </SubmitButton>
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
