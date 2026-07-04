'use client';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main><section className="page-hero section-shell compact"><p className="eyebrow">Something went wrong</p><h1>We could not load this ProcureIQ view.</h1><p>Please retry the request. If the issue continues, contact the ProcureIQ team with the approximate time and page you were viewing.</p><div className="hero-actions"><button className="button primary" onClick={() => reset()}>Try again</button><a className="button secondary" href="/contact">Contact support</a></div></section></main>;
}
