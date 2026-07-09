import type { MetadataRoute } from 'next';
import { publicRoutes, siteUrl } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return publicRoutes.map((path) => ({
    url: `${siteUrl}${path ? `/${path}` : ''}`,
    lastModified,
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : path === 'pricing' || path === 'platform' ? 0.8 : 0.6,
  }));
}
