import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';

// Let search engines crawl the public marketing site; keep the authenticated app,
// admin, onboarding, and API endpoints out of the index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/app/', '/admin/', '/onboarding', '/api/'] }],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
