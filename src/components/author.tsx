/** Proposal author line — a name, or the anonymous stand-in. */
export function Author({
  name,
  isMine,
}: {
  name: string | null;
  isMine: boolean;
}) {
  if (name) {
    return (
      <span>
        {name}
        {isMine && ' (אתה)'}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <circle cx="10" cy="7" r="3" />
        <path d="M4.5 16.5a5.5 5.5 0 0 1 11 0" strokeLinecap="round" />
      </svg>
      הצעה אנונימית
      {isMine && ' (שלך)'}
    </span>
  );
}
