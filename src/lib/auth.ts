import { cache } from 'react';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/database.types';

export type Profile = {
  id: string;
  email: string;
  fullName: string;
  apartmentNumber: string | null;
  role: UserRole;
  building: {
    id: string;
    name: string;
    address: string | null;
  };
};

/**
 * The signed-in member together with their building.
 * Returns null when nobody is signed in, and 'no-profile' when the account
 * exists in Auth but was never attached to a building — which happens if the
 * join step failed midway through signup. That case is recoverable at /welcome.
 */
export const getProfile = cache(
  async (): Promise<Profile | null | 'no-profile'> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: row } = await supabase
      .from('users')
      .select('id, building_id, full_name, apartment_number, role')
      .eq('id', user.id)
      .maybeSingle();

    if (!row) return 'no-profile';

    const { data: building } = await supabase
      .from('buildings')
      .select('id, name, address')
      .eq('id', row.building_id)
      .maybeSingle();

    if (!building) return 'no-profile';

    return {
      id: row.id,
      email: user.email ?? '',
      fullName: row.full_name,
      apartmentNumber: row.apartment_number,
      role: row.role,
      building,
    };
  },
);

/** Use in any page behind the app shell: guarantees a fully onboarded member. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (profile === null) redirect('/login');
  if (profile === 'no-profile') redirect('/welcome');
  return profile;
}
