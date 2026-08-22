'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { toHebrewError } from '@/lib/errors';
import { isFaultCategory, isFaultStatus } from '@/lib/faults';
import type { ActionState } from '@/lib/actions/state';

/**
 * Any member of the building may report a fault. building_id and reported_by
 * come from the session rather than the form, and the RLS insert policy
 * re-checks both, so a forged building_id is rejected by Postgres.
 */
export async function createFault(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const profile = await requireProfile();

  const title = String(form.get('title') ?? '').trim();
  const description = String(form.get('description') ?? '').trim();
  const category = form.get('category');

  if (title.length < 3) return { error: 'צריך למלא כותרת של לפחות 3 תווים.' };
  if (title.length > 120) return { error: 'הכותרת ארוכה מדי (עד 120 תווים).' };
  if (!isFaultCategory(category)) return { error: 'צריך לבחור קטגוריה.' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('faults')
    .insert({
      building_id: profile.building.id,
      reported_by: profile.id,
      title,
      description: description === '' ? null : description,
      category,
    })
    .select('id')
    .single();

  if (error) return { error: toHebrewError(error) };

  revalidatePath('/faults');
  revalidatePath('/dashboard');
  redirect(`/faults/${data.id}`);
}

/**
 * Vaad members only. The check below produces the error message; enforcement is
 * the faults_update_vaad RLS policy, which a dayar cannot pass even by calling
 * the REST API directly.
 */
export async function updateFaultStatus(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const profile = await requireProfile();

  const id = String(form.get('fault_id') ?? '');
  const status = form.get('status');

  if (!id) return { error: 'לא זוהתה התקלה.' };
  if (!isFaultStatus(status)) return { error: 'סטטוס לא חוקי.' };
  if (profile.role !== 'vaad') {
    return { error: 'עדכון סטטוס תקלה פתוח לחברי ועד בלבד.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('faults')
    .update({ status })
    .eq('id', id)
    .select('id');

  if (error) return { error: toHebrewError(error) };
  if (!data || data.length === 0) {
    return { error: 'העדכון נחסם — אין לך הרשאה לשנות את התקלה הזו.' };
  }

  revalidatePath('/faults');
  revalidatePath(`/faults/${id}`);
  revalidatePath('/dashboard');
  return { error: null };
}
