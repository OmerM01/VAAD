import { Cards, Chips, PageHead } from '@/components/skeleton';

export default function Loading() {
  return (
    <div className="animate-fade space-y-6">
      <PageHead button />
      <Chips count={4} />
      <Cards count={4} />
    </div>
  );
}
