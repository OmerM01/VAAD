'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import type { ActionState } from '@/lib/actions/state';

type Tone = 'ok' | 'error';
type Toast = { id: number; text: string; tone: Tone; leaving?: boolean };

const ToastContext = createContext<(text: string, tone?: Tone) => void>(() => {});

const LIFETIME = 3800;
const EXIT = 220;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const push = useCallback((text: string, tone: Tone = 'ok') => {
    const id = nextId.current++;
    setToasts((current) => [...current.slice(-2), { id, text, tone }]);

    timers.current.push(
      setTimeout(() => {
        setToasts((current) =>
          current.map((t) => (t.id === id ? { ...t, leaving: true } : t)),
        );
        timers.current.push(
          setTimeout(
            () => setToasts((current) => current.filter((t) => t.id !== id)),
            EXIT,
          ),
        );
      }, LIFETIME),
    );
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex flex-col items-center gap-2 px-4"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex max-w-md items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-[var(--shadow-lift)] ${
              toast.tone === 'ok'
                ? 'border-ok-100 bg-ok-50 text-ok-600'
                : 'border-danger-100 bg-danger-50 text-danger-600'
            }`}
            style={{
              animation: `${toast.leaving ? 'toast-out' : 'toast-in'} ${
                toast.leaving ? EXIT : 260
              }ms cubic-bezier(0.16,1,0.3,1) both`,
            }}
          >
            {toast.tone === 'ok' ? <CheckIcon /> : <AlertIcon />}
            {toast.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

/**
 * Fires a toast each time an action reports success. Watches the counter rather
 * than the message, so repeating the same action still notifies.
 */
export function useActionToast(state: ActionState) {
  const toast = useToast();
  const lastSeen = useRef(0);

  useEffect(() => {
    const ok = state.ok ?? 0;
    if (ok > lastSeen.current) {
      lastSeen.current = ok;
      if (state.message) toast(state.message);
    }
  }, [state, toast]);
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm3.7 6.2a.75.75 0 0 0-1.15-.96l-3.4 4.07-1.7-1.7a.75.75 0 1 0-1.06 1.06l2.28 2.28a.75.75 0 0 0 1.1-.05l3.93-4.7Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm.75 4.5a.75.75 0 0 0-1.5 0v4a.75.75 0 0 0 1.5 0v-4ZM10 13a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
