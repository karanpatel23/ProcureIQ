# ProcureIQ — AI Does The Work (automation map)

_Last updated: 2026-07-10. Status legend: **AUTONOMOUS** (shipped, runs with no human),
**EXCEPTION-GATED** (shipped; AI executes unless a named check fails), **HUMAN-GATED**
(shipped; AI does everything up to one confirming click — reason in state/DECISIONS.md),
**NOT BUILT** (honest gap with the specific blocker named)._

Autopilot is a per-workspace setting (`Company settings → Autopilot`): `off` (legacy,
every step waits) or `exceptions_only` (the chain below runs itself). Every autonomous
action is persisted as a workflow run and an audit event — the trail shows what the AI
did, why, and what it refused to do.

## 1. The workflow, step by step

| # | Step | Status | What AI does today | Trigger → Output |
|---|---|---|---|---|
| 1 | **Intake** | **AUTONOMOUS** | Parses a pasted email/chat/sentence into items+quantities+units, need-by date, delivery location; matches suppliers from the directory by category/typical items; creates the RFQ with an email draft. Gaps are *named*, never guessed. | Paste text → RFQ exists with line items and matched suppliers (`POST /api/intake`). |
| 2 | **Requisition creation** | **AUTONOMOUS** | Same act as intake — the requisition *is* the structured RFQ the parser builds; the RFQ Builder Loop then self-reviews and improves it (titles, unit normalization, missing-field detection). | Intake → structured, self-reviewed requisition. |
| 3 | **Approval routing** | **EXCEPTION-GATED** | The policy engine routes: in-policy work approves itself (threshold, preferred supplier, coverage, need-by, price sanity, confidence); only exceptions reach a human, with the reason named. No manual "pick an approver" step exists. | Quote/decision event → auto-approved or a named exception in the decision queue. |
| 4 | **Sourcing — RFQ send** | **HUMAN-GATED** | AI writes the full RFQ email and recipient list; a person presses send. (Outward supplier contact — see DECISIONS.md.) | RFQ ready → drafted email, one-click send. |
| 5 | **Sourcing — quote ingestion** | **EXCEPTION-GATED** | Each arriving quote (paste/upload) is extracted field-by-field with confidence, self-verified by the ingestion loop (totals reconcile, validity, coverage), and **auto-accepted** when clean. Only low-confidence/inconsistent quotes queue for a human glance. | Quote lands → accepted quote with line items, or a named hold. |
| 6 | **Sourcing — evaluation & supplier selection** | **EXCEPTION-GATED** | When every invited supplier has answered, AI compares price/lead/terms/completeness/risk, checks policy, and **selects the winner itself** when in policy — recording why. Exceptions stop it. | Last quote accepted → winner selected, RFQ approved, decision note written. |
| 7 | **Negotiation** | **NOT BUILT** | Nothing autonomous to claim yet. Next honest step: AI-drafted counter-offer emails from quote deltas ("competitor is 12% lower on the same spec") for one-click send. Blocked on: outward supplier contact policy + no counter-offer entity yet. | — |
| 8 | **Contracting** | **NOT BUILT** | No contract entity exists in the product. AI redline against standard terms requires a terms library and document diffing; signing is legally human regardless (DECISIONS.md). | — |
| 9 | **PO issuance — drafting** | **AUTONOMOUS** (after #6) | AI turns the winning quote into a full PO draft (lines, totals, terms, references) and the PO loop reconciles it against the approved quote and RFQ — arithmetic, coverage, drift. | Winner selected → reconciled PO draft, "ready for send gate". |
| 10 | **PO issuance — sending** | **HUMAN-GATED** | AI prepares everything; a person makes the single send/approve click. (Money commitment to an external party — DECISIONS.md.) | PO ready → one-click approve/send/export (PDF/CSV/email). |
| 11 | **Receiving & invoice matching** | **NOT BUILT** | No receiving or invoice entities yet. The extraction layer (below) is invoice-ready — same field/confidence contract — but 3-way match needs receipts to exist first. | — |
| 12 | **Payment** | **NOT BUILT** (and will stay human-triggered) | Releasing funds is a financial-control boundary (DECISIONS.md). When built: AI schedules per terms, human releases. | — |
| 13 | **Supplier risk & compliance monitoring** | **PARTIAL** | Continuous *internal* signals ship: expired-quote detection, price-variance flags, preferred-supplier drift, low-confidence history — surfaced at decision time where they change outcomes. External feeds (sanctions, credit) NOT BUILT — needs a data provider (spend). | Signals appear on comparisons automatically. |
| 14 | **Spend analysis & reporting** | **PARTIAL** | Analytics page aggregates spend by supplier/RFQ automatically; the too-good-to-be-true and variance checks are anomaly detection applied where it matters (pre-decision, not post-hoc dashboards). Savings-opportunity mining NOT BUILT — needs more transaction history to be honest. | — |

## 2. Data extraction layer (what feeds everything)

**Shipped — email/document text:** `quote-extraction.ts` + intake parser. Field-level
extraction with per-field confidence and source excerpts; totals cross-checked against
line items; low-confidence is a *named, targeted* exception (the one legitimate human
glance), not a habitual review step. Deterministic today, LLM-ready by contract
(`AI_PROVIDER` switch exists; local extractor is the honest default).

**Shipped — universal interchange:** PO export as CSV/PDF (`/api/po-drafts/[poId]/export-*`)
— the format every ERP and QuickBooks imports. This is the honest v1 of "push back."

**NOT BUILT — live connectors (named blockers, not vaporware):**
- **QuickBooks** (pull vendors/bills/payment status, push bills): requires an Intuit
  developer app + OAuth + per-customer consent. Design: same provider pattern as
  email.ts — `accounting.ts` abstraction, `QUICKBOOKS_*` env, honest `not_connected`
  state. **Blocked on: Intuit app registration (Karan action, free) + a real account to test against.**
- **ERPs (NetSuite/SAP/Dynamics/Oracle)**: each needs credentials and a sandbox we
  don't have. Same abstraction; CSV in/out is the bridge until then.
- **Inbound email (quotes forwarded straight in)**: extraction is ready for it; needs an
  inbound-email provider (Resend Inbound/Postmark) = spend + domain MX setup (Karan).

Two-way-sync rule when connectors land: ProcureIQ never silently overwrites the system
of record — it pushes with a reference id and reads back state, and conflicts surface as
exceptions like everything else.

## 3. What "the human's job" is now

With autopilot on, the job is: read the decision queue (exceptions with named reasons),
clear them, and press the send gate on POs. Everything else — parsing requests, building
RFQs, verifying quotes, comparing, selecting, drafting POs, writing the audit trail —
happens without them. With autopilot off, every one of those steps still works as
one-click human-approved (legacy mode, the default).
