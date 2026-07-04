# ProcureIQ deployment checklist

ProcureIQ is a Next.js App Router application with a local JSON adapter for early development and SQL migrations prepared for a managed database rollout.

## 1. Preflight quality gates

Run these before every public demo or pilot deploy:

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run build
npm run smoke
```

The smoke script is a static checklist for route, environment, and copy readiness. It does not replace browser QA.

## 2. Required environment variables

Set these on Vercel, Render, Railway, or your server runtime:

- `AUTH_SECRET`: at least 32 random characters. Never use the development fallback in production.
- `DATABASE_URL`: production database connection string when the Postgres adapter is enabled.
- `PROCUREIQ_DATA_PATH`: local JSON adapter path for development or single-instance demos.
- `QUOTE_STORAGE_PATH`: private server-side storage path for uploaded quote sources.
- `MAX_UPLOAD_BYTES`: maximum quote upload size. Default is `10000000`.
- `ALLOWED_UPLOAD_MIME_TYPES`: comma-separated safe upload MIME types.
- `INTERNAL_ADMIN_EMAILS`: comma-separated allowlist for `/admin` and internal admin APIs.
- `BILLING_PROVIDER`: `none` until checkout is implemented; `stripe` when Stripe keys are configured.
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`: only set when billing is enabled.
- `AI_PROVIDER`: `local` for deterministic extraction, or `openai` after provider integration is configured.
- `OPENAI_API_KEY`: required only when `AI_PROVIDER=openai`.

No `NEXT_PUBLIC_` secret variables are required.

## 3. Build and start commands

- Install: `npm install`
- Build: `npm run build`
- Start on Vercel: use the Next.js preset.
- Start on Render/Railway: build with `npm run build`, then run `next start` after adding a start script when needed.

## 4. Database migration instructions

Apply migrations in order from `db/migrations/001_initial_schema.sql` through the latest file. The current JSON adapter mirrors these tables for development, but production pilots should use a managed database before multiple app instances are deployed.

## 5. Storage setup

Quote uploads must be stored in private server-side storage. For local demos, set `QUOTE_STORAGE_PATH` to a private directory. For production, wire this abstraction to private object storage and keep original quote documents scoped by workspace.

## 6. AI provider setup

The current extractor is deterministic and local. When enabling a hosted AI provider, keep strict JSON parsing, field-level confidence, source traceability, raw-response safety controls, and human review before approval.

## 7. Security checklist

- Confirm `/app`, `/admin`, and protected APIs require authentication.
- Confirm sensitive mutations require owner/admin/member role checks as appropriate.
- Confirm every data lookup includes `workspaceId` scoping.
- Confirm upload MIME type and size policies match the deployment environment.
- Confirm API errors do not expose stack traces to users.
- Confirm audit logs are written for supplier, RFQ, quote, comparison, PO, billing/settings, and export events.

## 8. Core workflow smoke test

Use a fresh account and verify:

1. Signup.
2. Onboarding creates a workspace.
3. Create a supplier.
4. Create an RFQ with at least one line item.
5. Add a supplier quote by paste or upload.
6. Review extraction and approve the quote.
7. Compare quotes and select a supplier.
8. Create a PO draft.
9. Edit, approve, and export CSV/PDF.
10. Confirm analytics and supplier memory update from real workspace data.
