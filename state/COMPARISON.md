# ProcureIQ vs procure.ai vs Procurify — honest side-by-side

_Last updated: 2026-07-11. "ProcureIQ today" includes everything merged to main through the
Autopilot cycle (PR #49)._

| Dimension | procure.ai | Procurify | ProcureIQ today |
|---|---|---|---|
| Core promise | Autonomous agents execute procurement; savings on autopilot | Easy spend control everyone adopts | Auditable autopilot: AI runs intake→quote→decision→PO inside policy; humans see exceptions |
| Target buyer | Enterprise (DMG Mori, Kärcher, EnBW) | Mid-market | SMB/mid-market supplier-heavy buyers |
| Time to first value | Rollout project (modules, agents, private cloud) | 6–12 wks onboarding despite easy-use brand | Minutes (self-serve signup → intake → comparison) — unproven with real customers, but architecturally true |
| Pricing | Opaque, contact-sales, enterprise ACV | Custom, ~$2k–50k/yr, demo-first | $99–799/mo self-serve, public |
| Intake | Generative intake (strong; 60% autonomous claim) | Forms + catalog requests | Free-text/email parse → RFQ w/ supplier matching (shipped, deterministic, honest gaps) |
| Sourcing/decision | Autonomous sourcing + negotiation agents (flagship) | **Absent** — no RFQ comparison or award logic | Comparison + policy engine + auto-select in policy (shipped) |
| Negotiation | Autonomous commercial negotiation, 3.7–5.2% savings claims | None | **Was missing → this cycle ships AI-drafted counter-offers (human-gated send)** |
| Approvals | Agent-routed | Configurable but **rigid** (top complaint) | Policy reasoning: in-policy auto, exceptions named (shipped) |
| Explainability of AI actions | Black box publicly; trust via brand/pilots | n/a (AI is assistive) | Workflow runs + audit trail exist, **but were buried in dashboards → this cycle ships a human-readable Activity feed** |
| PO/receiving/AP | Order + invoice automation | Full P2P incl. receiving, 3-way match, AP | PO draft/approve/export only. **We lose here — no receiving, no invoices, no payments** |
| Integrations | Enterprise ERP connectors | QBO/NetSuite/Sage moat | CSV/PDF export only. **We lose here** |
| Mobile | — | Native apps (praised) | Responsive web only. **We lose** |
| Track record | €50B spend, marquee logos, $13M funded | #1 G2 mid-market, 191+ Capterra reviews | Zero customers. **We lose everywhere on proof** |

## Where ProcureIQ currently loses (kept honest, drives the backlog)
1. **Proof** — no customers, no reviews, no case studies. Only fix: real users (Karan's pipeline).
2. **Accounting integration** — Procurify's QBO/NetSuite sync is why finance says yes. Our CSV
   export is the interim answer; QuickBooks connector is designed, blocked on Intuit app reg.
3. **Downstream depth** — receiving/invoice/3-way match don't exist. Deliberate sequencing, not
   denial: decision layer first, AP later.
4. **Negotiation & sourcing breadth vs procure.ai** — they discover suppliers and negotiate
   autonomously; we compare what arrives and (after this cycle) draft the negotiation for a human
   to send. Right trade at our trust level, but name it.
5. **Review-volume trust** — unfixable by code; fix by being deployable in an afternoon and honest.

## Where ProcureIQ already beats both
- **procure.ai can't serve the small buyer at all** (price, motion); we're self-serve at $99.
- **Procurify can't decide** (no comparison/award/negotiation brain); our whole spine is the decision.
- **Neither shows its reasoning per action**; every ProcureIQ AI step is a persisted workflow run
  + audit event with named policy checks — we just hadn't given it a front door (fixed this cycle).
