import { FinalCta } from '@/components/site';

export const metadata = {
  title: 'Security and Trust',
  description: 'The ProcureIQ security model: workspace boundaries, access control, human approval, auditability, source-aware review, and responsible AI.',
};

const sections = [
  ['01', 'Workspace boundaries', 'Suppliers, RFQs, quote documents, comparison decisions, and PO drafts are scoped to your authenticated workspace. Every data lookup carries the workspace boundary.'],
  ['02', 'Access control', 'Authenticated sessions are signed and expire automatically. Application routes require login, and role checks gate workspace actions. Internal admin views sit behind a separate allowlist.'],
  ['03', 'Human approval by design', 'AI recommendations are drafts. Purchase orders are never sent automatically, and every purchasing decision requires an authorized person.'],
  ['04', 'Source-aware review', 'Extracted quote fields carry confidence and source context so reviewers can verify pricing, terms, and exceptions against the original document.'],
  ['05', 'Auditability', 'Supplier changes, RFQs, quote uploads, reviews, selections, PO approvals, and exports write audit events your team can review.'],
  ['06', 'Responsible AI', 'Missing information stays flagged and low-confidence fields stay visible — the system never fills gaps with invented values, and there is no autonomous purchasing.'],
  ['07', 'Environment and secrets hygiene', 'Server secrets stay server-side: no secret values are exposed to the browser, environment configuration is validated at startup, and quote documents are stored through a private server-side storage layer.'],
] as const;

export default function SecurityPage() {
  return (
    <main>
      <section className="page-hero section-shell compact">
        <p className="eyebrow">Security and trust</p>
        <h1>Controls for sensitive supplier pricing and purchasing decisions.</h1>
        <p>ProcureIQ is built around reviewable drafts, source evidence, workspace boundaries, and auditability — not autonomous purchasing.</p>
      </section>
      <section className="section-shell module-list">
        {sections.map(([num, title, body]) => (
          <article className="numbered-module" key={title}>
            <span>{num}</span>
            <div><h2>{title}</h2><p>{body}</p></div>
          </article>
        ))}
      </section>
      <section className="section-shell compact-section">
        <div className="section-heading-block">
          <p className="eyebrow">Compliance posture</p>
          <h2>Honest about where we are.</h2>
          <p className="lead">
            ProcureIQ is an early-stage product and does not yet hold formal certifications. We publish the controls
            above because they are implemented today, and we are happy to walk security teams through the architecture
            during evaluation.
          </p>
        </div>
      </section>
      <FinalCta />
    </main>
  );
}
