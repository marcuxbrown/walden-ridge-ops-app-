# Walden Ridge Operations App

Phase 0: Lead Call Intake → PDF

## Purpose
Stand up a lightweight internal workspace for Walden Ridge field teams to capture lead call data (Google Sheets) and generate brand-standard documents in real time from iPads (Google Drive).

## Architecture
1. `apps/web` – PWA (Next.js/React) for the Lead Call Intake workflow.
2. `services/docgen` – headless renderer that turns structured intake data into Markdown + WR-styled PDF via `pandoc --pdf-engine=weasyprint`.
3. `packages/schemas` – shared Zod/JSON schemas for the intake form + document metadata.
4. `packages/templates` – Markdown templates (Lead Call Intake Memo Worksheet, future site walk, proposal one-sheets).
5. `packages/wr-standards` – locked CSS, running header, embedded fonts, QA scripts ensuring hierarchy depth ≤ 3.
6. Google Sheets stores intake rows; Google Drive stores generated PDFs.

## Phase 0 Goals
- Online-only workflow that writes intake rows to Google Sheets (no login).
- Lead Call form with required/optional sections (contact, property, scope, procurement, risk).
- DocGen output: Markdown + WR-class worksheet PDF using locked CSS, failure on missing fonts or `####` headings.
- Signed URLs for document download.
- Enough instrumentation to support Phase 1 offline sync + photos.

## Next Steps
1. Review `docs/google-setup.md` and configure OAuth + Sheets + Drive.
2. Flesh out detailed architecture + requirements in `docs/phase0-architecture.md`.
3. Author the Lead Call Intake template under `packages/templates`.
4. Document QA expectations in `packages/wr-standards` (fonts, CSS, header, script).
5. Track chokepoints in `docs/chokepoints.md`.
6. Review Phase 1 offline capture in `docs/phase1-offline.md`.

## Deploy (Render + Vercel)

### 1) DocGen on Render (Docker)
This service needs `pandoc` + `weasyprint`, so we deploy via Docker.

1. Create a new Render Web Service from this repo.
2. Use the included `render.yaml` (blueprint) or set:
   - Root directory: repo root
   - Dockerfile: `services/docgen/Dockerfile`
3. Set env vars:
   - `GOOGLE_OAUTH_CLIENT_JSON`
   - `GOOGLE_OAUTH_TOKEN_JSON`
   - `GOOGLE_OAUTH_REDIRECT_URI`
   - `GOOGLE_DRIVE_FOLDER_ID`
   - `LOCAL_FONT_DIR=/app/packages/wr-standards/assets/fonts`
   - `WR_CSS_PATH=/app/packages/wr-standards/internal-pdf-style.css`

When deployed, copy the Render service URL (e.g., `https://wr-docgen.onrender.com`).

### 2) Web App on Vercel
Deploy `apps/web` as a Next.js app.

Env vars:
- `GOOGLE_OAUTH_CLIENT_JSON`
- `GOOGLE_OAUTH_TOKEN_JSON`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `GOOGLE_SHEET_ID`
- `GOOGLE_SHEET_NAME=Intakes`
- `GOOGLE_DRIVE_FOLDER_ID`
- `DOCGEN_URL=<Render URL>`
