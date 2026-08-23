'use client';

import { useActionState, useState } from 'react';

import { signUpAndCreateBuilding, signUpAndJoin } from '@/lib/actions/auth';
import { IDLE } from '@/lib/actions/state';
import {
  Field,
  FormError,
  SubmitButton,
  useStickyFields,
} from '@/components/ui/form';

type Mode = 'join' | 'create';
type FieldFn = ReturnType<typeof useStickyFields>['field'];

const TABS: { id: Mode; label: string; caption: string }[] = [
  { id: 'join', label: 'יש לי קוד', caption: 'הצטרפות לבניין קיים' },
  { id: 'create', label: 'פותח בניין חדש', caption: 'יצירת בניין ושני קודים' },
];

export function SignupForm({ initialMode = 'join' }: { initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);

  // Held here rather than in each sub-form, so the details survive both a
  // failed submission and a switch between the two tabs.
  const { field } = useStickyFields();

  return (
    <div>
      <div
        role="tablist"
        aria-label="סוג הרשמה"
        className="relative grid grid-cols-2 gap-1 rounded-xl border border-line bg-paper-deep/50 p-1"
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-lg bg-surface shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            right: '0.25rem',
            transform: mode === 'join' ? 'translateX(0)' : 'translateX(-100%)',
          }}
        />
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={mode === tab.id}
            onClick={() => setMode(tab.id)}
            className={`relative z-10 rounded-lg px-3 py-2 text-center transition-colors duration-200 ${
              mode === tab.id ? 'text-heading' : 'text-ink-3 hover:text-ink-2'
            }`}
          >
            <span className="block text-sm font-semibold">{tab.label}</span>
            <span className="mt-0.5 block text-[0.6875rem]">{tab.caption}</span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        {mode === 'join' ? <JoinForm field={field} /> : <CreateForm field={field} />}
      </div>
    </div>
  );
}

/** Account fields, identical in both signup flows. */
function AccountFields({ field }: { field: FieldFn }) {
  return (
    <>
      <Field label="אימייל">
        <input
          {...field('email')}
          type="email"
          dir="ltr"
          autoComplete="email"
          required
          className="input text-left"
          placeholder="you@example.com"
        />
      </Field>

      <Field label="סיסמה" hint="לפחות 8 תווים">
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="input"
          placeholder="••••••••"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <Field label="שם מלא">
          <input
            {...field('full_name')}
            type="text"
            autoComplete="name"
            required
            className="input"
            placeholder="ישראל ישראלי"
          />
        </Field>

        <Field label="מספר דירה" hint="לא חובה">
          <input
            {...field('apartment_number')}
            type="text"
            maxLength={10}
            className="input"
            placeholder="12"
          />
        </Field>
      </div>
    </>
  );
}

function JoinForm({ field }: { field: FieldFn }) {
  const [state, action] = useActionState(signUpAndJoin, IDLE);
  const code = field('invite_code');

  return (
    <form action={action} className="animate-slide-in space-y-4">
      <FormError message={state.error} />

      <Field label="קוד הצטרפות" hint="8 תווים, מהוועד של הבניין">
        <input
          {...code}
          onChange={(event) => {
            event.target.value = event.target.value.toUpperCase();
            code.onChange(event);
          }}
          type="text"
          dir="ltr"
          required
          maxLength={8}
          autoCapitalize="characters"
          spellCheck={false}
          className="input code-chip text-center uppercase"
          placeholder="ABCD2345"
        />
      </Field>

      <p className="rounded-lg border border-brand-100 bg-brand-50 px-3.5 py-2.5 text-[0.8125rem] leading-relaxed text-brand-700">
        הקוד הוא שקובע לאיזה בניין תשויך ובאיזה תפקיד — דייר או חבר ועד. אין
        צורך לבחור כלום ידנית.
      </p>

      <AccountFields field={field} />

      <SubmitButton pendingLabel="מצטרף…">הצטרפות לבניין</SubmitButton>
    </form>
  );
}

function CreateForm({ field }: { field: FieldFn }) {
  const [state, action] = useActionState(signUpAndCreateBuilding, IDLE);

  return (
    <form action={action} className="animate-slide-in space-y-4">
      <FormError message={state.error} />

      <Field label="שם הבניין">
        <input
          {...field('building_name')}
          type="text"
          required
          className="input"
          placeholder="הרצל 15"
        />
      </Field>

      <Field label="כתובת מלאה" hint="לא חובה">
        <input
          {...field('address')}
          type="text"
          className="input"
          placeholder="הרצל 15, תל אביב"
        />
      </Field>

      <p className="rounded-lg border border-clay-100 bg-clay-50 px-3.5 py-2.5 text-[0.8125rem] leading-relaxed text-clay-600">
        בסיום תקבל שני קודי הצטרפות — אחד לדיירים ואחד לחברי ועד. אתה תוגדר
        אוטומטית כחבר ועד של הבניין.
      </p>

      <AccountFields field={field} />

      <SubmitButton pendingLabel="יוצר בניין…">יצירת הבניין</SubmitButton>
    </form>
  );
}
