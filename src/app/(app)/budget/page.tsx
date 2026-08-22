import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getMembers } from '@/lib/members';
import { formatDay, formatMoney, formatMonth } from '@/lib/format';
import type { BudgetSummary, BudgetTransaction } from '@/lib/database.types';

import { AddTransaction } from './add-transaction';
import { ReverseButton } from './reverse-button';

export const metadata = { title: 'תקציב' };

export default async function BudgetPage() {
  const profile = await requireProfile();
  const isVaad = profile.role === 'vaad';
  const supabase = await createClient();

  const [{ data: summaryRows }, { data: transactions }, members] = await Promise.all([
    supabase.rpc('get_building_budget_summary'),
    supabase
      .from('budget_transactions')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .returns<BudgetTransaction[]>(),
    getMembers(),
  ]);

  // The balance always comes back from the RPC, which sums the transactions —
  // there is no stored balance column that could drift out of sync.
  const raw = (summaryRows?.[0] ?? {}) as Partial<BudgetSummary>;
  const income = Number(raw.total_income ?? 0);
  const expense = Number(raw.total_expense ?? 0);
  const balance = Number(raw.balance ?? 0);

  const rows = transactions ?? [];
  const byMonth = groupByMonth(rows);
  // a transaction that some later entry mirrors is shown as cancelled
  const reversed = new Set(
    rows.map((tx) => tx.reverses_id).filter((id): id is string => id !== null),
  );
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="animate-rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">כספי הבניין</span>
          <h1 className="mt-1 font-display text-3xl font-bold text-brand-900">
            תקציב
          </h1>
          <p className="mt-1.5 text-sm text-ink-2">
            כל תנועה גלויה לכל דייר. היתרה מחושבת מסכום התנועות עצמן.
          </p>
        </div>
        {isVaad && <AddTransaction today={today} />}
      </div>

      <BalanceCard income={income} expense={expense} balance={balance} count={rows.length} />

      {rows.length === 0 ? (
        <EmptyState isVaad={isVaad} />
      ) : (
        <div className="space-y-6">
          {byMonth.map(([month, monthRows], groupIndex) => {
            const net = monthRows.reduce(
              (sum, tx) => sum + (tx.type === 'income' ? Number(tx.amount) : -Number(tx.amount)),
              0,
            );

            return (
              <section
                key={month}
                className="animate-rise"
                style={{ animationDelay: `${Math.min(groupIndex, 6) * 60}ms` }}
              >
                <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
                  <h2 className="font-display text-base font-bold text-brand-900">
                    {formatMonth(month)}
                  </h2>
                  <span
                    className={`num text-sm font-semibold ${
                      net >= 0 ? 'text-ok-500' : 'text-danger-500'
                    }`}
                  >
                    {net >= 0 ? '+' : '−'}
                    {formatMoney(Math.abs(net))}
                  </span>
                </div>

                <ul className="card divide-y divide-line overflow-hidden">
                  {monthRows.map((tx) => {
                    const author = members.get(tx.created_by);
                    const isIncome = tx.type === 'income';
                    const isCancelled = reversed.has(tx.id);
                    const isCorrection = tx.reverses_id !== null;

                    return (
                      <li
                        key={tx.id}
                        className={`flex items-center gap-3 px-5 py-3.5 ${
                          isCancelled ? 'bg-surface-2' : ''
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            isCancelled
                              ? 'bg-paper-deep text-ink-3'
                              : isIncome
                                ? 'bg-ok-50 text-ok-500'
                                : 'bg-danger-50 text-danger-500'
                          }`}
                          aria-hidden="true"
                        >
                          {isCorrection ? <UndoIcon /> : <ArrowIcon up={isIncome} />}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-sm font-semibold ${
                              isCancelled
                                ? 'text-ink-3 line-through'
                                : 'text-ink'
                            }`}
                          >
                            {tx.description}
                          </span>
                          <span className="num block truncate text-xs text-ink-3">
                            {formatDay(tx.date)}
                            {author && ` · הוזן על ידי ${author.full_name}`}
                          </span>
                        </span>

                        {isCancelled && (
                          <span className="badge badge-neutral shrink-0">בוטלה</span>
                        )}

                        {isVaad && !isCancelled && !isCorrection && (
                          <ReverseButton
                            transactionId={tx.id}
                            description={tx.description}
                          />
                        )}

                        <span
                          className={`num shrink-0 text-sm font-bold ${
                            isCancelled
                              ? 'text-ink-3 line-through'
                              : isIncome
                                ? 'text-ok-500'
                                : 'text-danger-500'
                          }`}
                        >
                          {isIncome ? '+' : '−'}
                          {formatMoney(Number(tx.amount))}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BalanceCard({
  income,
  expense,
  balance,
  count,
}: {
  income: number;
  expense: number;
  balance: number;
  count: number;
}) {
  const total = income + expense;
  const incomeShare = total > 0 ? (income / total) * 100 : 0;

  return (
    <section className="card animate-rise overflow-hidden">
      <div className="grid gap-px bg-line sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="bg-surface p-6">
          <span className="eyebrow">יתרה נוכחית</span>
          <p
            className={`num mt-1.5 font-display text-4xl font-bold ${
              balance >= 0 ? 'text-brand-900' : 'text-danger-500'
            }`}
          >
            {formatMoney(balance)}
          </p>
          <p className="num mt-1 text-xs text-ink-3">
            מחושב מ-{count} תנועות רשומות
          </p>
        </div>

        <Stat label="סך הכנסות" value={income} tone="ok" />
        <Stat label="סך הוצאות" value={expense} tone="danger" />
      </div>

      {total > 0 && (
        <div className="flex h-2 bg-danger-100" aria-hidden="true">
          <span
            className="h-full bg-ok-500 transition-[width] duration-500"
            style={{ width: `${incomeShare}%` }}
          />
          <span className="h-full flex-1 bg-danger-500" />
        </div>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'ok' | 'danger';
}) {
  return (
    <div className="bg-surface p-6">
      <span className="eyebrow">{label}</span>
      <p
        className={`num mt-1.5 text-2xl font-bold ${
          tone === 'ok' ? 'text-ok-500' : 'text-danger-500'
        }`}
      >
        {formatMoney(value)}
      </p>
    </div>
  );
}

function EmptyState({ isVaad }: { isVaad: boolean }) {
  return (
    <div className="card-quiet animate-rise flex flex-col items-center px-6 py-14 text-center">
      <svg viewBox="0 0 48 48" className="h-12 w-12 text-line-strong" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="6" y="13" width="36" height="24" rx="4" />
        <circle cx="24" cy="25" r="5" />
        <path d="M13 20v10M35 20v10" strokeLinecap="round" />
      </svg>
      <p className="mt-4 font-display text-lg font-bold text-brand-900">
        עדיין אין תנועות בתקציב
      </p>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink-2">
        {isVaad
          ? 'התחילו מהזנת דמי הוועד שנגבו החודש, או מהוצאה אחרונה שבוצעה.'
          : 'כשחברי הוועד יזינו תנועות, הן יופיעו כאן — ולכל דייר תהיה אותה תמונה.'}
      </p>
    </div>
  );
}

function UndoIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 5.5 3.5 9 7 12.5" />
      <path d="M3.5 9h8a5 5 0 0 1 0 10H9" />
    </svg>
  );
}

function ArrowIcon({ up }: { up: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-4 w-4 ${up ? '' : 'rotate-180'}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 15.5v-11M5.5 9 10 4.5 14.5 9" />
    </svg>
  );
}

function groupByMonth(rows: BudgetTransaction[]): [string, BudgetTransaction[]][] {
  const groups = new Map<string, BudgetTransaction[]>();
  for (const row of rows) {
    const key = row.date.slice(0, 7);
    const bucket = groups.get(key);
    if (bucket) bucket.push(row);
    else groups.set(key, [row]);
  }
  return [...groups.entries()];
}
