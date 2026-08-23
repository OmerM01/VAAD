import { Line, PageHead, RowList } from '@/components/skeleton';

export default function Loading() {
  return (
    <div className="animate-fade space-y-6">
      <PageHead button />
      <div className="card grid gap-px overflow-hidden bg-line sm:grid-cols-[1.4fr_1fr_1fr]">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-3 bg-surface p-6">
            <Line w="6rem" h="0.625rem" />
            <Line w="9rem" h={i === 0 ? '2.5rem' : '1.75rem'} />
          </div>
        ))}
      </div>
      <div className="space-y-2.5">
        <Line w="7rem" h="1rem" />
        <RowList rows={5} />
      </div>
    </div>
  );
}
