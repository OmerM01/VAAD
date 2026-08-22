'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { toHebrewError } from '@/lib/errors';
import { VOTING_PERIODS, isVoteChoice } from '@/lib/proposals';
import type { ActionState } from '@/lib/actions/state';

/**
 * Any member may raise a proposal. creator_anonymous is stored on the row, but
 * the anonymity itself comes from get_proposals(): created_by is not readable
 * over the API at all, so an anonymous proposal cannot be traced back by
 * joining against public.users.
 */
export async function createProposal(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const profile = await requireProfile();

  const title = String(form.get('title') ?? '').trim();
  const description = String(form.get('description') ?? '').trim();
  const anonymous = form.get('creator_anonymous') === 'on';
  const days = Number(form.get('voting_days'));

  if (title.length < 3) return { error: 'צריך למלא כותרת של לפחות 3 תווים.' };
  if (title.length > 120) return { error: 'הכותרת ארוכה מדי (עד 120 תווים).' };
  if (description.length > 2000) return { error: 'הפירוט ארוך מדי (עד 2000 תווים).' };
  if (!VOTING_PERIODS.some((period) => period.days === days)) {
    return { error: 'צריך לבחור משך הצבעה.' };
  }

  const closesAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('proposals')
    .insert({
      building_id: profile.building.id,
      created_by: profile.id,
      title,
      description: description === '' ? null : description,
      creator_anonymous: anonymous,
      closes_at: closesAt.toISOString(),
    })
    .select('id')
    .single();

  if (error) return { error: toHebrewError(error) };

  revalidatePath('/proposals');
  revalidatePath('/dashboard');
  redirect(`/proposals/${data.id}`);
}

/**
 * One ballot per member. vote_on_proposal() re-checks the building, that the
 * vote is still open, and that no earlier ballot exists. The
 * (proposal_id, user_id) unique constraint backs it up if two requests race.
 */
export async function voteOnProposal(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireProfile();

  const proposalId = String(form.get('proposal_id') ?? '');
  const vote = form.get('vote');
  const anonymous = form.get('voter_anonymous') === 'on';

  if (!proposalId) return { error: 'לא זוהתה ההצעה.' };
  if (!isVoteChoice(vote)) return { error: 'צריך לבחור בעד או נגד.' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('vote_on_proposal', {
    p_proposal_id: proposalId,
    p_vote: vote,
    p_anonymous: anonymous,
  });

  if (error) return { error: toHebrewError(error) };

  revalidatePath('/proposals');
  revalidatePath(`/proposals/${proposalId}`);
  revalidatePath('/dashboard');
  return { error: null };
}

/**
 * Ends the voting before closes_at. Allowed for the member who raised the
 * proposal and for any vaad member; close_proposal() re-checks both.
 */
export async function closeProposal(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireProfile();

  const id = String(form.get('proposal_id') ?? '');
  if (!id) return { error: 'לא זוהתה ההצעה.' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('close_proposal', { p_proposal_id: id });

  if (error) return { error: toHebrewError(error) };

  revalidatePath('/proposals');
  revalidatePath(`/proposals/${id}`);
  revalidatePath('/dashboard');
  return { error: null };
}
