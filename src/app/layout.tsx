import type { Metadata } from 'next';
import { Footer, Header, TAGLINE } from '@/components/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://procureiq.ai'),
  title: { default: `ProcureIQ | ${TAGLINE}`, template: '%s | ProcureIQ' },
  description: 'Procurement intelligence for high-stakes supplier decisions. ProcureIQ brings supplier context, decisions, and approvals into one intelligent layer.',
  openGraph: {
    title: `ProcureIQ | ${TAGLINE}`,
    description: 'Where supplier complexity becomes decision-ready context.',
    url: 'https://procureiq.ai',
    siteName: 'ProcureIQ',
    type: 'website',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Header />{children}<Footer /></body></html>;
}
