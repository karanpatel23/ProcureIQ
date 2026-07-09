# ProcureIQ — Differentiator Decision (DECIDE log)

_Last updated: 2026-07-09._

## The differentiator

**"Forward us the quotes; make the decision in one sitting."**
ProcureIQ turns the messiest step of SMB purchasing — three supplier quotes in three formats —
into a decision-ready, policy-checked comparison with a PO draft attached. Humans only get pulled
in for the exceptions; everything in policy is one click. Every number traces back to the source
quote.

### The one-sentence version a buyer repeats to a colleague
> "You just forward the supplier quotes in, and it hands you the comparison, tells you which ones
> break policy, and drafts the PO — I only look at the flagged stuff."

## Why this beats what the winners already do

- **Zip** owns *intake* (ask-to-buy). It routes and approves requests, but does nothing for
  deciding *between supplier quotes* — its own competitors attack it for having no sourcing layer.
- **Levelpath** sells AI-native procurement to enterprises with procurement ops teams. Its "humans
  touch exceptions only" outcome is the right north star — but it's priced, sold, and integrated
  for the Fortune 1000, not a 40-person manufacturer.
- **Precoro/Procurify** own easy approvals but are weak exactly where we're strong: supplier
  interaction (Precoro reviewers: suppliers lack accounts) and quote-based buying (they're PR/PO
  centric, not RFQ/quote centric).
- **RFQ micro-tools** (AuraVMS, Quotable) prove the pain (2–3 hrs/cycle re-typing quotes, 3–4 day
  cycles, 20–30 cycles/month) but stop at comparison — no policy layer, no exception routing, no
  PO, no audit trail.
- Nobody in the field can claim **"first decision-ready comparison in your first session."**

## Why it's easy to adopt (the switching-friction test)

- **Integration lift: zero on day one.** Suppliers keep replying by email/PDF — no supplier
  onboarding, no network to join (the #1 supplier-side complaint about Ariba/Tradeshift). PO
  exports as PDF/CSV/email into whatever ERP/accounting flow exists.
- **Training lift: near zero.** The mental model is the spreadsheet they already use — columns of
  quotes side by side — except pre-filled, normalized, and policy-checked.
- **Change-management lift: low.** It doesn't take anything away from finance or ops; it removes
  re-typing. The approver's job shrinks to reading named exceptions. Audit trail comes free
  (workflow runs already record every AI step + human decision), which is what makes approvers
  and finance *comfortable* saying yes.

## What "policy" means concretely (v1)

A workspace policy with opinionated defaults — not a workflow builder (Ivalua's configurability
trap). Checks, each producing a **named, human-readable exception**:
1. **Amount over approval threshold** (uses the workspace `approvalThreshold`).
2. **Winner isn't a preferred supplier** (new `preferred` flag on suppliers).
3. **Quote doesn't cover all RFQ items** (partial coverage risk).
4. **Winner's price is anomalous** (>25% below the median of competing quotes — too-good-to-be-true check).
5. **Lead time misses the RFQ need-by date.**
6. **Low-confidence extraction** (AI wasn't sure about the numbers — human must verify).

In policy → "ready to approve" one-click fast path. Out of policy → the approver sees only the
named exceptions, not a wall of data.

## Kill criterion (what would prove this wrong)

- Pilot users still export to Excel to re-check the comparison (= extraction/normalization trust
  failure), or
- Buyers consistently say quote comparison isn't the bottleneck (e.g., their pain is invoices/AP
  or catalog buying), or
- >50% of real comparisons flag exceptions on defaults (= policy noise, "exception-only" becomes
  "everything, always" and the claim dies).
Measure all three against the first 10 real workspaces.

## Anti-goals (explicitly rejected)

- "AI-native procurement platform" as the headline — Levelpath owns it, funded 100x deeper.
- An "AI copilot/chatbot" — every incumbent bolted one on; it demos well and removes no work.
- Catalog/punchout buying (Vroozi's sport), invoice/AP (Stampli's sport), supplier network
  (Ariba's sport) — different games; do not drift.
- A workflow builder — opinionated defaults win at our stage.
