/** Placeholder blocks shown while a server component fetches its data. */

export function Line({
  w = '100%',
  h = '0.875rem',
  className = '',
}: {
  w?: string;
  h?: string;
  className?: string;
}) {
  return (
    <span
      className={`skeleton block ${className}`}
      style={{ width: w, height: h }}
      aria-hidden="true"
    />
  );
}

export function PageHead({ button = false }: { button?: boolean }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2.5">
        <Line w="5rem" h="0.625rem" />
        <Line w="13rem" h="1.75rem" />
        <Line w="20rem" h="0.75rem" />
      </div>
      {button && <Line w="8rem" h="2.5rem" className="rounded-lg" />}
    </div>
  );
}

export function Chips({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }, (_, i) => (
        <Line key={i} w={`${5 + (i % 3)}rem`} h="2rem" className="rounded-full" />
      ))}
    </div>
  );
}

export function RowList({ rows = 4 }: { rows?: number }) {
  return (
    <ul className="card divide-y divide-line overflow-hidden">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-3 px-5 py-4">
          <Line w="2.25rem" h="2.25rem" className="shrink-0 rounded-full" />
          <span className="flex-1 space-y-2">
            <Line w={`${55 + ((i * 13) % 35)}%`} />
            <Line w="35%" h="0.6875rem" />
          </span>
          <Line w="4rem" h="1.25rem" className="shrink-0 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

export function Cards({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card space-y-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <Line w={`${45 + ((i * 17) % 30)}%`} h="1.125rem" />
            <Line w="4.5rem" h="1.25rem" className="rounded-full" />
          </div>
          <Line w="85%" h="0.75rem" />
          <Line w="60%" h="0.6875rem" />
        </div>
      ))}
    </div>
  );
}

export function Tiles({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card space-y-3 p-5">
          <Line w="6rem" h="0.625rem" />
          <Line w="8rem" h="2rem" />
          <Line w="10rem" h="0.6875rem" />
        </div>
      ))}
    </div>
  );
}

export function Panel({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card space-y-3 p-6">
      <Line w="9rem" h="1.125rem" />
      {Array.from({ length: lines }, (_, i) => (
        <Line key={i} w={`${95 - i * 12}%`} h="0.75rem" />
      ))}
    </div>
  );
}
