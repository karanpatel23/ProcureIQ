import { FeaturesSection, FinalCta, FounderSection, GoalsSection, Hero, IndustriesSection, PricingSection, ProblemSection, TrustSection, WorkflowSection } from '@/components/site';

export default function Home() {
  return <main><Hero /><ProblemSection /><WorkflowSection /><IndustriesSection /><FeaturesSection /><TrustSection /><GoalsSection /><FounderSection /><PricingSection /><FinalCta /></main>;
const workflow = [
  'RFQ intake assembled from requests, drawings, and supplier history',
  'Supplier quotes ingested from email threads, PDFs, and spreadsheets',
  'Line-level comparison with traceable evidence for every extracted field',
  'PO drafts generated with confidence scores and routed for approval',
];

const metrics = [
  ['72%', 'less manual quote handling'],
  ['100%', 'field-level source traceability'],
  ['0', 'autonomous purchasing decisions'],
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <nav className="nav"><strong>ProcureIQ</strong><span>AI workflow for strategic purchasing teams</span></nav>
        <div className="heroGrid">
          <div>
            <p className="eyebrow">Premium procurement intelligence</p>
            <h1>Turn supplier quote chaos into approved purchase order drafts.</h1>
            <p className="lede">ProcureIQ gives operators, purchasing teams, manufacturers, contractors, distributors, and industrial companies a smooth AI workflow for RFQs, quote ingestion, quote comparison, supplier memory, and procurement visibility.</p>
            <div className="actions"><a href="#workflow">Explore workflow</a><a href="mailto:founders@procureiq.ai">Request access</a></div>
          </div>
          <div className="glassCard" aria-label="Quote comparison preview">
            <div className="cardHeader"><span>RFQ-4821</span><b>Human approval required</b></div>
            <div className="quoteRow"><span>Northline Metals</span><strong>$42,840</strong><em>94% confidence</em></div>
            <div className="quoteRow"><span>Atlas Components</span><strong>$44,120</strong><em>89% confidence</em></div>
            <div className="trace">Every price, lead time, and exception links back to the source quote.</div>
          </div>
        </div>
      </section>

      <section className="metrics">{metrics.map(([value, label]) => <article key={label}><strong>{value}</strong><span>{label}</span></article>)}</section>

      <section id="workflow" className="workflow">
        <p className="eyebrow">Built around the buying motion</p>
        <h2>Not another generic dashboard. A guided procurement operating layer.</h2>
        <div className="steps">{workflow.map((item, index) => <article key={item}><span>{String(index + 1).padStart(2, '0')}</span><p>{item}</p></article>)}</div>
      </section>

      <section className="trust">
        <div><p className="eyebrow">Enterprise controls from day one</p><h2>AI drafts. People decide.</h2></div>
        <p>ProcureIQ is designed for authenticated workspaces, role-based approvals, validation, secure file handling, audit logs, background extraction jobs, and typed APIs. AI recommendations remain reversible drafts with confidence scores until an authorized human approves them.</p>
      </section>
    </main>
  );
}
