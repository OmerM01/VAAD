'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { toHebrewError } from '@/lib/errors';
import type { ActionState } from '@/lib/actions/state';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Vaad members only. As with faults, the role check here exists to produce a
 * readable message — the budget_insert_vaad RLS policy is what actually stops
 * a dayar, including one calling the REST API directly.
 */
export async function createTransaction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const profile = await requireProfile();

  const type = form.get('type');
  const rawAmount = String(form.get('amount') ?? '').trim();
  const description = String(form.get('description') ?? '').trim();
  const date = String(form.get('date') ?? '').trim();

  if (type !== 'income' && type !== 'expense') {
    return { error: 'צריך לבחור הכנסה או הוצאה.' };
  }

  const amount = Number(rawAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: 'הסכום צריך להיות מספר גדול מאפס.' };
  }
  if (amount > 9_999_999_999) return { error: 'הסכום גדול מדי.' };
  if (Math.round(amount * 100) !== amount * 100) {
    return { error: 'אפשר להזין עד שתי ספרות אחרי הנקודה.' };
  }

  if (description.length < 2) return { error: 'צריך למלא תיאור לתנועה.' };
  if (description.length > 200) return { error: 'התיאור ארוך מדי (עד 200 תווים).' };
  if (!DATE_PATTERN.test(date)) return { error: 'צריך לבחור תאריך תקין.' };

  if (profile.role !== 'vaad') {
    return { error: 'הזנת תנועות בתקציב פתוחה לחברי ועד בלבד.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('budget_transactions').insert({
    building_id: profile.building.id,
    created_by: profile.id,
    type,
    amount,
    description,
    date,
  });

  if (error) return { error: toHebrewError(error) };

  revalidatePath('/budget');
  revalidatePath('/dashboard');
  return { error: null };
}

/**
 * Cancels a mistaken entry by recording its mirror image. Nothing is edited or
 * deleted, so the ledger keeps a full audit trail and the balance still nets
 * out correctly. Vaad only, enforced inside reverse_transaction().
 */
export async function reverseTransaction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireProfile();

  const id = String(form.get('transaction_id') ?? '');
  if (!id) return { error: 'לא זוהתה התנועה.' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('reverse_transaction', {
    p_transaction_id: id,
  });

  if (error) return { error: toHebrewError(error) };

  revalidatePath('/budget');
  revalidatePath('/dashboard');
  return { error: null };
}
