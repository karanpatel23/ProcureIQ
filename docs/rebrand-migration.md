# ProcureIQ → Corven — Migration Runbook

_Last updated: 2026-07-17. Code-side rename lives on branch `rebrand/corven`.
This document covers everything the code cannot change by itself: live
infrastructure, third-party consoles, rollback, and customer communication._

## 1. What the code rename did (and deliberately did not do)

### Renamed in code

- All user-facing brand strings, page copy, SEO metadata, PWA manifest, OG
  image, emails, PDF export → **Corven**.
- Domains `procureiqs.com` / `procureiq.ai` → `corven.com` (always via
  `APP_URL`; no hardcoded domains).
- Env var **`PROCUREIQ_DATA_PATH` → `CORVEN_DATA_PATH`** (default path
  `/tmp/corven-data.json`). Every read site updated (`env.ts`, `db.ts`, tests,
  `scripts/smoke-check.mjs`, `.env.example`).
- New purchase orders are numbered **`CRV-<year>-…`**. Existing `PIQ-` numbers
  are historical records and are never rewritten.
- Brand assets: new Corven "C" mark (`public/icon.svg`), email/OG monograms.

### Deliberately NOT renamed (breaking-change quarantine)

| Identifier | Why it stays | Future path |
| --- | --- | --- |
| Postgres tables `procureiq_global`, `procureiq_ws`, `procureiq_state` | Renaming live tables risks data loss and requires coordinated deploy + migration | Optional: `ALTER TABLE … RENAME` in a maintenance window, or leave permanently (internal-only) |
| Session cookie `procureiq_session` | Renaming logs out every active user | Dual-read rename (accept old, issue new) in a follow-up release at cutover |
| OAuth state cookie `procureiq_oauth_state` | Same as above; also mid-flight OAuth logins would break | Same dual-read pattern |
| `state/*.md` research logs | Historical record; rewriting history is banned | Leave as-is |
| "procure.ai", "procurement", "Procurify" | Domain vocabulary / competitor names, not our brand | Leave as-is |

## 2. Third-party & infrastructure checklist (manual, in order)

Nothing below happens automatically. Suggested order minimizes user-visible
breakage.

### Before DNS cutover

- [ ] **Register / confirm ownership of `corven.com`** (and set up
      `noreply@corven.com`, `founders@corven.com` mailboxes or forwards).
      _Code assumes this domain; nothing ships until it's real._
- [ ] **Resend**: add and verify the `corven.com` sender domain (SPF, DKIM,
      DMARC). Keep the old sender verified until cutover completes.
- [ ] **Vercel** (project `procure-iq-fawn`):
  - [ ] Add `corven.com` (+ `www`) as domains.
  - [ ] Rename env var `PROCUREIQ_DATA_PATH` → `CORVEN_DATA_PATH` in ALL
        environments (production/preview/development). **Secrets do not
        auto-migrate; the app falls back to the default path if the old name
        is left in place.**
  - [ ] Update `APP_URL` to `https://corven.com`.
  - [ ] Update `EMAIL_FROM` to `Corven <noreply@corven.com>`.
  - [ ] Update `INTERNAL_ADMIN_EMAILS` to the corven.com addresses.
  - [ ] Optionally rename the Vercel project (`procure-iq-fawn` → `corven`);
        cosmetic, changes preview URLs only.
- [ ] **Google OAuth console**: add redirect URI
      `https://corven.com/api/auth/oauth/google/callback`; update app name,
      logo, homepage, and privacy/terms URLs on the consent screen (may
      trigger re-verification review — start early).
- [ ] **Microsoft Entra app registration**: add redirect URI
      `https://corven.com/api/auth/oauth/microsoft/callback`; update display
      name and branding.
- [ ] **Stripe** (when billing goes live): update account/public business name
      and statement descriptor to CORVEN.

### Cutover

- [ ] Point `corven.com` DNS at Vercel; confirm TLS issues cleanly.
- [ ] Deploy the `rebrand/corven` branch.
- [ ] Set `procureiqs.com` to **301-redirect** to `corven.com` (Vercel domain
      redirect). Keep this redirect indefinitely — inbound links, bookmarks,
      and email footers reference it.
- [ ] Send test signup + RFQ email; confirm sender shows Corven and links
      resolve to corven.com.

### After cutover

- [ ] **Google Search Console**: add the `corven.com` property, set
      `GOOGLE_SITE_VERIFICATION` for the new domain, submit the sitemap, and
      use the **Change of Address** tool on the old property.
- [ ] Update any social profiles / directories, then populate
      `socialProfiles` in `src/lib/seo.ts`.
- [ ] Keep old OAuth redirect URIs and the old Resend sender for ~30 days,
      then remove.
- [ ] Follow-up release: dual-read cookie rename
      (`procureiq_session` → `corven_session`), then remove old-name reads a
      release later.
- [ ] GitHub repo rename (`ProcureIQ` → `corven`) if desired — GitHub
      auto-redirects old remotes, so this is low-risk cosmetic.

## 3. Rollback plan

The rename is copy/config-level; rollback is cheap at every stage.

1. **Before DNS cutover:** simply don't deploy the branch. Nothing user-visible
   changed.
2. **After deploy, before DNS:** redeploy `main`. Restore the
   `PROCUREIQ_DATA_PATH` env var name if it was already renamed (or leave both
   set — unknown vars are ignored).
3. **After DNS cutover:** re-point `APP_URL` to `https://procureiqs.com`,
   redeploy `main`, and drop the 301 redirect. OAuth and email keep working
   throughout because old URIs/senders are retained for 30 days (see above).
4. **Data:** no rollback needed ever — tables, cookies, and stored PO numbers
   were never renamed. `CRV-` POs created during the window remain valid
   records alongside `PIQ-` ones.

## 4. Customer communication

Timing: announce on cutover day, after the redirect is verified.

**Email (from the founder, plain text):**

> Subject: ProcureIQ is now Corven
>
> Hi {first name},
>
> Quick heads-up: ProcureIQ has a new name — **Corven**. Same product, same
> team, same focus on getting you from supplier quotes to a defensible
> decision.
>
> What changes for you: the app now lives at corven.com (your old links
> redirect automatically), and our emails come from @corven.com — please add
> it to your safe senders. What doesn't change: your login, your data, your
> suppliers' email replies, your pricing. New purchase orders will be numbered
> CRV- instead of PIQ-; existing POs keep their numbers.
>
> If anything looks off, reply to this email — it reaches me directly.
>
> Karan Patel
> Founder, Corven

**In-app notice:** one dismissible banner for 30 days — "ProcureIQ is now
Corven. New name, same product — your data and logins are unchanged."

**Website:** FAQ entry "Is Corven the same company as ProcureIQ?" (yes —
renamed {month year}; a product of Astron).

## 5. Env var rename ledger (for the final report)

| Old | New | Where |
| --- | --- | --- |
| `PROCUREIQ_DATA_PATH` | `CORVEN_DATA_PATH` | `.env.example`, `src/lib/server/env.ts`, `src/lib/server/db.ts`, `src/lib/server/db.test.ts`, `scripts/smoke-check.mjs`, Vercel env (manual) |

No other `PROCUREIQ_*` env vars existed.
