import Link from 'next/link';

export default function NotFoundPage() {
  return <main><section className="page-hero section-shell compact"><p className="eyebrow">Not found</p><h1>This page is not available.</h1><p>The link may be outdated, or the record may not exist in your workspace.</p><div className="hero-actions"><Link className="button primary" href="/">Go home</Link><Link className="button secondary" href="/contact">Contact ProcureIQ</Link></div></section></main>;
}
