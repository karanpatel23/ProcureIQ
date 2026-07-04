import type { Metadata } from 'next';
import { Footer, Header } from '@/components/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://procureiq.ai'),
  title: { default: 'ProcureIQ | Quote Comparison and Procurement Workflow', template: '%s | ProcureIQ' },
  description: 'ProcureIQ helps growing teams collect RFQs, compare supplier quotes, draft purchase orders, and preserve supplier memory without replacing current tools.',
  openGraph: {
    title: 'ProcureIQ',
    description: 'Turn supplier quotes into clear purchasing decisions.',
    url: 'https://procureiq.ai',
    siteName: 'ProcureIQ',
    type: 'website',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Header />{children}<Footer /></body></html>;
}
