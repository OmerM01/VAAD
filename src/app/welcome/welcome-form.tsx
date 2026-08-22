'use client';

import { useActionState, useState } from 'react';

import { completeCreateBuilding, completeJoin } from '@/lib/actions/auth';
import { IDLE } from '@/lib/actions/state';
import { Field, FormError, SubmitButton } from '@/components/ui/form';

type Mode = 'join' | 'create';

export function WelcomeForm() {
  const [mode, setMode] = useState<Mode>('join');

  return (
    <div>
      <div className="flex gap-2">
        {(
          [
            ['join', 'יש לי קוד הצטרפות'],
            ['create', 'פתיחת בניין חדש'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={`btn btn-sm flex-1 ${
              mode === id ? 'btn-primary' : 'btn-ghost'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5">{mode === 'join' ? <JoinForm /> : <CreateForm />}</div>
    </div>
  );
}

function NameFields() {
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
      <Field label="שם מלא">
        <input
          name="full_name"
          type="text"
          autoComplete="name"
          required
          className="input"
          placeholder="ישראל ישראלי"
        />
      </Field>
      <Field label="מספר דירה" hint="לא חובה">
        <input
          name="apartment_number"
          type="text"
          maxLength={10}
          className="input"
          placeholder="12"
        />
      </Field>
    </div>
  );
}

function JoinForm() {
  const [state, action] = useActionState(completeJoin, IDLE);

  return (
    <form action={action} className="animate-slide-in space-y-4">
      <FormError message={state.error} />

      <Field label="קוד הצטרפות" hint="8 תווים">
        <input
          name="invite_code"
          type="text"
          dir="ltr"
          required
          maxLength={8}
          spellCheck={false}
          className="input code-chip text-center uppercase"
          placeholder="ABCD2345"
          onInput={(e) => {
            e.currentTarget.value = e.currentTarget.value.toUpperCase();
          }}
        />
      </Field>

      <NameFields />
      <SubmitButton pendingLabel="מצטרף…">הצטרפות לבניין</SubmitButton>
    </form>
  );
}

function CreateForm() {
  const [state, action] = useActionState(completeCreateBuilding, IDLE);

  return (
    <form action={action} className="animate-slide-in space-y-4">
      <FormError message={state.error} />

      <Field label="שם הבניין">
        <input name="building_name" type="text" required className="input" placeholder="הרצל 15" />
      </Field>
      <Field label="כתובת מלאה" hint="לא חובה">
        <input name="address" type="text" className="input" placeholder="הרצל 15, תל אביב" />
      </Field>

      <NameFields />
      <SubmitButton pendingLabel="יוצר בניין…">יצירת הבניין</SubmitButton>
    </form>
  );
}
