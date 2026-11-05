import Link from 'next/link';
import type { Route } from 'next';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getMembers, memberLabel, type Member } from '@/lib/members';
import { formatDay, formatMoney, greeting, relativeTime } from '@/lib/format';
import { CATEGORY_LABEL, STATUS_BADGE, STATUS_LABEL } from '@/lib/faults';
import { DIM, EDGE, FLAME, NIGHT, PANEL, SKY, glow } from '@/lib/night';
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
    <div>
      {created === '1' && <BuildingCreated name={profile.building.name} />}

      {/* ---- welcome band, with the figures sitting on its lower edge ---- */}
      <section
        className="animate-rise relative overflow-hidden rounded-2xl px-6 pt-8 pb-28 sm:px-9 sm:pt-11"
        style={{ background: NIGHT }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-28 left-10 h-80 w-80 rounded-full opacity-50 blur-3xl"
          style={{ background: glow('#1d4668') }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-10 h-72 w-72 rounded-full opacity-25 blur-3xl"
          style={{ background: glow('#8a4028') }}
        />

        <div className="relative flex items-start justify-between gap-6">
          <div>
            <span className="text-xs font-semibold" style={{ color: SKY }}>
              {greeting()}, {profile.fullName.split(' ')[0]}
            </span>
            <h1
              className="mt-1.5 font-display text-3xl font-bold sm:text-4xl"
              style={{ color: '#ffffff' }}
            >
              {profile.building.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className="rounded-md px-2.5 py-1 text-xs font-bold"
                style={
                  isVaad
                    ? { background: FLAME, color: '#2b1208' }
                    : { background: PANEL, color: SKY, border: `1px solid ${EDGE}` }
                }
              >
                {isVaad ? 'חבר ועד' : 'דייר'}
              </span>
              <span className="text-xs" style={{ color: DIM }}>
                {isVaad
                  ? 'אפשר לעדכן סטטוס תקלות, להזין תנועות ולסגור הצבעות.'
                  : 'אפשר לדווח תקלות, לראות את התקציב ולהצביע.'}
              </span>
            </div>
          </div>

          <WindowMark />
        </div>
      </section>

      <div className="-mt-16 grid gap-4 px-1 sm:grid-cols-3">
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
          delay={120}
        />
        <StatTile
          href="/budget"
          accent={balance >= 0 ? 'brand' : 'danger'}
          label="יתרת התקציב"
          value={<Counter value={balance} format="money" />}
          caption={`מחושב מ-${budget.tx_count ?? 0} תנועות`}
          delay={200}
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
          delay={280}
        />
      </div>

      {/* ---- sections ---- */}
      <div className="mt-14 space-y-14">
        {awaitingMyVote.length > 0 && (
          <Section
            eyebrow="פעולה נדרשת"
            title="ממתינות להצבעה שלך"
            href="/proposals?status=open"
            linkLabel="לכל ההצעות"
            delay={360}
          >
            <ul
              className={`grid gap-4 ${awaitingMyVote.length > 1 ? 'sm:grid-cols-2' : ''}`}
            >
              {awaitingMyVote.slice(0, 2).map((proposal) => (
                <li key={proposal.id}>
                  <Link
                    href={`/proposals/${proposal.id}`}
                    className="card group block h-full border-r-4 border-r-ok-500 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
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
          </Section>
        )}

        <div className="grid gap-14 lg:grid-cols-2 lg:gap-8">
          <Section
            eyebrow="תחזוקה"
            title="תקלות שדורשות טיפול"
            href="/faults"
            linkLabel="לכל התקלות"
            delay={440}
          >
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
          </Section>

          <Section
            eyebrow="כספים"
            title="תנועות אחרונות"
            href="/budget"
            linkLabel="לתקציב המלא"
            delay={520}
          >
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
          </Section>
        </div>

        {codes && (
          <div className="animate-rise" style={{ animationDelay: '600ms' }}>
            <InviteCodesCard codes={codes} />
          </div>
        )}

        <Section
          eyebrow="מי גר כאן"
          title="דיירי הבניין"
          note={`${members.size} רשומים`}
          delay={680}
        >
          <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {[...members.values()].map((member) => (
              <MemberChip key={member.id} member={member} isMe={member.id === profile.id} />
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/** The building motif from the landing page, shrunk to a corner ornament. */
function WindowMark() {
  const lit = [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1];
  return (
    <div
      aria-hidden
      className="hidden shrink-0 rounded-xl p-3 sm:block"
      style={{ background: PANEL, border: `1px solid ${EDGE}` }}
    >
      <div className="grid grid-cols-3 gap-2">
        {lit.map((on, i) => (
          <span
            key={i}
            className={on ? 'lamp' : ''}
            style={{
              display: 'block',
              width: '0.8rem',
              height: '0.8rem',
              borderRadius: '0.2rem',
              background: on ? (i % 5 === 0 ? FLAME : '#f0c987') : '#1b3048',
              opacity: on ? undefined : 0.2,
              animationDelay: `${(i % 6) * 0.4}s`,
            }}
          />
        ))}
      </div>
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
      className="card animate-rise group relative overflow-hidden p-5 shadow-[var(--shadow-lift)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_44px_-12px_rgb(22_32_43/0.28)]"
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
      <p className="num mt-2 font-display text-3xl font-bold text-heading">{value}</p>
      <p className="mt-1 text-xs text-ink-3">{caption}</p>
    </Link>
  );
}

/**
 * One block of the page. The rule under the heading is what separates the
 * sections from each other; without it they ran together into one long sheet.
 */
function Section({
  eyebrow,
  title,
  href,
  linkLabel,
  note,
  delay,
  children,
}: {
  eyebrow: string;
  title: string;
  href?: string;
  linkLabel?: string;
  note?: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <section className="animate-rise" style={{ animationDelay: `${delay}ms` }}>
      <div className="mb-4 flex items-end justify-between gap-3 border-b border-line pb-3">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="mt-0.5 font-display text-lg font-bold text-heading">{title}</h2>
        </div>
        {href && linkLabel && (
          <Link
            href={href as never}
            className="shrink-0 text-xs font-semibold text-brand-600 underline-offset-4 hover:underline"
          >
            {linkLabel}
          </Link>
        )}
        {note && <span className="num shrink-0 text-xs text-ink-3">{note}</span>}
      </div>
      {children}
    </section>
  );
}

/** A resident as a compact chip. Seven of these read as a group; seven rows
    of a list read as a table nobody asked for. */
function MemberChip({ member, isMe }: { member: Member; isMe: boolean }) {
  const initials = member.full_name
    .split(' ')
    .slice(0, 2)
    .map((part: string) => part[0])
    .join('');
  const isVaad = member.role === 'vaad';

  return (
    <li
      className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 ${
        isMe ? 'border-brand-200 bg-brand-50' : 'border-line bg-surface'
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          isVaad ? 'bg-cta text-white' : 'bg-chip text-ink-2'
        }`}
      >
        {initials}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">
          {member.full_name}
          {isMe && <span className="mr-1.5 text-xs font-normal text-ink-3">(אתה)</span>}
        </span>
        <span className="num block truncate text-xs text-ink-3">
          {member.apartment_number ? `דירה ${member.apartment_number}` : '—'}
          {isVaad && ' · חבר ועד'}
        </span>
      </span>
    </li>
  );
}

function QuietCard({ text }: { text: string }) {
  return (
    <div className="card-quiet px-5 py-8 text-center text-sm text-ink-2">{text}</div>
  );
}

function BuildingCreated({ name }: { name: string }) {
  return (
    <div className="animate-rise mb-6 flex items-start gap-3 rounded-xl border border-ok-100 bg-ok-50 p-4 text-ok-600">
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
