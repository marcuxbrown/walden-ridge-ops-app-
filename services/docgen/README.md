# DocGen Service (Phase 0)

## Responsibilities
1. Accept a structured Lead Call intake + `template_id` + `wr_class` (worksheet/publish).
2. Render the matching Markdown template from `packages/templates`.
3. Validate the rendered Markdown against QA gates (fonts, hierarchy depth, metadata, OPEN QUESTION handling).
4. Export Markdown + PDF (pandoc → weasyprint) using `packages/wr-standards/internal-pdf-style.css` and the locked running header.
5. Upload the PDF to Google Drive (service account + folder) and return a shareable link.
6. Return QA status and the Drive URL to the web app.

## Endpoints
- `POST /generate` — renders Markdown, runs QA, exports PDF, uploads to Google Drive.
- `GET /health` — simple status check.

## Inputs
- `intakeId` (uuid)
- `templateId` (string)
- `wrClass` (`worksheet` or `publish`)
- `payload` (object used for template rendering)

## QA Gates
- Fonts exist at `packages/wr-standards/assets/fonts/`; fail with explicit message if missing.
- No `####` headings allowed; exit 422 if detected.
- Metadata block must include SOURCE / AS OF / UNITS / TIMEFRAME.
- If `wrClass=publish`, the rendered Markdown must not contain the string `OPEN QUESTION`.

## Export Flow
1. Render Markdown with Nunjucks.
2. Save Markdown to a temp path.
3. Run `pandoc` with `--pdf-engine=weasyprint` and CSS from `packages/wr-standards/internal-pdf-style.css`.
4. Upload PDF to Google Drive (service account + folder ID).
5. Make the PDF shareable (anyone with link) and return the Drive link.

## Environment
Copy `.env.example` and set:
- `GOOGLE_OAUTH_CLIENT_PATH` (or `GOOGLE_OAUTH_CLIENT_JSON`)
- `GOOGLE_OAUTH_TOKEN_PATH`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `GOOGLE_DRIVE_FOLDER_ID`
- `LOCAL_FONT_DIR`
- `WR_CSS_PATH`
- `WR_RUNNING_HEADER` (optional)

Token generation lives in `apps/web/scripts/google-oauth.js`.
