import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/app-shell';
import type { AppNotification } from '@/lib/database.types';

export default async function AppLayout({ children }: LayoutProps<'/'>) {
  const profile = await requireProfile();

  const supabase = await createClient();
  const { data } = await supabase.rpc('get_notifications', { p_limit: 25 });

  return (
    <AppShell profile={profile} notifications={(data ?? []) as AppNotification[]}>
      {children}
    </AppShell>
  );
}
