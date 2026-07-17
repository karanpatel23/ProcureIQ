import type { MetadataRoute } from 'next';
import { brand } from '@/lib/seo';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `Corven — ${brand.tagline}`,
    short_name: 'Corven',
    description: brand.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#0e1116',
    theme_color: '#0e1116',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
