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

---

# Human-required boundaries (AI Does The Work cycle, 2026-07-10)

Kept deliberately short. Each entry names the specific legal/financial-control reason —
"to be safe" is not on this list. AI pushes to the edge of each boundary: it drafts the
final artifact, verifies it's ready, and leaves exactly one confirming action.

| Step | Why a human, exactly | AI's role right up to the edge |
|---|---|---|
| **Sending an RFQ or PO to a supplier** | Outward contact that commits the company commercially to an external party; a wrong send is unrecallable and legally attributable. Also explicitly flagged as requiring Karan's sign-off for real-transaction use. | Email fully drafted, recipients resolved, PO reconciled against the approved quote; one click sends. |
| **Releasing payment** (when built) | Financial control: disbursing funds requires an authorized approver under any audit regime (SOX-style segregation of duties). | AI will schedule per terms, 3-way-match, and queue the release; human releases. |
| **Signing a contract** (when built) | A binding signature must come from a legally authorized person; AI cannot substitute. | AI drafts/redlines against standard terms and declares readiness; human signs. |
| **Turning autopilot on** | Consent: the workspace owner decides AI executes on their behalf. Off by default; one setting, not a review process. | Everything after the toggle. |

Explicitly NOT on this list (automated once policy passes): quote acceptance, supplier
selection, PO drafting, approval routing, requisition creation, intake. Prior product
copy said "a human approves every decision" — that is now workspace policy (`autopilot:
off`), not an architectural constraint. Marketing must describe both modes honestly.

---

# USP vs procure.ai / Procurify (benchmark cycle, 2026-07-11)

## The resolved tension
procure.ai = autonomy without adoptability (enterprise, opaque agents, contact-sales).
Procurify = adoptability without autonomy (great forms, humans still do the work).
ProcureIQ takes the unoccupied square: **auditable autonomy at self-serve speed.**

## The USP, in the buyer's words
> "It actually does the buying work like the enterprise agent platforms — but I can see the
> reason for every action it took, it's bounded by my own policy, and I had it running the
> afternoon I signed up, for $99."

Three legs, each verifiable in-product, none an adjective:
1. **It executes** — intake→verify→compare→select→PO runs itself in policy (autopilot, shipped).
2. **It shows its work** — every AI action is a persisted run + audit event with named policy
   checks; the new Activity feed makes the glass box a first-class screen. procure.ai cannot show
   this publicly; Procurify has nothing to show.
3. **It's adoptable in an afternoon** — self-serve, public pricing, suppliers stay on email,
   PO exports to CSV for any accounting system.

## AI-integration approach (vs their approaches)
- procure.ai's "autonomous negotiation" → ours: **negotiation drafts computed from real quote
  deltas** (the leverage is named: "competitor is $X / N days better"), human-gated send. Honest
  version of their flagship at 1/100th the price point.
- Procurify's "reporting" complaints → ours: **decision brief** — five plain-language lines that
  answer "what should I do and why," copyable into the approval email thread.
- Both cycles' rule stands: deterministic + explainable first, LLM-swappable by contract.

## Kill criterion
If pilot buyers say the Activity feed and briefs don't increase their willingness to enable
autopilot (i.e., transparency doesn't convert to trust), the "auditable" leg is decoration and
the USP collapses to price — rethink.
