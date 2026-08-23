import { forShare } from '@/lib/proposals';

/** Split bar showing the for/against tally. */
export function VoteBar({
  votesFor,
  votesAgainst,
  size = 'md',
}: {
  votesFor: number;
  votesAgainst: number;
  size?: 'sm' | 'md';
}) {
  const total = votesFor + votesAgainst;
  const share = forShare(votesFor, votesAgainst);
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div>
      <div
        className={`bar-reveal flex ${height} overflow-hidden rounded-full bg-line`}
        role="img"
        aria-label={`${votesFor} בעד, ${votesAgainst} נגד`}
      >
        {total > 0 && (
          <>
            <span
              className="h-full bg-ok-500 transition-[width] duration-500 ease-out"
              style={{ width: `${share}%` }}
            />
            <span className="h-full flex-1 bg-clay-400" />
          </>
        )}
      </div>

      <div className="mt-1.5 flex items-center justify-between text-xs font-semibold">
        <span className="num text-ok-500">{votesFor} בעד</span>
        <span className="num text-ink-3">
          {total === 0 ? 'טרם הצביעו' : `${total} מצביעים`}
        </span>
        <span className="num text-clay-500">{votesAgainst} נגד</span>
      </div>
    </div>
  );
}
