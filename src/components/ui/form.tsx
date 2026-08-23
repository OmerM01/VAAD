'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';

export function SubmitButton({
  children,
  pendingLabel,
  className = 'btn btn-primary w-full',
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={className} disabled={pending}>
      {pending && <Spinner />}
      {pending ? (pendingLabel ?? 'רגע…') : children}
    </button>
  );
}

export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="form-error animate-fade" role="alert">
      <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm.75 4.5a.75.75 0 0 0-1.5 0v4a.75.75 0 0 0 1.5 0v-4ZM10 13a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Z"
          clipRule="evenodd"
        />
      </svg>
      <span>{message}</span>
    </p>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="field-label">
        {label}
        {hint && <span className="mr-1.5 font-normal text-ink-3">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

/**
 * Keeps typed values across a failed submission.
 *
 * React resets an uncontrolled form once its action completes, which is right
 * after a success but wrong after an error: the resident retypes everything to
 * fix one field. Binding the fields worth keeping to state survives the reset.
 */
export function useStickyFields(initial: Record<string, string> = {}) {
  const [values, setValues] = useState<Record<string, string>>(initial);

  function field(name: string) {
    return {
      name,
      value: values[name] ?? '',
      onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
        setValues((current) => ({ ...current, [name]: event.target.value })),
    };
  }

  return { values, field };
}
