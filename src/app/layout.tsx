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
  themeColor: '#1d3f60',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} ${frank.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
