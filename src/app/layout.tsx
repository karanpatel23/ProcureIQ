import type { Metadata } from 'next';
import { Footer, Header } from '@/components/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://procureiq.ai'),
  title: { default: 'ProcureIQ | Procurement Control Room', template: '%s | ProcureIQ' },
  description: 'ProcureIQ helps purchasing and operations teams review supplier quotes, compare tradeoffs, and draft purchase orders with source-backed confidence.',
  openGraph: {
    title: 'ProcureIQ',
    description: 'Supplier quotes, ready for decision.',
    url: 'https://procureiq.ai',
    siteName: 'ProcureIQ',
    type: 'website',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Header />{children}<Footer /></body></html>;
}
