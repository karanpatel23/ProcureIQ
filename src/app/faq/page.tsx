import type { Metadata } from 'next';
import Link from 'next/link';
import { faqs } from '@/lib/faq';

export const metadata: Metadata = {
  title: 'Corven FAQ — AI procurement, RFQs, quote comparison & POs',
  description: 'Answers to common questions about Corven: what it is, how AI compares supplier quotes, building RFQs, generating purchase orders, security, and pricing.',
  alternates: { canonical: '/faq' },
};

// FAQPage structured data — eligible for FAQ rich results and reinforces what
// Corven is for brand and topic relevance.
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};

export default function FaqPage() {
  return (
    <main>
      <section className="section-shell faq-shell">
        <div className="section-heading-block">
          <p className="eyebrow">Frequently asked questions</p>
          <h1>Corven, explained.</h1>
          <p className="lead">What Corven is, how the AI works, and how it fits your procurement stack — answered plainly.</p>
        </div>

        <div className="faq-list">
          {faqs.map((f, i) => (
            <details className="faq-item" key={f.q} open={i === 0}>
              <summary><span>{f.q}</span><i aria-hidden="true" /></summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>

        <div className="faq-cta">
          <p>Still have a question about how Corven fits your procurement workflow?</p>
          <div className="hero-actions">
            <Link className="button primary" href="/demo">Book a demo</Link>
            <Link className="button secondary" href="/contact">Contact us</Link>
          </div>
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </main>
  );
}
