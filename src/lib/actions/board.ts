'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { toHebrewError } from '@/lib/errors';
import { POST_DURATIONS, isPostKind } from '@/lib/board';
import { done, type ActionState } from '@/lib/actions/state';

/** Any member of the building may put a notice up. */
export async function createPost(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const profile = await requireProfile();

  const kind = form.get('kind');
  const title = String(form.get('title') ?? '').trim();
  const description = String(form.get('description') ?? '').trim();
  const priceNote = String(form.get('price_note') ?? '').trim();
  const contact = String(form.get('contact') ?? '').trim();
  const days = Number(form.get('duration_days'));

  if (!isPostKind(kind)) return { error: 'צריך לבחור סוג מודעה.' };
  if (title.length < 3) return { error: 'צריך למלא כותרת של לפחות 3 תווים.' };
  if (title.length > 120) return { error: 'הכותרת ארוכה מדי (עד 120 תווים).' };
  if (description.length > 2000) return { error: 'התיאור ארוך מדי.' };
  if (priceNote.length > 60) return { error: 'שורת המחיר ארוכה מדי (עד 60 תווים).' };
  if (contact.length > 80) return { error: 'פרטי הקשר ארוכים מדי (עד 80 תווים).' };
  if (!POST_DURATIONS.some((d) => d.days === days)) {
    return { error: 'צריך לבחור לכמה זמן המודעה תישאר על הלוח.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('neighbour_posts').insert({
    building_id: profile.building.id,
    created_by: profile.id,
    kind,
    title,
    description: description === '' ? null : description,
    price_note: priceNote === '' ? null : priceNote,
    contact: contact === '' ? null : contact,
    expires_at: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
  });

  if (error) return { error: toHebrewError(error) };

  revalidatePath('/board');
  revalidatePath('/dashboard');
  return done(_prev, 'המודעה פורסמה בלוח');
}

/**
 * Takes a notice down. The author may remove their own; a vaad member may
 * remove any of them, which is what keeps the board moderatable. Both checks
 * live in the RLS policy as well.
 */
export async function closePost(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireProfile();

  const id = String(form.get('post_id') ?? '');
  if (!id) return { error: 'לא זוהתה המודעה.' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('neighbour_posts')
    .update({ status: 'closed' })
    .eq('id', id)
    .select('id');

  if (error) return { error: toHebrewError(error) };
  if (!data || data.length === 0) {
    return { error: 'אפשר להסיר רק מודעה שפרסמת, או להיות חבר ועד.' };
  }

  revalidatePath('/board');
  revalidatePath('/dashboard');
  return done(_prev, 'המודעה הוסרה מהלוח');
}

/** Puts your hand up, or takes it back down. */
export async function toggleInterest(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const profile = await requireProfile();

  const id = String(form.get('post_id') ?? '');
  const interested = form.get('interested') === 'yes';
  if (!id) return { error: 'לא זוהתה המודעה.' };

  const supabase = await createClient();

  if (interested) {
    const { error } = await supabase
      .from('post_interests')
      .delete()
      .eq('post_id', id)
      .eq('user_id', profile.id);
    if (error) return { error: toHebrewError(error) };
    revalidatePath('/board');
    return done(_prev, 'ההרשמה בוטלה');
  }

  const { error } = await supabase
    .from('post_interests')
    .insert({ post_id: id, user_id: profile.id });

  if (error) return { error: toHebrewError(error) };

  revalidatePath('/board');
  revalidatePath('/dashboard');
  return done(_prev, 'נרשמת למודעה');
}
