import Link from 'next/link';

import { signOut } from '@/lib/actions/auth';
import type { Profile } from '@/lib/auth';
import { Logo } from '@/components/brand';

import { NavTabs, type NavItem } from './nav-tabs';

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'סקירה' },
  { href: '/faults', label: 'תקלות' },
  { href: '/budget', label: 'תקציב' },
  { href: '/proposals', label: 'הצעות' },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');
}

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const isVaad = profile.role === 'vaad';

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-5">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
            <Logo className="h-7 w-7" />
            <span className="hidden font-display text-lg font-bold text-brand-800 sm:block">
              ועד בית
            </span>
          </Link>

          <span className="h-6 w-px shrink-0 bg-line" />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">
              {profile.building.name}
            </p>
            {profile.building.address && (
              <p className="truncate text-xs text-ink-3">
                {profile.building.address}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden items-center gap-2.5 sm:flex">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  isVaad
                    ? 'bg-brand-600 text-white'
                    : 'bg-brand-50 text-brand-700'
                }`}
                aria-hidden="true"
              >
                {initials(profile.fullName)}
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-semibold text-ink">
                  {profile.fullName}
                </span>
                <span className="block text-[0.6875rem] font-semibold text-ink-3">
                  {isVaad ? 'חבר ועד' : 'דייר'}
                  {profile.apartmentNumber && ` · דירה ${profile.apartmentNumber}`}
                </span>
              </span>
            </div>

            <form action={signOut}>
              <button type="submit" className="btn btn-ghost btn-sm">
                התנתקות
              </button>
            </form>
          </div>
        </div>

        <NavTabs items={NAV} />
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">{children}</main>
    </div>
  );
}
