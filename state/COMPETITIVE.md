# ProcureIQ — Competitive Research (RESEARCH log)

_Last updated: 2026-07-09. Sources: G2/Capterra review roundups, vendor comparison pages,
Gartner Peer Insights summaries, category blogs (Stampli, Ramp, Pivot, ProcureDesk,
SelectHub, Teem), vendor sites. Re-run periodically per task instructions._

## 1. Company-by-company findings

### Coupa (incumbent suite)
- **Wedge (original):** unified spend management — "one platform for all spend" for enterprises.
- **Adoption unlock:** community/benchmark data ("Community Intelligence") + full-suite compliance story that satisfies CFOs and auditors; became the safe enterprise choice post-SAP.
- **Still weak:** G2 reviewers report long setup, steep learning curve, heavy IT lift, ~$2,500/mo entry price, "simple tasks take longer than they should," dated UI, supplier-side friction (suppliers struggle to submit invoices). Underperforms on ease-of-use/setup/support categories on G2.
- **So what for ProcureIQ:** the enemy is not Coupa's features, it's Coupa's *weight*. Any wedge we pick must be usable on day one with no IT project.

### SAP Ariba (incumbent suite + network)
- **Wedge:** the Ariba Network — buyer-supplier transactions at scale; deep SAP ERP integration.
- **Adoption unlock:** if you run SAP, Ariba is the default; network effects (suppliers already on it).
- **Still weak:** implementation is "lengthy and complex," notoriously so with non-SAP systems; supplier fees breed resentment; UX is the most-complained-about in the category.
- **So what for ProcureIQ:** never require suppliers to join anything. Suppliers replying by plain email must be a first-class input, not an afterthought.

### Ivalua (incumbent, configurability play)
- **Wedge:** extreme configurability on a single data model for complex global procurement.
- **Adoption unlock:** wins RFPs where requirements are gnarly (direct materials, public sector).
- **Still weak:** implementation complexity is "the primary adoption friction"; reviewers cite platform instability and service-team churn losing client context.
- **So what for ProcureIQ:** configurability is a trap at our stage. Ship opinionated defaults (a working policy out of the box), not a workflow builder.

### Jaggaer (incumbent, direct-materials strength)
- **Wedge:** direct materials procurement for manufacturing + predictive spend analytics.
- **Adoption unlock:** faster time-to-value than peers (per reviews); manufacturing-specific depth.
- **Still weak:** reporting flexibility; still an enterprise sales/implementation motion.
- **So what for ProcureIQ:** manufacturing/direct-materials buyers are underserved by the modern challengers (Zip et al. are indirect-spend/SaaS-intake centric). Our RFQ→quote→PO flow is *already* aimed at them. Keep that focus.

### GEP SMART (incumbent, services-led)
- **Wedge:** suite + managed services combo; mid-market ease of setup (relatively).
- **Still weak:** ERP integration hurdles → data silos; services dependence.
- **So what for ProcureIQ:** day-one value must not depend on any integration. PO export (PDF/CSV/email) beats ERP sync at our stage.

### Tradeshift (network play)
- **Wedge:** e-invoicing + supplier network ("LinkedIn for supply chain"), 2.5M parties, $260B/yr.
- **Adoption unlock:** compliance-led e-invoicing mandates (esp. EU) pulled buyers in.
- **Still weak:** Trustpilot heavily negative on usability, slow loading, clunky UX, support delays. Network requires supplier onboarding — the exact friction SMBs can't impose on suppliers.
- **So what for ProcureIQ:** confirmation that supplier-onboarding-required models are a tax. Our "suppliers just reply by email" stance is a real advantage — name it in marketing.

### Zip (modern challenger — the intake wedge)
- **Wedge:** ONE problem: "where do I ask to buy something?" — a single intake front door that routes requests across the mess of existing systems. Explicitly did NOT try to replace the stack.
- **Adoption unlock:** employees adopt it because it's one URL and feels consumer-grade; procurement adopts it because it sits ON TOP of Coupa/Ariba/ERP rather than replacing them. Launch <6 weeks.
- **Still weak (per Levelpath's own attack ads + reviews):** lacks sourcing, supplier management, contract modules; "AI bolted onto intake workflows"; can't own the end-to-end process. Doesn't help you *decide between quotes* — it routes and approves requests.
- **So what for ProcureIQ:** the winning pattern of the decade = pick the ONE step everyone does in email/spreadsheets, make it 10x, sit on top of everything else. Zip took *intake*. **The equivalent unowned step for supplier-heavy SMBs is the quote comparison decision itself.**

### Levelpath (modern challenger — AI-native platform)
- **Wedge:** AI-native end-to-end procurement (mobile-first, Hero AI) — "AI agents perform the work with human guidance."
- **Adoption unlock:** claims 95% adoption/compliance, 76% cycle-time cuts, 10x RFP capacity; consumer-grade UX; won marquee logos (American Airlines, Amgen, Levi's).
- **Still weak:** enterprise price point and sales motion; SMB/manufacturer with 20 suppliers and no procurement ops team is not their buyer. "Results in weeks" still implies a rollout project.
- **So what for ProcureIQ:** "AI-native" as a label is already taken by a $200M-funded competitor — we cannot win on the adjective. We can win on a *specific outcome* they don't sell to a segment they don't serve (SMB direct-materials buyers).

### Procurify (mid-market challenger)
- **Wedge:** approval workflows + spend visibility for multi-site mid-market (NetSuite/QBO shops).
- **Adoption unlock:** "trained in one day" ease of use; PunchOut catalogs; budgets visible at request time.
- **Still weak:** invoice/AP gaps, challenging ERP integrations, slow system complaints, 6–12+ week basic onboarding (per Precoro comparison), no dynamic forms, limited custom fields.
- **So what for ProcureIQ:** even the "easy" tools take 6-12 weeks to onboard. "First decision-ready comparison in your first session" is a claim nobody in the field makes.

### Precoro (SMB challenger)
- **Wedge:** purchasing control (PR→PO→approval) anyone can use without training or IT.
- **Adoption unlock:** built on the thesis that *adoption is the hardest problem*; 2–8 week setup; unlimited custom fields/dynamic forms; strong audit trail.
- **Still weak:** ~$12k/yr annual-only pricing shocks smaller orgs; **suppliers lack dedicated accounts — supplier interaction is the weak spot**; occasional instability.
- **So what for ProcureIQ:** validates our thesis and our price point flexibility. Their supplier-interaction gap = our RFQ→quote ingestion strength. Also: audit trail is an adoption feature (approver trust), not an enterprise checkbox — we have this via workflow runs; surface it.

### Vroozi (mid-market P2P + marketplace)
- **Wedge:** catalog/marketplace procurement with supplier portal, SAP-partnered.
- **Still weak:** catalog-centric — assumes negotiated catalogs exist; that's not how SMB direct-materials buying works (it's quote-based, not catalog-based).
- **So what for ProcureIQ:** catalog buying and quote buying are different sports. We serve quote-based buying; don't drift into catalogs.

### RFQ micro-tools (AuraVMS, Quotable, QuotesFlow, CalcuQuote — the low end)
- **Wedge:** exactly our pain: manual RFQ cycles. Category stats they publish: **manual RFQ cycle = 3–4 days; 2–3 hours per cycle re-typing supplier quotes into comparable format; 20–30 cycles/month for a manufacturing buyer** ("three quotes is the minimum, five gives leverage").
- **Adoption unlock:** point-tool simplicity, self-serve pricing.
- **Still weak:** they stop at comparison — no policy layer, no approval workflow, no PO generation, no audit trail, no AI extraction from messy PDFs (mostly form-based supplier portals again), no team roles.
- **So what for ProcureIQ:** this is the segment's pain quantified. We do everything they do PLUS the decision/approval/PO layer PLUS AI extraction from email/PDF. They validate demand at the bottom; we out-build them upward without gaining Coupa's weight.

## 2. Comparison table — ProcureIQ vs. the field, honestly

| Dimension | Coupa/Ariba (enterprise) | Zip / Levelpath (modern) | Precoro/Procurify (SMB/mid) | ProcureIQ today |
|---|---|---|---|---|
| Core wedge | Full-suite spend control + compliance | Zip: intake front door. Levelpath: AI-native end-to-end | Easy PR→PO approval workflows | RFQ→quote comparison→PO for supplier-heavy SMBs |
| Time-to-value | 6–18 months, IT project | Zip <6 wks; Levelpath "weeks" | Precoro 2–8 wks; Procurify 6–12 wks | **Minutes to first RFQ (honest: no customers yet to prove it)** |
| Where AI removes real work vs cosmetic | Mostly cosmetic copilots on legacy UX | Levelpath: real (agents on workflows). Zip: AI on intake only | Largely non-AI; rule workflows | Real where built: RFQ draft, quote extraction, comparison rec, PO draft — all human-gated. **Gap: policy checking & exception routing were manual until this cycle** |
| Pricing & who it's for | $30k–$500k+/yr enterprise | Enterprise/upper-mid | ~$12k/yr (Precoro), mid-market | $99–$799/mo self-serve — a segment the others ignore |
| Adoption barrier they solved | CFO trust/compliance | Employee adoption (Zip); AI adoption (Levelpath) | No-training usability | Nothing proven yet — zero production users |
| Adoption barrier they still have | Rip-and-replace, supplier onboarding, cost | Not for SMB; enterprise sales motion | Supplier interaction weak; annual pricing; still weeks of onboarding | No integrations, no track record, unknown brand |

**Brutal honesty about "ProcureIQ today":** the AI loop spine (RFQ→ingest→compare→PO) is real,
tested, and human-gated — genuinely more than the RFQ micro-tools have. But: no ERP/accounting
integration, no invoice/AP layer, no supplier catalog, no customers, and until this build cycle the
`approvalThreshold` field existed but *nothing enforced it* — policy was aspirational. The
comparison table said "human-controlled" while every decision required full manual review, which
is the opposite of what makes Levelpath's numbers compelling (humans touch exceptions only).

## 3. The open gap (where we enter)

Every winner owns a step: Ariba owns the transaction network, Coupa owns spend compliance, Zip owns
intake, Levelpath owns enterprise AI sourcing, Precoro owns easy approvals. **Nobody owns the
quote decision for quote-based (non-catalog) SMB buying** — the 2–3 hours of re-typing three PDFs
into a spreadsheet, chasing an approver on Slack, then re-typing the winner into a PO. The micro
-tools digitize the form-filling but not the decision or the policy. That step is where ProcureIQ
already has working code and where no funded player is pointed.
