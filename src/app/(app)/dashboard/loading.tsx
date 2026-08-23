import { Cards, PageHead, Panel, RowList, Tiles } from '@/components/skeleton';

export default function Loading() {
  return (
    <div className="animate-fade space-y-6">
      <PageHead />
      <Tiles />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2.5">
          <Cards count={1} />
          <RowList rows={4} />
        </div>
        <div className="space-y-2.5">
          <Cards count={1} />
          <RowList rows={4} />
        </div>
      </div>
      <Panel lines={4} />
    </div>
  );
}
