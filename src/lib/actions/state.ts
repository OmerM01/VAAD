/**
 * Shared shape for every useActionState form. Kept outside the "use server"
 * modules, which may only export async functions.
 */
export type ActionState = { error: string | null };

export const IDLE: ActionState = { error: null };

/** Password-reset forms also need to remember that the mail went out. */
export type ResetState = { error: string | null; sent: boolean };

export const RESET_IDLE: ResetState = { error: null, sent: false };
