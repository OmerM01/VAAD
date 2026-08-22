'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { toHebrewError } from '@/lib/errors';

import type { ActionState, ResetState } from '@/lib/actions/state';

const MIN_PASSWORD = 8;

function text(form: FormData, key: string): string {
  return String(form.get(key) ?? '').trim();
}

function optionalText(form: FormData, key: string): string | null {
  const value = text(form, key);
  return value === '' ? null : value;
}

function validateAccount(email: string, password: string, fullName: string) {
  if (!email || !email.includes('@')) return 'צריך למלא כתובת אימייל תקינה.';
  if (password.length < MIN_PASSWORD)
    return `הסיסמה צריכה להכיל לפחות ${MIN_PASSWORD} תווים.`;
  if (fullName.length < 2) return 'צריך למלא שם מלא.';
  return null;
}

// -----------------------------------------------------------------------------
//  Sign in / out
// -----------------------------------------------------------------------------

export async function signIn(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const email = text(form, 'email');
  const password = String(form.get('password') ?? '');

  if (!email || !password) return { error: 'צריך למלא אימייל וסיסמה.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: toHebrewError(error) };

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

// -----------------------------------------------------------------------------
//  Sign up
//
//  Both flows create the Auth account first, then attach it to a building.
//  If the second half fails — almost always a mistyped invite code — the account
//  stays signed in without a profile and /welcome picks the flow back up, so a
//  typo never costs the resident their email address.
// -----------------------------------------------------------------------------

export async function signUpAndJoin(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const email = text(form, 'email');
  const password = String(form.get('password') ?? '');
  const fullName = text(form, 'full_name');
  const apartment = optionalText(form, 'apartment_number');
  const code = text(form, 'invite_code').toUpperCase();

  const invalid = validateAccount(email, password, fullName);
  if (invalid) return { error: invalid };
  if (code.length < 4) return { error: 'צריך למלא את קוד ההצטרפות של הבניין.' };

  const supabase = await createClient();

  const { data: signUp, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });
  if (signUpError) return { error: toHebrewError(signUpError) };
  if (!signUp.session) {
    return {
      error:
        'החשבון נוצר אך לא התקבל session. יש לכבות את Confirm email בהגדרות Supabase.',
    };
  }

  const { error: joinError } = await supabase.rpc('join_building', {
    p_invite_code: code,
    p_full_name: fullName,
    p_apartment_number: apartment,
  });

  if (joinError) return { error: toHebrewError(joinError) };

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signUpAndCreateBuilding(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const email = text(form, 'email');
  const password = String(form.get('password') ?? '');
  const fullName = text(form, 'full_name');
  const apartment = optionalText(form, 'apartment_number');
  const buildingName = text(form, 'building_name');
  const address = optionalText(form, 'address');

  const invalid = validateAccount(email, password, fullName);
  if (invalid) return { error: invalid };
  if (buildingName.length < 2) return { error: 'צריך למלא שם לבניין.' };

  const supabase = await createClient();

  const { data: signUp, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });
  if (signUpError) return { error: toHebrewError(signUpError) };
  if (!signUp.session) {
    return {
      error:
        'החשבון נוצר אך לא התקבל session. יש לכבות את Confirm email בהגדרות Supabase.',
    };
  }

  const { error: createError } = await supabase.rpc('create_building', {
    p_name: buildingName,
    p_address: address,
    p_full_name: fullName,
    p_apartment_number: apartment,
  });

  if (createError) return { error: toHebrewError(createError) };

  revalidatePath('/', 'layout');
  redirect('/dashboard?created=1');
}

// -----------------------------------------------------------------------------
//  Recovery: signed in, but never attached to a building
// -----------------------------------------------------------------------------

export async function completeJoin(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const fullName = text(form, 'full_name');
  const apartment = optionalText(form, 'apartment_number');
  const code = text(form, 'invite_code').toUpperCase();

  if (fullName.length < 2) return { error: 'צריך למלא שם מלא.' };
  if (code.length < 4) return { error: 'צריך למלא את קוד ההצטרפות של הבניין.' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('join_building', {
    p_invite_code: code,
    p_full_name: fullName,
    p_apartment_number: apartment,
  });

  if (error) return { error: toHebrewError(error) };

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function completeCreateBuilding(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const fullName = text(form, 'full_name');
  const apartment = optionalText(form, 'apartment_number');
  const buildingName = text(form, 'building_name');
  const address = optionalText(form, 'address');

  if (fullName.length < 2) return { error: 'צריך למלא שם מלא.' };
  if (buildingName.length < 2) return { error: 'צריך למלא שם לבניין.' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('create_building', {
    p_name: buildingName,
    p_address: address,
    p_full_name: fullName,
    p_apartment_number: apartment,
  });

  if (error) return { error: toHebrewError(error) };

  revalidatePath('/', 'layout');
  redirect('/dashboard?created=1');
}

// -----------------------------------------------------------------------------
//  Password reset
// -----------------------------------------------------------------------------

/** The origin this request arrived on, so the same code works locally and on Vercel. */
async function requestOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host');
  const proto = headerList.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}`;
}

/**
 * Always reports success, whether or not the address is registered — otherwise
 * this form doubles as a way to discover who lives in the building.
 */
export async function requestPasswordReset(
  _prev: ResetState,
  form: FormData,
): Promise<ResetState> {
  const email = text(form, 'email');
  if (!email || !email.includes('@')) {
    return { error: 'צריך למלא כתובת אימייל תקינה.', sent: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await requestOrigin()}/auth/reset`,
  });

  // A rate limit is worth reporting; anything else stays quiet on purpose.
  if (error && /rate|limit|seconds/i.test(error.message)) {
    return {
      error: 'נשלחו יותר מדי בקשות. נסה שוב בעוד כמה דקות.',
      sent: false,
    };
  }

  return { error: null, sent: true };
}

export async function updatePassword(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const password = String(form.get('password') ?? '');
  const confirmation = String(form.get('password_confirm') ?? '');

  if (password.length < MIN_PASSWORD) {
    return { error: `הסיסמה צריכה להכיל לפחות ${MIN_PASSWORD} תווים.` };
  }
  if (password !== confirmation) return { error: 'שתי הסיסמאות אינן זהות.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: 'הקישור לאיפוס פג או כבר נוצל. בקש קישור חדש ונסה שוב.',
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: toHebrewError(error) };

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
