/**
 * Shared shape for every `useActionState` form in the app.
 * Lives outside the "use server" modules, which may only export async functions.
 */
export type ActionState = { error: string | null };

export const IDLE: ActionState = { error: null };
