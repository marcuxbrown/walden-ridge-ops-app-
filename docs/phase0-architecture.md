# Phase 0 Architecture — Lead Call Intake + PDF Output

## Summary
Phase 0 delivers an online-only, iPad-friendly workflow where field users capture a structured lead call intake (no login), store rows in Google Sheets, and instantly generate a Walden Ridge worksheet-style PDF through a dedicated DocGen service.

### Key constraints
- Online-only (no offline caches yet)
- Google Sheets storage (OAuth) + no-login flow
- PDF generation enforces WR standard (locked CSS, fonts, hierarchy depth <= 3)
- Target devices: iPads and mobile browsers

## Component Overview

1. **Web App (apps/web)**
   - Framework: Next.js (or Vite/React if preferred) PWA with React Hook Form + Zod
   - Touch-first UI: large inputs, accordion sections, progress indicator
   - Sections: Opportunity stub, contact info, scope buckets, procurement boundaries, risks, next steps
   - Actions: Save intake, preview, request document generation, view previous docs
   - Google Sheets API: write intake rows via service account credentials

2. **DocGen Service (services/docgen)**
   - Receives structured intake payload + template id + WR class
   - Injects data into Markdown template (packages/templates) via Liquid/Nunjucks
   - Runs QA gates: fonts exist, no `####`, metadata block present
   - Exports Markdown + PDF (pandoc + weasyprint + packages/wr-standards CSS)
   - Uploads outputs to Google Drive (shared folder)

3. **Shared Schemas (packages/schemas)**
   - Zod schema for intake fields (required/optional, enums for occupancy, procurement, scope)
   - Schema for document metadata (source/as_of/units/timeframe, wr_class)
   - Validation helpers for multi-persona checklists (future)

4. **Templates & Standards**
   - `packages/templates/lead-call-intake-worksheet.md`: MD template with placeholders for each field
   - `packages/wr-standards/internal-pdf-style.css`: locked typography, tables, hierarchy
   - Running header partial + IBMPlex font bundle (or fallback to storing in project + referencing relative paths)

## Data Model (Google Sheets)
- Sheet `Intakes` with a header row including `intake_id`, `created_at`, opportunity fields, contact fields, and `payload_json`.
- `document_url` column stores the Google Drive link returned by DocGen.

## Workflow
1. User starts Lead Call Intake: enters contact, scope, procurement, risk, and next steps.
2. Form saves record into Google Sheets (service account).
3. User taps “Generate Document”. Web app posts to DocGen with template id + WR class (worksheet).
4. DocGen renders Markdown, runs QA, exports PDF via `pandoc --pdf-engine=weasyprint`, and uploads to Google Drive.
5. Web app updates the sheet row with the Drive link and displays it.

## APIs
- `POST /v1/intakes`: create new intake row (no auth)
- `GET /v1/intakes/:id`: fetch intake + meta (optional)
- `POST /v1/documents/generate`: request DocGen and update Drive link
- `GET /v1/documents/:id`: optional future status endpoint

## QA Gates
- Locked CSS + fonts block (fail if fonts missing) — store fonts in `packages/wr-standards/fonts/` and reference relative paths.
- No `####` headings allowed.
- Metadata block (SOURCE/AS OF/UNITS/TIMEFRAME) must exist before exporting.
- Worksheet PDFs may include OPEN QUESTIONS; publish PDFs will fail until all resolved.

## Phase 1 Preview
- IndexedDB draft storage + sync when connectivity restored (Phase 1)
- Photo attachments & metadata queue
- Conflict detection (client_id + base version)

## Future Prompts/Agents
- Master Prompt that chooses protocol (lead call, site walk)
- Personas (P0103–P0115) run in sequence to surface missing questions
- Document generation prompt ensures brand language + referencing deck sources
