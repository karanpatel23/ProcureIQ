# ProcureIQ — Build Plan (PLAN log)

_Last updated: 2026-07-09. Each item ties to DECISIONS.md ("one sitting, exceptions only") or
COMPETITIVE.md gaps. Status: SHIPPED / IN PROGRESS / OPEN._

## This cycle (make the differentiator real & demoable)

| # | Change | Why (ties to) | Effort | Status |
|---|---|---|---|---|
| 1 | **Policy engine** (`policy.ts`): 6 named checks — over-threshold, non-preferred supplier, partial item coverage, too-good-to-be-true price, misses need-by date, low extraction confidence. Pure + unit-tested. | The differentiator's core claim: "tells you which ones break policy." Until now `approvalThreshold` existed but nothing enforced it. | S | SHIPPED |
| 2 | **`preferred` flag on suppliers** (schema + form + list badge). | Policy check #2; procurement teams' real rule ("use approved vendors"). Skipped when no supplier is marked preferred → no policy noise (kill criterion 3). | S | SHIPPED |
| 3 | **Wire policy into the quote-comparison flow**: compare page shows "In policy — ready to approve" or the named exceptions; comparison-loop run records policy status in state + audit. | Turns full-review into exception-review — the adoption unlock Levelpath proved at enterprise, applied to SMB. | M | SHIPPED |
| 4 | **Decision queue on dashboard**: awaiting-approval runs split into "in policy" vs "needs your judgment". | "Humans only touch exceptions" must be visible the moment you log in. | S | SHIPPED |
| 5 | Update marketing (platform/FAQ) to state the differentiator sentence. | Code first, then claim it. | S | OPEN — do after 1–4 verified |

## Next cycles (ordered by manual-work-removed per engineering effort)

| # | Change | Why | Effort |
|---|---|---|---|
| 6 | **Email-in quote intake** (forward supplier reply → quote created + extraction run). "Forward us the quotes" is currently upload-based; email-in makes the sentence literally true. | Differentiator sentence, word one. | L |
| 7 | Policy exceptions carried into PO loop open items (threshold re-check at PO stage). | Policy continuity to the last gate. | S |
| 8 | Auto-run comparison loop when the last invited supplier's quote turns ready. | Removes "remember to click compare" — one less manual step. | M |
| 9 | Decision brief: 5-line AI summary (why winner, deltas, policy status) atop compare page, exportable for the approval email thread. | Approver reads 5 lines, not a matrix. | M |
| 10 | Supplier scorecards from history (on-time, price drift) feeding comparison score. | Deepens moat: decisions get better with use. | L |

## Flag-to-Karan list (needs his action or sign-off)
- Any public claim of customer counts/cycle-time numbers — we have none yet; marketing must stay
  claim-honest (current copy is).
- Resend config still pending → welcome/reset/RFQ emails log-only in prod until set.
- Email-in intake (#6) needs an inbound-email provider decision (Resend inbound / Postmark) = spend.

---

# Cycle 2 — AI Does The Work (2026-07-10)

| # | Change | Status |
|---|---|---|
| A | Workspace `autopilot` mode ('off' default / 'exceptions_only') + Company settings toggle | SHIPPED |
| B | Autopilot chain (`autopilot.ts`): quote self-verify → auto-accept → all-answered comparison + policy → auto-select winner → PO draft + reconcile; halts become named queued exceptions; every action = workflow run + audit event | SHIPPED |
| C | Wired into quote upload and quote review routes (human clearing an exception resumes the chain) | SHIPPED |
| D | Autonomous intake: free-text/email → parsed items/date/location → supplier matching → RFQ created (`/api/intake` + RFQs-page panel + parser tests) | SHIPPED |
| E | Dashboard "Autopilot actions" counter (audit-backed) | SHIPPED |
| F | AI_AUTOMATION.md full 14-step map with honest statuses + extraction-layer design | SHIPPED |
| G | Inbound email intake (quotes forwarded to an address) | OPEN — needs inbound provider (spend, Karan) |
| H | QuickBooks connector (accounting.ts abstraction, OAuth) | OPEN — needs Intuit app registration (Karan) |
| I | Negotiation: AI-drafted counter-offers from quote deltas | OPEN — next build cycle |
| J | Receiving + invoice entities → 3-way match | OPEN — after real PO usage |

---

# Cycle 3 — Beat procure.ai + Procurify (2026-07-11)

| # | Change | Counters | Status |
|---|---|---|---|
| K | Activity feed (/app/activity): human-readable, filtered log of every AI + human action with entity links; sidebar nav | procure.ai black-box agents; Procurify post-hoc reports | SHIPPED |
| L | Decision brief on compare page: 5 plain-language lines (winner, price context, terms, policy verdict, next step) + one-click copy for the approval thread | Procurify reporting complaints; procure.ai analyst-speak | SHIPPED |
| M | Negotiation assist: AI-drafted counter-offer email built from real quote deltas (named leverage), human-gated copy/send | procure.ai "autonomous negotiations" flagship | SHIPPED |
| N | FAQ updated with the auditable-autonomy USP | positioning | SHIPPED |
| O | QuickBooks/NetSuite connector | Procurify's integration moat | OPEN — Intuit app reg (Karan) |
| P | Receiving + invoice + 3-way match entities | Procurify AP depth | OPEN — after real PO usage |
| Q | Mobile-first pass on core app screens | Procurify mobile praise | OPEN |

---

# Cycle 5 — Phase-1 completion vs Procure.ai wedge (2026-07-12)

| # | Change | Status |
|---|---|---|
| R | Claude API provider (AI_PROVIDER=anthropic): extraction + intake via Claude, zod-validated, deterministic local fallback on any failure, raw responses audited | SHIPPED — needs ANTHROPIC_API_KEY in Vercel (Karan) |
| S | Supplier CSV / QuickBooks-vendor-export import (row-level results, dedupe, preferred mapping) + suppliers-page UI | SHIPPED |
| T | Supplier memory: explainable reliability score + last-paid prices + avg lead, surfaced on compare page | SHIPPED |
| U | Exception-first dashboard: zero-value cards hidden | SHIPPED |
| V | Forwarded-email inbox ingestion | OPEN — inbound provider decision (Karan, spend) |
| W | QuickBooks two-way sync | OPEN — Intuit app registration (Karan) |
