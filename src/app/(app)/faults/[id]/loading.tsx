import { Line, Panel } from '@/components/skeleton';

export default function Loading() {
  return (
    <div className="animate-fade mx-auto max-w-3xl space-y-6">
      <Line w="10rem" h="0.875rem" />
      <div className="card overflow-hidden">
        <Line w="100%" h="0.375rem" className="rounded-none" />
        <div className="space-y-4 p-7">
          <div className="flex justify-between gap-3">
            <Line w="5rem" h="1.25rem" className="rounded-full" />
            <Line w="5rem" h="1.25rem" className="rounded-full" />
          </div>
          <Line w="70%" h="1.75rem" />
          <Line w="95%" h="0.875rem" />
          <Line w="80%" h="0.875rem" />
          <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-3">
            <Line h="2.25rem" />
            <Line h="2.25rem" />
            <Line h="2.25rem" />
          </div>
        </div>
      </div>
      <Panel lines={2} />
    </div>
  );
}
