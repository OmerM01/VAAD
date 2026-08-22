import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { InviteCodesCard } from '@/components/invite-codes';
import type { InviteCodes } from '@/lib/database.types';

export const metadata = { title: 'סקירה' };

export default async function DashboardPage({
  searchParams,
}: PageProps<'/dashboard'>) {
  const profile = await requireProfile();
  const { created } = await searchParams;
  const justCreated = created === '1';

  const supabase = await createClient();

  // Only vaad members are allowed through get_invite_codes(); for a dayar the
  // RPC raises FORBIDDEN and we simply render nothing.
  let codes: InviteCodes | null = null;
  if (profile.role === 'vaad') {
    const { data } = await supabase.rpc('get_invite_codes');
    codes = data?.[0] ?? null;
  }

  const { data: members } = await supabase
    .from('users')
    .select('id, full_name, apartment_number, role')
    .order('role', { ascending: false })
    .order('full_name');

  return (
    <div className="space-y-6">
      {justCreated && (
        <div className="animate-rise flex items-start gap-3 rounded-xl border border-ok-100 bg-ok-50 p-4 text-ok-600">
          <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm3.7 6.2a.75.75 0 0 0-1.15-.96l-3.4 4.07-1.7-1.7a.75.75 0 1 0-1.06 1.06l2.28 2.28a.75.75 0 0 0 1.1-.05l3.93-4.7Z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="font-display text-base font-bold">
              הבניין &quot;{profile.building.name}&quot; נוצר בהצלחה
            </p>
            <p className="mt-0.5 text-sm">
              הוגדרת כחבר ועד. שני קודי ההצטרפות מחכים לך למטה — אפשר להעביר
              אותם לדיירים כבר עכשיו.
            </p>
          </div>
        </div>
      )}

      <div className="animate-rise">
        <span className="eyebrow">שלום, {profile.fullName.split(' ')[0]}</span>
        <h1 className="mt-1 font-display text-3xl font-bold text-brand-900">
          {profile.building.name}
        </h1>
        <p className="mt-1.5 text-sm text-ink-2">
          {profile.role === 'vaad'
            ? 'אתה חבר ועד — אפשר לעדכן סטטוס תקלות ולהזין תנועות בתקציב.'
            : 'אתה רשום כדייר בבניין.'}
        </p>
      </div>

      {codes && <InviteCodesCard codes={codes} />}

      <section className="card animate-rise p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-brand-900">
            דיירי הבניין
          </h2>
          <span className="num text-sm text-ink-3">
            {members?.length ?? 0} רשומים
          </span>
        </div>

        <ul className="mt-4 divide-y divide-line">
          {members?.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between gap-3 py-2.5"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">
                  {member.full_name}
                  {member.id === profile.id && (
                    <span className="mr-1.5 text-xs font-normal text-ink-3">
                      (אתה)
                    </span>
                  )}
                </span>
                {member.apartment_number && (
                  <span className="num block text-xs text-ink-3">
                    דירה {member.apartment_number}
                  </span>
                )}
              </span>
              <span
                className={`badge ${
                  member.role === 'vaad' ? 'badge-brand' : 'badge-neutral'
                }`}
              >
                {member.role === 'vaad' ? 'חבר ועד' : 'דייר'}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card-quiet animate-rise p-6">
        <span className="eyebrow">בקרוב</span>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          מודולי התקלות, התקציב וההצעות ייבנו בשלבים הבאים. השיוך לבניין ולתפקיד
          כבר פעיל — כל מה שייבנה מכאן והלאה יראה רק את הנתונים של הבניין הזה.
        </p>
      </section>
    </div>
  );
}
