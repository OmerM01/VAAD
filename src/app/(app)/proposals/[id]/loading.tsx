import { Line, Panel } from '@/components/skeleton';

export default function Loading() {
  return (
    <div className="animate-fade mx-auto max-w-3xl space-y-6">
      <Line w="11rem" h="0.875rem" />
      <div className="card space-y-4 p-7">
        <div className="flex justify-between gap-3">
          <Line w="7rem" h="1.25rem" className="rounded-full" />
          <Line w="9rem" h="0.75rem" />
        </div>
        <Line w="75%" h="1.75rem" />
        <Line w="30%" h="0.75rem" />
        <Line w="95%" h="0.875rem" />
        <div className="space-y-2 border-t border-line pt-5">
          <Line w="6rem" h="0.625rem" />
          <Line w="100%" h="0.625rem" className="rounded-full" />
        </div>
      </div>
      <Panel lines={2} />
    </div>
  );
}
