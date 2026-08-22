'use client';

import { useActionState, useEffect, useRef, useState } from 'react';

import { createTransaction } from '@/lib/actions/budget';
import { IDLE } from '@/lib/actions/state';
import { Field, FormError, SubmitButton } from '@/components/ui/form';
import type { TransactionType } from '@/lib/database.types';

export function AddTransaction({ today }: { today: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [state, action] = useActionState(createTransaction, IDLE);
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef(false);

  // Success returns { error: null } instead of redirecting, so clear the form
  // and leave it open. Transactions are usually entered several at a time.
  useEffect(() => {
    if (submitted.current && state.error === null) {
      formRef.current?.reset();
      submitted.current = false;
    }
  }, [state]);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-primary">
        <PlusIcon />
        הזנת תנועה
      </button>
    );
  }

  return (
    <section className="card animate-rise w-full p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-brand-900">
            תנועה חדשה בתקציב
          </h2>
          <p className="mt-0.5 text-sm text-ink-2">
            כל תנועה גלויה מיד לכל דיירי הבניין.
          </p>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">
          סגירה
        </button>
      </div>

      <form
        ref={formRef}
        action={action}
        onSubmit={() => {
          submitted.current = true;
        }}
        className="mt-5 space-y-4"
      >
        <FormError message={state.error} />

        <input type="hidden" name="type" value={type} />
        <div>
          <p className="field-label">סוג התנועה</p>
          <div className="grid grid-cols-2 gap-2">
            <TypeButton
              active={type === 'income'}
              onClick={() => setType('income')}
              tone="ok"
              label="הכנסה"
              hint="דמי ועד, החזר, פיקדון"
            />
            <TypeButton
              active={type === 'expense'}
              onClick={() => setType('expense')}
              tone="danger"
              label="הוצאה"
              hint="תיקון, ניקיון, חשמל"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
          <Field label="סכום" hint="בשקלים">
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              inputMode="decimal"
              className="input num"
              placeholder="450.00"
            />
          </Field>

          <Field label="תאריך">
            <input
              name="date"
              type="date"
              required
              defaultValue={today}
              max={today}
              className="input num"
            />
          </Field>
        </div>

        <Field label="תיאור">
          <input
            name="description"
            type="text"
            required
            maxLength={200}
            className="input"
            placeholder={type === 'income' ? 'דמי ועד — אוגוסט' : 'תיקון משאבת מים'}
          />
        </Field>

        <SubmitButton
          pendingLabel="שומר…"
          className={`btn w-full ${type === 'income' ? 'btn-primary' : 'btn-accent'}`}
        >
          {type === 'income' ? 'רישום הכנסה' : 'רישום הוצאה'}
        </SubmitButton>
      </form>
    </section>
  );
}

function TypeButton({
  active,
  onClick,
  tone,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  tone: 'ok' | 'danger';
  label: string;
  hint: string;
}) {
  const activeStyles =
    tone === 'ok'
      ? 'border-ok-500 bg-ok-50 text-ok-600'
      : 'border-danger-500 bg-danger-50 text-danger-600';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg border px-3 py-2.5 text-right transition-all duration-200 ${
        active
          ? `${activeStyles} shadow-sm`
          : 'border-line-strong bg-surface text-ink-3 hover:border-ink-3 hover:text-ink-2'
      }`}
    >
      <span className="block text-sm font-bold">{label}</span>
      <span className="mt-0.5 block text-[0.6875rem]">{hint}</span>
    </button>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M10 4.5v11M4.5 10h11" />
    </svg>
  );
}
