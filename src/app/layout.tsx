import type { Metadata } from 'next';
import { Footer, Header } from '@/components/site';
import { SiteAnalytics } from '@/components/site-analytics';
import { env } from '@/lib/server/env';
import { brand, siteUrl, structuredData } from '@/lib/seo';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `Corven | ${brand.tagline}`, template: '%s | Corven' },
  description: brand.description,
  applicationName: 'Corven',
  icons: { icon: [{ url: '/icon.svg', type: 'image/svg+xml' }], shortcut: '/icon.svg' },
  keywords: ['Corven', 'procurement software', 'AI procurement', 'RFQ software', 'supplier quote comparison', 'purchase order automation', 'procurement platform'],
  authors: [{ name: 'Corven' }],
  creator: 'Corven',
  publisher: 'Corven',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
  openGraph: { type: 'website', siteName: 'Corven', title: `Corven | ${brand.tagline}`, description: brand.description, url: siteUrl, locale: 'en_US' },
  twitter: { card: 'summary_large_image', title: `Corven | ${brand.tagline}`, description: brand.description },
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
