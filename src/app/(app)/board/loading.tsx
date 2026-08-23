import { Chips, Line, PageHead } from '@/components/skeleton';

export default function Loading() {
  return (
    <div className="animate-fade space-y-6">
      <PageHead button />
      <Chips count={6} />
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card space-y-3 p-5">
            <Line w="5rem" h="1.25rem" className="rounded-full" />
            <Line w="80%" h="1.125rem" />
            <Line w="95%" h="0.75rem" />
            <Line w="60%" h="0.75rem" />
            <Line w="45%" h="0.6875rem" />
          </div>
        ))}
      </div>
    </div>
  );
}
