import Link from 'next/link';
import type { Route } from 'next';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getMembers, memberLabel } from '@/lib/members';
import { formatDay, formatMoney, greeting, relativeTime } from '@/lib/format';
import { CATEGORY_LABEL, STATUS_BADGE, STATUS_LABEL } from '@/lib/faults';
import { VoteBar } from '@/components/vote-bar';
import { Counter } from '@/components/counter';
import { Author } from '@/components/author';
import { InviteCodesCard } from '@/components/invite-codes';
import type {
  BudgetSummary,
  BudgetTransaction,
  Fault,
  InviteCodes,
  ProposalView,
} from '@/lib/database.types';

export const metadata = { title: 'סקירה' };

export default async function DashboardPage({
  searchParams,
}: PageProps<'/dashboard'>) {
  const profile = await requireProfile();
  const { created } = await searchParams;
  const isVaad = profile.role === 'vaad';

  const supabase = await createClient();

  const [
    { data: faults },
    { data: summaryRows },
    { data: transactions },
    { data: proposalRows },
    members,
  ] = await Promise.all([
    supabase
      .from('faults')
      .select('*')
      .order('created_at', { ascending: false })
      .returns<Fault[]>(),
    supabase.rpc('get_building_budget_summary'),
    supabase
      .from('budget_transactions')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5)
      .returns<BudgetTransaction[]>(),
    supabase.rpc('get_proposals', { p_id: null }),
    getMembers(),
  ]);

  // Vaad only. The RPC raises FORBIDDEN for a dayar, so skip the call.
  let codes: InviteCodes | null = null;
  if (isVaad) {
    const { data } = await supabase.rpc('get_invite_codes');
    codes = data?.[0] ?? null;
  }

  const allFaults = faults ?? [];
  const openFaults = allFaults.filter((f) => f.status === 'open');
  const inProgress = allFaults.filter((f) => f.status === 'in_progress');
  const needsAttention = [...openFaults, ...inProgress].slice(0, 4);

  const budget = (summaryRows?.[0] ?? {}) as Partial<BudgetSummary>;
  const balance = Number(budget.balance ?? 0);

  const proposals = (proposalRows ?? []) as ProposalView[];
  const liveProposals = proposals.filter((p) => p.status === 'open');
  const awaitingMyVote = liveProposals.filter((p) => !p.my_vote);

  return (
    <div className="space-y-6">
      {created === '1' && <BuildingCreated name={profile.building.name} />}

      <header className="animate-rise">
        <span className="eyebrow">
          {greeting()}, {profile.fullName.split(' ')[0]}
        </span>
        <h1 className="mt-1 font-display text-3xl font-bold text-heading">
          {profile.building.name}
        </h1>
        <p className="mt-1.5 text-sm text-ink-2">
          {isVaad
            ? 'אתה חבר ועד — אפשר לעדכן סטטוס תקלות ולהזין תנועות בתקציב.'
            : 'אתה רשום כדייר בבניין.'}
        </p>
      </header>

      {/* headline figures */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          href="/faults"
          accent="clay"
          label="תקלות שממתינות"
          value={<Counter value={openFaults.length + inProgress.length} />}
          caption={
            inProgress.length > 0
              ? `${openFaults.length} פתוחות · ${inProgress.length} בטיפול`
              : `מתוך ${allFaults.length} דיווחים בסך הכל`
          }
          delay={0}
        />
        <StatTile
          href="/budget"
          accent={balance >= 0 ? 'brand' : 'danger'}
          label="יתרת התקציב"
          value={<Counter value={balance} format="money" />}
          caption={`מחושב מ-${budget.tx_count ?? 0} תנועות`}
          delay={70}
        />
        <StatTile
          href="/proposals"
          accent="ok"
          label="הצעות בהצבעה"
          value={<Counter value={liveProposals.length} />}
          caption={
            awaitingMyVote.length > 0
              ? `${awaitingMyVote.length} ממתינות להצבעה שלך`
              : 'הצבעת על כל ההצעות הפעילות'
          }
          delay={140}
        />
      </div>

      {awaitingMyVote.length > 0 && (
        <section className="animate-rise">
          <SectionHead
            title="ממתינות להצבעה שלך"
            href="/proposals?status=open"
            linkLabel="לכל ההצעות"
          />
          <ul className="grid gap-4 sm:grid-cols-2">
            {awaitingMyVote.slice(0, 2).map((proposal) => (
              <li key={proposal.id}>
                <Link
                  href={`/proposals/${proposal.id}`}
                  className="card group block h-full border-r-4 border-r-ok-500 p-5 transition-shadow duration-200 hover:shadow-[var(--shadow-lift)]"
                >
                  <h3 className="font-display text-base leading-snug font-bold text-heading transition-colors group-hover:text-brand-600">
                    {proposal.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-ink-3">
                    <Author name={proposal.creator_name} isMine={proposal.is_mine} />
                    {proposal.closes_at && ` · נסגר ${relativeTime(proposal.closes_at)}`}
                  </p>
                  <div className="mt-4">
                    <VoteBar
                      votesFor={proposal.votes_for}
                      votesAgainst={proposal.votes_against}
                      size="sm"
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* faults needing attention */}
        <section className="animate-rise">
          <SectionHead title="תקלות שדורשות טיפול" href="/faults" linkLabel="לכל התקלות" />
          {needsAttention.length === 0 ? (
            <QuietCard text="אין כרגע תקלות פתוחות בבניין." />
          ) : (
            <ul className="card divide-y divide-line overflow-hidden">
              {needsAttention.map((fault) => (
                <li key={fault.id}>
                  <Link
                    href={`/faults/${fault.id}`}
                    className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-2"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink transition-colors group-hover:text-brand-600">
                        {fault.title}
                      </span>
                      <span className="block truncate text-xs text-ink-3">
                        {CATEGORY_LABEL[fault.category]} ·{' '}
                        {memberLabel(members.get(fault.reported_by))} ·{' '}
                        {relativeTime(fault.created_at)}
                      </span>
                    </span>
                    <span className={`badge shrink-0 ${STATUS_BADGE[fault.status]}`}>
                      {STATUS_LABEL[fault.status]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* recent transactions */}
        <section className="animate-rise">
          <SectionHead title="תנועות אחרונות בתקציב" href="/budget" linkLabel="לתקציב המלא" />
          {!transactions || transactions.length === 0 ? (
            <QuietCard text="עדיין לא נרשמו תנועות בתקציב." />
          ) : (
            <ul className="card divide-y divide-line overflow-hidden">
              {transactions.map((tx) => {
                const isIncome = tx.type === 'income';
                return (
                  <li key={tx.id} className="flex items-center gap-3 px-5 py-3.5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {tx.description}
                      </span>
                      <span className="num block text-xs text-ink-3">
                        {formatDay(tx.date)}
                      </span>
                    </span>
                    <span
                      className={`num shrink-0 text-sm font-bold ${
                        isIncome ? 'text-ok-500' : 'text-danger-500'
                      }`}
                    >
                      {isIncome ? '+' : '−'}
                      {formatMoney(Number(tx.amount))}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {codes && <InviteCodesCard codes={codes} />}

      <section className="card animate-rise p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-heading">
            דיירי הבניין
          </h2>
          <span className="num text-sm text-ink-3">{members.size} רשומים</span>
        </div>

        <ul className="mt-4 divide-y divide-line">
          {[...members.values()].map((member) => (
            <li key={member.id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">
                  {member.full_name}
                  {member.id === profile.id && (
                    <span className="mr-1.5 text-xs font-normal text-ink-3">(אתה)</span>
                  )}
                </span>
                {member.apartment_number && (
                  <span className="num block text-xs text-ink-3">
                    דירה {member.apartment_number}
                  </span>
                )}
              </span>
              <span className={`badge ${member.role === 'vaad' ? 'badge-brand' : 'badge-neutral'}`}>
                {member.role === 'vaad' ? 'חבר ועד' : 'דייר'}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

const ACCENTS = {
  clay: 'from-clay-400 to-clay-300',
  brand: 'from-cta to-brand-400',
  ok: 'from-ok-500 to-ok-500/60',
  danger: 'from-danger-500 to-danger-500/60',
};

function StatTile({
  href,
  accent,
  label,
  value,
  caption,
  delay,
}: {
  href: Route;
  accent: keyof typeof ACCENTS;
  label: string;
  value: React.ReactNode;
  caption: string;
  delay: number;
}) {
  return (
    <Link
      href={href}
      className="card animate-rise group relative overflow-hidden p-5 transition-shadow duration-200 hover:shadow-[var(--shadow-lift)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-l ${ACCENTS[accent]}`}
        aria-hidden="true"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow">{label}</span>
        <svg
          viewBox="0 0 20 20"
          className="h-4 w-4 rotate-180 text-line-strong transition-all duration-200 group-hover:-translate-x-0.5 group-hover:text-brand-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m8 4 6 6-6 6" />
        </svg>
      </div>
      <p className="num mt-2 font-display text-3xl font-bold text-heading">
        {value}
      </p>
      <p className="mt-1 text-xs text-ink-3">{caption}</p>
    </Link>
  );
}

function SectionHead({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between gap-3 px-1">
      <h2 className="font-display text-lg font-bold text-heading">{title}</h2>
      <Link
        href={href as never}
        className="text-xs font-semibold text-brand-600 underline-offset-4 hover:underline"
      >
        {linkLabel}
      </Link>
    </div>
  );
}

function QuietCard({ text }: { text: string }) {
  return (
    <div className="card-quiet px-5 py-8 text-center text-sm text-ink-2">
      {text}
    </div>
  );
}

function BuildingCreated({ name }: { name: string }) {
  return (
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
          הבניין &quot;{name}&quot; נוצר בהצלחה
        </p>
        <p className="mt-0.5 text-sm">
          הוגדרת כחבר ועד. שני קודי ההצטרפות מחכים לך למטה — אפשר להעביר אותם
          לדיירים כבר עכשיו.
        </p>
      </div>
    </div>
  );
}
