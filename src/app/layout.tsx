import type { Metadata, Viewport } from 'next';
import { Heebo, Frank_Ruhl_Libre } from 'next/font/google';

import './globals.css';

const heebo = Heebo({
  variable: '--font-heebo',
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const frank = Frank_Ruhl_Libre({
  variable: '--font-frank',
  subsets: ['hebrew', 'latin'],
  weight: ['500', '700', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'ועד בית — ניהול בניין משותף',
    template: '%s · ועד בית',
  },
  description:
    'תקלות, תקציב והצבעות של ועד הבית במקום אחד — שקוף לכל דייר בבניין.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f3f0ea' },
    { media: '(prefers-color-scheme: dark)', color: '#10151b' },
  ],
};

/**
 * Resolves the theme before the first paint, so a visitor on dark never sees a
 * white flash. It always writes an explicit value, including for "system",
 * which is what lets the stylesheet carry a single dark block instead of
 * repeating every token under a media query.
 */
const THEME_BOOT = `try{var s=localStorage.getItem('vaad-theme');var d=s?s==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=d?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}`;

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} ${frank.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
