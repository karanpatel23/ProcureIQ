import { env } from './server/env';

/**
 * Canonical, absolute site URL. Prefer APP_URL (set in production) and fall back
 * to the primary domain so sitemaps, canonicals, and OG tags always resolve.
 */
export const siteUrl = (env.APP_URL ?? 'https://corven.com').replace(/\/$/, '');

export const brand = {
  name: 'Corven',
  tagline: 'The AI decision layer for procurement',
  description:
    'Corven is an AI-native procurement platform that turns supplier quotes, RFQs, exceptions, and approvals into one clear, human-controlled decision workflow.',
};

// Public pages worth putting in the sitemap, most-important first.
export const publicRoutes = [
  '', 'platform', 'workflow', 'demo-workflow', 'pricing', 'security',
  'about', 'faq', 'contact', 'demo', 'login', 'signup', 'privacy', 'terms',
];

// Official brand profiles. Listed as schema.org `sameAs` so Google can connect
// these accounts to the domain and strengthen the brand knowledge graph. Add
// each URL as the profile goes live (LinkedIn, X, Crunchbase, etc.).
export const socialProfiles: string[] = [];

/**
 * Organization + WebSite + SoftwareApplication structured data. This is what
 * lets Google confidently attach the "Corven" brand to this domain and can
 * power sitelinks / a brand knowledge panel.
 */
export function structuredData() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: brand.name,
        url: siteUrl,
        description: brand.description,
        logo: `${siteUrl}/icon.svg`,
        ...(socialProfiles.length ? { sameAs: socialProfiles } : {}),
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        name: brand.name,
        url: siteUrl,
        publisher: { '@id': `${siteUrl}/#organization` },
      },
      {
        '@type': 'SoftwareApplication',
        name: brand.name,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: siteUrl,
        description: brand.description,
        offers: { '@type': 'Offer', price: '99', priceCurrency: 'USD' },
      },
    ],
  };
}
