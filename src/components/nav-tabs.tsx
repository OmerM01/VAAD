'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';

export type NavItem = { href: Route; label: string };

export function NavTabs({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="mx-auto w-full max-w-6xl overflow-x-auto px-5">
      <ul className="flex gap-1">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`relative block px-3 pb-2.5 pt-1 text-sm font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? 'text-brand-700'
                    : 'text-ink-3 hover:text-ink-2'
                }`}
              >
                {item.label}
                <span
                  className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-clay-400 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    active ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
