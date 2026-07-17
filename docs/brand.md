# Corven — Brand Guidelines

_Corven is a product of Astron. Last updated: 2026-07-17._

## The name

**Corven** is a coined name. It is always written exactly as `Corven` in user-facing
copy — never "CorvenIQ", "Corven IQ", "CORVEN" (except in env-var identifiers), and
never with the legacy "ProcureIQ" name in any form.

The name should *feel* sharp, watchful, and precise. That association stays
implicit: no bird mascots, no feather motifs, no literal raven imagery anywhere in
product or marketing. The brand expresses intelligence through restraint —
typography, spacing, and motion — not through decoration.

### Technical naming conventions

| Context | Form | Example |
| --- | --- | --- |
| Display / user-facing | `Corven` | "Welcome to Corven" |
| Slugs, packages, repos | `corven` | `corven-web` |
| Env vars / constants | `CORVEN` | `CORVEN_DATA_PATH` |
| camelCase identifiers | `corven…` | `corvenClient` |
| PascalCase components | `Corven…` | `CorvenLogo` |
| Python snake_case | `corven…` | `corven_client` |
| Email addresses | `@corven.com` | `founders@corven.com` |
| PO numbers | `CRV-` prefix | `CRV-2026-0001` |

The site domain is `corven.com`, always referenced through `APP_URL` /
`NEXT_PUBLIC_SITE_URL` — never hardcoded.

## The mark

The icon (`public/icon.svg`) is a single open **C** arc with a still point inside
the aperture — the mark watches without depicting anything. It sits on the
near-black brand ground (`#0e1116`) with the steel gradient stroke.

- Minimum size: 24 px. Below that, use the plain wordmark.
- Do not rotate, outline, recolor, or add effects to the mark.
- The wordmark is the word **Corven** set in the product's display weight (800),
  tight tracking (−0.01 em to −0.02 em). No lockup separators, no taglines welded
  to the logo.

Email templates use a 34 px rounded square with a single "C" glyph as the
lightweight equivalent (see `src/lib/server/welcome-email.ts`).

## Color

Core palette (defined in `src/app/globals.css`):

| Token | Hex | Role |
| --- | --- | --- |
| `--bg-0` | `#0e1116` | Brand ground / darkest surface |
| `--bg-1` / `--bg-2` | `#12151b` / `#161a21` | Page and section surfaces |
| `--panel` / `--panel-2` | `#191d25` / `#1e232c` | Cards, raised surfaces |
| `--ink` | `#e9e6e7` | Primary text |
| `--ink-soft` / `--muted` | `#cfd3da` / `#9ba1ac` | Secondary text |
| `--accent` | `#6b7c98` | Steel — primary accent |
| `--accent-bright` | `#9db0cc` | Steel, lifted — hovers, gradient stop |
| `--mist` | `#b7c4d6` | Cool highlight |
| `--taupe` / `--warm` | `#ab978c` / `#c4b2a6` | Warm counterpoint, sparingly |
| `--danger` | `#d99f97` | Errors and destructive actions |

Brand gradient: `linear-gradient(150deg, #9db0cc, #6b7c98)` — reserved for the
mark and rare emphasis moments, never as a page background wash.

**Hard no:** purple/blue gradient mesh, glassmorphism card stacks, particle
fields, neon "AI glow". Corven's register is infrastructure-grade and calm.

## Voice

- **Plain and specific.** Say what the product does; quantify when honest.
- **Human-in-control.** Automation language always keeps the buyer as the
  decision-maker ("you approve", never "it decides for you").
- **No hype adjectives.** "AI-powered/revolutionary/magic" are banned. Outcomes
  over adjectives.
- **Watchful, not chatty.** Short sentences. Confidence through understatement.

## Legal / entity

Product: Corven. Parent and IP holder: Astron. Copyright lines read
"© Astron" or "Corven, an Astron product" as space allows.
