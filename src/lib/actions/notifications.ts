'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';

/** Moves the "new since" watermark to now. Called when the bell is opened. */
export async function markNotificationsSeen(): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc('mark_notifications_seen');
  revalidatePath('/', 'layout');
}
