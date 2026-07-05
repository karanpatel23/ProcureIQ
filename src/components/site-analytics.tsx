'use client';
import { useEffect } from 'react';
import { Analytics, track } from '@vercel/analytics/react';

/*
 * Page views are tracked automatically by <Analytics />.
 * Interaction tracking is delegated: any element carrying a `data-track`
 * attribute reports a click event named by that attribute, so server
 * components can opt into tracking without becoming client components.
 */
export function SiteAnalytics() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-track]');
      if (target?.dataset.track) track(target.dataset.track, { path: window.location.pathname });
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return <Analytics />;
}
