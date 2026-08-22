import { cache } from 'react';

import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/database.types';

export type Member = {
  id: string;
  full_name: string;
  apartment_number: string | null;
  role: UserRole;
};

/**
 * Everyone in the caller's building, keyed by id. RLS already scopes this to
 * one building, and a building holds at most tens of residents, so this is
 * cheaper and clearer than embedding a join in every query.
 */
export const getMembers = cache(async (): Promise<Map<string, Member>> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('users')
    .select('id, full_name, apartment_number, role');

  return new Map((data ?? []).map((member) => [member.id, member]));
});

export function memberLabel(member: Member | undefined): string {
  if (!member) return 'דייר לא מזוהה';
  return member.apartment_number
    ? `${member.full_name} · דירה ${member.apartment_number}`
    : member.full_name;
}
