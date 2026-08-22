import Link from 'next/link';

import { Wordmark } from '@/components/brand';
import { BackLink } from '@/components/back-link';

export default function AuthLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between gap-4 px-5 py-6">
        <Link href="/" className="inline-block">
          <Wordmark />
        </Link>
        <BackLink />
      </header>

      <main className="flex flex-1 items-start justify-center px-5 pb-16">
        <div className="w-full max-w-lg">{children}</div>
      </main>
    </div>
  );
}
