'use client';

import { useActionState, useState } from 'react';

import { createPost } from '@/lib/actions/board';
import { IDLE } from '@/lib/actions/state';
import { POST_DURATIONS, POST_KINDS } from '@/lib/board';
import { useActionToast } from '@/components/toast';
import { Field, FormError, SubmitButton } from '@/components/ui/form';
import type { PostKind } from '@/lib/database.types';

export function NewPost() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<PostKind>('offer');
  const [state, action] = useActionState(createPost, IDLE);
  useActionToast(state);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-accent">
        <PlusIcon />
        פרסום מודעה
      </button>
    );
  }

  const selected = POST_KINDS.find((k) => k.id === kind)!;

  return (
    <section className="card animate-rise w-full p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-heading">
            מודעה חדשה בלוח
          </h2>
          <p className="mt-0.5 text-sm text-ink-2">
            רק דיירי הבניין רואים את הלוח. השם ומספר הדירה שלך יוצגו לצד המודעה.
          </p>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">
          ביטול
        </button>
      </div>

      <form action={action} className="mt-5 space-y-4">
        <FormError message={state.error} />

        <input type="hidden" name="kind" value={kind} />
        <div>
          <p className="field-label">סוג המודעה</p>
          <div className="flex flex-wrap gap-2">
            {POST_KINDS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setKind(option.id)}
                aria-pressed={kind === option.id}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  kind === option.id
                    ? 'border-cta bg-cta text-cta-ink'
                    : 'border-line-strong bg-surface text-ink-2 hover:border-ink-3 hover:text-ink'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-ink-3">{selected.hint}</p>
        </div>

        <Field label="כותרת">
          <input
            name="title"
            type="text"
            required
            maxLength={120}
            autoFocus
            className="input"
            placeholder={
              kind === 'group_buy'
                ? 'ארגז ירקות מחקלאי — הזמנה משותפת ליום חמישי'
                : 'בייביסיטר בערבים, ימים א׳–ה׳'
            }
          />
        </Field>

        <Field label="פירוט" hint="לא חובה">
          <textarea
            name="description"
            maxLength={2000}
            className="input"
            placeholder="מה בדיוק מוצע, מתי, ולמי זה מתאים"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="מחיר או תנאים" hint="לא חובה">
            <input
              name="price_note"
              type="text"
              maxLength={60}
              className="input"
              placeholder="40 ש״ח לשעה / חינם / לפי חלוקה"
            />
          </Field>

          <Field label="איך ליצור קשר" hint="לא חובה">
            <input
              name="contact"
              type="text"
              maxLength={80}
              className="input"
              placeholder="ווטסאפ 052-0000000, או דלת 7"
            />
          </Field>
        </div>

        <Field label="כמה זמן להשאיר על הלוח">
          <select name="duration_days" required defaultValue={30} className="input">
            {POST_DURATIONS.map((d) => (
              <option key={d.days} value={d.days}>
                {d.label}
              </option>
            ))}
          </select>
        </Field>

        <SubmitButton pendingLabel="מפרסם…" className="btn btn-accent w-full">
          פרסום המודעה
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
