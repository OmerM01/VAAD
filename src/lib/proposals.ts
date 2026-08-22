import type { VoteChoice } from '@/lib/database.types';

export const VOTING_PERIODS: { days: number; label: string }[] = [
  { days: 3, label: '3 ימים' },
  { days: 7, label: 'שבוע' },
  { days: 14, label: 'שבועיים' },
  { days: 30, label: 'חודש' },
];

export const VOTE_LABEL: Record<VoteChoice, string> = {
  for: 'בעד',
  against: 'נגד',
};

export function isVoteChoice(value: unknown): value is VoteChoice {
  return value === 'for' || value === 'against';
}

/** Share of "for" votes, used for the result bar. Ties render as an even split. */
export function forShare(votesFor: number, votesAgainst: number): number {
  const total = votesFor + votesAgainst;
  if (total === 0) return 50;
  return (votesFor / total) * 100;
}

export type Outcome = 'passed' | 'rejected' | 'tied' | 'no-votes';

export function outcome(votesFor: number, votesAgainst: number): Outcome {
  if (votesFor + votesAgainst === 0) return 'no-votes';
  if (votesFor > votesAgainst) return 'passed';
  if (votesAgainst > votesFor) return 'rejected';
  return 'tied';
}

export const OUTCOME_TEXT: Record<Outcome, { label: string; badge: string }> = {
  passed: { label: 'ההצעה התקבלה', badge: 'badge-closed' },
  rejected: { label: 'ההצעה נדחתה', badge: 'badge-open' },
  tied: { label: 'תיקו — אין הכרעה', badge: 'badge-neutral' },
  'no-votes': { label: 'איש לא הצביע', badge: 'badge-neutral' },
};
