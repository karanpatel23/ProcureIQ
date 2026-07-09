import type { Metadata } from 'next';
import { Footer, Header } from '@/components/site';
import { SiteAnalytics } from '@/components/site-analytics';
import { env } from '@/lib/server/env';
import { brand, siteUrl, structuredData } from '@/lib/seo';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `ProcureIQ | ${brand.tagline}`, template: '%s | ProcureIQ' },
  description: brand.description,
  applicationName: 'ProcureIQ',
  icons: { icon: [{ url: '/icon.svg', type: 'image/svg+xml' }], shortcut: '/icon.svg' },
  keywords: ['ProcureIQ', 'procurement software', 'AI procurement', 'RFQ software', 'supplier quote comparison', 'purchase order automation', 'procurement platform'],
  authors: [{ name: 'ProcureIQ' }],
  creator: 'ProcureIQ',
  publisher: 'ProcureIQ',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
  openGraph: { type: 'website', siteName: 'ProcureIQ', title: `ProcureIQ | ${brand.tagline}`, description: brand.description, url: siteUrl, locale: 'en_US' },
  twitter: { card: 'summary_large_image', title: `ProcureIQ | ${brand.tagline}`, description: brand.description },
  ...(env.GOOGLE_SITE_VERIFICATION ? { verification: { google: env.GOOGLE_SITE_VERIFICATION } } : {}),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
        <Footer />
        <SiteAnalytics />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()) }} />
      </body>
    </html>
  );
}
