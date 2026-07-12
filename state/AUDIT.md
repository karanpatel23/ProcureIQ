# ProcureIQ — Adversarial Audit

_Run: 2026-07-11, against main @ aebaf5c. Every finding verified by reading the code or
driving the product; file paths cited. Statuses updated as fixes land. Re-run after each
major cycle — new code breeds new flaws._

Severity: **CRITICAL** (loses deals / breaks trust) · **MAJOR** (daily pain) · **MINOR**
(small but visible) · **COSMETIC**.

---

## 1. Competitor-mindset findings

**C-1 · CRITICAL · "Upload a real PDF quote in the demo — watch it extract nothing."**
`storage.ts` line 15: for any non-`text/*` upload, `sourceText` becomes the literal string
`"Uploaded file: <name>"`. The extractor then "extracts" from that string — no totals, no
terms — while the upload UI happily accepts PDF/PNG/XLSX and the product's whole pitch is
AI quote extraction. Any rival running a bake-off uploads one real PDF and the flagship
claim dies on stage. *Why it lands: it's the first thing a real buyer will try.*
→ **FIXED this run:** non-text uploads are now stored honestly as attachments with
extraction explicitly skipped (clear "paste the text to extract" state, `extraction
status: failed`, confidence 0, autopilot auto-queues instead of trusting garbage), and the
upload UI says exactly what works today. Real PDF text extraction = named backlog item
(needs a PDF lib; flagged).

**C-2 · MAJOR · "Click Send RFQ — no email leaves, but the RFQ says 'sent'."**
`api/rfqs/[rfqId]/send/route.ts`: with no email provider configured, deliveries come back
`logged` and the route still flips the RFQ to `status: sent` ("Advance status only if at
least one recipient was reached (sent or logged)"). A buyer believes suppliers were
contacted; zero emails existed. *Why it lands: it's a lie the product tells by default.*
→ **FIXED this run:** status advances only on real `sent` deliveries; logged-only returns
an explicit "NOT emailed — email delivery isn't configured" message and leaves the RFQ in
draft (manual `mark-sent` stays available for people who email it themselves).

**C-3 · MAJOR · Demo-scale analytics.** `/app/analytics` is six counters. Procurify's
weakest area is *reporting*, and ours is thinner. OPEN (backlog: spend-over-time, supplier
concentration, cycle-time from existing audit timestamps — data already exists).

**C-4 · MAJOR · No supplier import.** Onboarding 30 suppliers = 30 form submissions.
Procurify demos a CSV import in minute one. OPEN (backlog: CSV import endpoint + UI).

**C-5 · MINOR · Billing is décor.** Pricing page sells three tiers; the app enforces
nothing and collects nothing. Fine pre-revenue, but a prospect asking "what happens after
the trial?" gets no answer. OPEN (deliberate until Stripe lands).

---

## 2. Backend-expert findings

**B-1 · CRITICAL · Every tenant lives in one database row.**
`db.ts`: the entire universe — all workspaces, users, quotes, POs — is a single
`procureiq_state` jsonb row (`STATE_ID = 1`). Consequences, in order of pain: (a) every
mutation takes a global `FOR UPDATE` lock — *all customers' writes serialize behind each
other*; (b) every read loads every tenant's data into memory; (c) tenant isolation is
purely application-level `.filter(workspaceId)` — one missed filter is a cross-tenant
leak; (d) row size grows unboundedly. Works at demo scale; dies at ~dozens of active
workspaces. *This is the finding a competitor's sales engineer would lead with if they
ever saw the schema.*
→ **FIXED (follow-up cycle, 2026-07-12):** storage is now sharded — `procureiq_global`
(users/sessions/oauth/leads) + one `procureiq_ws` row PER workspace. Workspace mutations
lock only their own row (verified: 24 interleaved cross-tenant writes, zero lost updates),
hot reads load one tenant, membership lookups use a GIN-indexed containment query, and
tenant separation is physical rows. Legacy single-row data migrates automatically on first
boot (old row kept as backup). Rare cross-cutting flows (signup linking, account deletion,
admin) keep all-row locking for correctness. Next step when volume demands: normalize hot
entities out of jsonb.

**B-2 · CRITICAL · Unlimited password brute force.**
`api/auth/login/route.ts`: no throttling, no lockout, no delay — an attacker can hammer
credentials as fast as Vercel scales. With self-serve signup, emails are guessable.
→ **FIXED this run:** DB-backed failed-attempt counter on the user record; 8 straight
failures locks login for 15 minutes (survives serverless multi-instance because state
lives in the DB, not process memory); counter resets on success; lockout responses don't
reveal whether the password was otherwise right.

**B-3 · MAJOR · Multi-currency comparison compares raw numbers.**
`comparison.ts`: a €18,000 quote "beats" a $18,400 quote — currencies are never compared.
Quotes carry a `currency` field that comparison ignores entirely. A wrong award justified
by a currency mixup is a real financial error, exactly the class this domain punishes.
→ **FIXED this run:** comparison now flags any quote whose currency differs from the
group's dominant currency as a high-severity `currency_mismatch` risk → forces
`needsReview`, blocks autopilot auto-selection, and shows on the risk board.

**B-4 · MAJOR · PO numbers can collide and don't sequence.**
`po.ts`: `poNumber = PIQ-<year>-<Date.now().slice(-6)>` — two POs in the same millisecond
collide; numbers are meaningless noise; finance teams expect sequential references.
→ **FIXED this run:** per-workspace sequential numbering (`PIQ-2026-0001`, `-0002`…)
computed inside the transaction, collision-checked.

**B-5 · MAJOR · Duplicate vendors are one typo away.**
`api/suppliers/route.ts` POST: no name check — "Acme Metals" can exist five times.
Duplicate vendor masters are the classic AP-fraud and double-payment vector auditors look
for first.
→ **FIXED this run:** case-insensitive name-match on active suppliers returns 409 with a
clear message.

**B-6 · MAJOR · Invited-member auto-join trusts an unverified email.**
`signup/route.ts` + oauth callback: any signup whose email matches a pending invite joins
the workspace instantly. When no email provider is configured (verification off), knowing
an invited address is enough to enter someone's workspace. OPEN — fix design: hold
signup-linked members in `invited-pending` until an admin confirms, or require
verification for invite-linking regardless of provider. Needs a small UI addition;
scheduled next pass. (Mitigating today: attacker must know the exact invited email;
Resend-configured deployments already force verification.)

**B-7 · MINOR · Uploaded files are write-only and die with the container.**
`storage.ts` writes to `/tmp`; nothing ever reads `storageKey` back; on serverless the
file is gone at the next cold start. Harmless today only because `sourceText` in the DB is
canonical and no download link exists — but "we preserve the original source" (quote-add
page copy) overstates. → Copy softened this run; real object storage = backlog.

**B-8 · MINOR · No idempotency keys on POST APIs.** Double-click = duplicate RFQ/quote
(supplier dupes now blocked; PO already deduped by rfq+quote). UI disables buttons during
submit, which masks most of it. OPEN.

---

## 3. UI/UX-expert findings

**U-1 · MAJOR · Currency displays hardcode "$" while the product claims multi-currency.**
`compare/page.tsx` `money()` and the PO list prefix `$` regardless of the workspace or
quote currency — a EUR workspace sees dollar signs on its own quotes, on the same screen
where we now flag currency mismatches. → **FIXED this run:** compare page and PO list
format with the actual currency.

**U-2 · MAJOR · Quote review is the information-hierarchy weak point.** The approver's
decision data (line items vs RFQ items, source excerpt) is present but the compare page
buries "pending reviews" as a text count in the header with no link — you must know to go
find them. OPEN (cheap fix queued: make the pending-review count a link to the first
pending quote).

**U-3 · MINOR · Sidebar terminology drift.** "Workspace dashboard" (dashboard eyebrow) vs
"Company settings" vs "Team access for {workspace}" — workspace and company are used
interchangeably for the same object. Pick one ("workspace" in-app, "company" only in
onboarding). OPEN, sweep scheduled.

**U-4 · MINOR · Upload form promised more than extraction delivers** ("ProcureIQ will…
extract draft quote fields" over a PDF picker). → **FIXED this run** alongside C-1: the
form now states plainly that pasted text extracts today and files are stored as
attachments.

**U-5 · MINOR · Mobile app-shell is functional, not designed.** At ≤1100px the sidebar
becomes a 2-column link grid above content (`globals.css` @1100) — usable, but tables
(compare, activity) scroll awkwardly and the intake panel textarea crowds. OPEN (mobile
pass is already backlog item Q).

**U-6 · COSMETIC · Empty states are plain sentences** (PO list, quotes) while suppliers
got a designed `.empty-state`. Inconsistent polish. OPEN.

**U-7 · COSMETIC · Activity timestamps use `toLocaleString()`** with no timezone hint —
fine for one user, ambiguous for teams across zones. OPEN.

---

## 4. Prioritized fix list (status live)

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | C-1/U-4 PDF upload extracts nothing while UI implies it does | CRITICAL | **FIXED** |
| 2 | B-2 no login throttling | CRITICAL | **FIXED** |
| 3 | B-1 single-row multi-tenant store | CRITICAL | **FIXED** — sharded per-workspace storage |
| 4 | C-2 RFQ marked "sent" on zero deliveries | MAJOR | **FIXED** |
| 5 | B-3 cross-currency comparison unchecked | MAJOR | **FIXED** |
| 6 | B-5 duplicate suppliers allowed | MAJOR | **FIXED** |
| 7 | B-4 PO number collisions | MAJOR | **FIXED** |
| 8 | U-1 hardcoded "$" everywhere | MAJOR | **FIXED** |
| 9 | B-6 invite-join without verification | MAJOR | OPEN — next pass (design chosen) |
| 10 | C-3 analytics depth · C-4 supplier CSV import | MAJOR | OPEN — backlog |
| 11 | U-2 pending-reviews not linked | MAJOR | OPEN — cheap, next pass |
| 12 | B-7 write-only /tmp files · B-8 idempotency · U-3 terms · U-5 mobile · U-6 empty states · U-7 timestamps | MINOR/COSMETIC | OPEN — swept opportunistically |
