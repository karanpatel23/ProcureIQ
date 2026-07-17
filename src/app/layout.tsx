import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Footer, Header } from '@/components/site';
import { SiteAnalytics } from '@/components/site-analytics';
import { env } from '@/lib/server/env';
import { brand, siteUrl, structuredData } from '@/lib/seo';
import './globals.css';

// Self-hosted brand typography (SIL OFL, licenses alongside the files).
// Instrument Sans carries all UI/body text; Instrument Serif is reserved
// for display headlines. Exposed as CSS variables consumed in globals.css.
const fontSans = localFont({
  src: [{ path: '../fonts/instrument-sans-variable.woff2', weight: '100 900', style: 'normal' }],
  variable: '--font-sans-brand',
  display: 'swap',
});

const fontDisplay = localFont({
  src: [
    { path: '../fonts/instrument-serif-400.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/instrument-serif-400-italic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--font-display-brand',
  display: 'swap',
});

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
    <html lang="en" className={`${fontSans.variable} ${fontDisplay.variable}`}>
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
