import type { Metadata } from 'next';
import { Footer, Header } from '@/components/site';
import { SiteAnalytics } from '@/components/site-analytics';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'ProcureIQ | The AI decision layer for procurement', template: '%s | ProcureIQ' },
  description:
    'ProcureIQ turns supplier quotes, procurement context, exceptions, and approval needs into a clear, human-controlled decision workflow.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Header />{children}<Footer /><SiteAnalytics /></body></html>;
}
