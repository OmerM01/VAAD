/**
 * Shared shape for every useActionState form. Kept outside the "use server"
 * modules, which may only export async functions.
 */
export type ActionState = {
  error: string | null;
  /**
   * Bumped by one on every successful run. Actions that stay on the page use it
   * to fire a toast: a counter works where a message alone would not, because
   * running the same action twice produces an identical message and React would
   * see no change.
   */
  ok?: number;
  message?: string;
};

export const IDLE: ActionState = { error: null };

/** Success result for an action that stays on the page. */
export function done(prev: ActionState, message: string): ActionState {
  return { error: null, ok: (prev.ok ?? 0) + 1, message };
}

/** Password-reset forms also need to remember that the mail went out. */
export type ResetState = { error: string | null; sent: boolean };

export const RESET_IDLE: ResetState = { error: null, sent: false };
