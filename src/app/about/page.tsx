import { FinalCta, FounderSection, GoalsSection } from '@/components/site';

export const metadata = {
  title: 'About',
  description: 'Corven is building the AI decision layer for procurement — founded by Karan Patel.',
};

const principles = [
  ['Clarity over complexity', 'Procurement software should make the decision clearer, not add another system to manage. Every screen answers one question: what should we do, and why?'],
  ['Humans approve, always', 'AI drafts, extracts, and recommends. People decide. No purchasing action moves without an authorized approver.'],
  ['Source-aware by default', 'Every extracted field, flag, and recommendation stays connected to the quote evidence it came from.'],
  ['Uncertainty stays visible', 'Missing terms and low-confidence fields are surfaced for review — never papered over with invented values.'],
] as const;

export default function AboutPage() {
  return (
    <main>
      <section className="page-hero section-shell compact">
        <p className="eyebrow">About Corven</p>
        <h1>Building the AI decision layer for procurement.</h1>
        <p>
          Purchasing teams at manufacturers, contractors, distributors, and industrial operators make high-stakes
          supplier decisions from fragmented quotes every week. Corven exists to give those decisions structure,
          context, and control.
        </p>
      </section>
      <section className="section-shell compact-section">
        <div className="section-heading-block">
          <p className="eyebrow">Principles</p>
          <h2>The convictions behind the product.</h2>
        </div>
        <div className="three-card-grid">
          {principles.map(([title, body]) => (
            <article key={title}><h3>{title}</h3><p>{body}</p></article>
          ))}
        </div>
      </section>
      <GoalsSection />
      <FounderSection />
      <FinalCta />
    </main>
  );
}
