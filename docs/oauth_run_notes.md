# OAuth + DocGen Run Notes (2026-02-04)

## Outcome
End-to-end flow works:
- Web UI intake save → Sheets row
- Generate PDF → DocGen renders → uploads to Drive → returns link

## Google OAuth issues encountered + fixes
1) redirect_uri_mismatch
- Root cause: used Desktop/Installed OAuth client JSON with `redirect_uri=http://localhost`.
- Fix: create **Web application** OAuth client with authorized redirect URIs:
  - `http://localhost`
  - `http://localhost/`

2) org_internal restriction
- Root cause: OAuth Audience was restricted to organization users.
- Fix: Google Auth Platform → Audience → set **External** (Testing) and add gmail as **Test user**.

3) Request corruption ("missing response_type", client_id ending `co++m`)
- Root cause: URL copy/paste truncation/corruption.
- Fix: copy full auth URL from terminal / use Chrome incognito.

## DocGen template not found
- Symptom: UI showed `Template not found: lead-call-intake-worksheet`.
- Root cause: TEMPLATE_ROOT resolved incorrectly when running via ts-node-dev (wrong relative path from `services/docgen/src`).
- Fix: in `services/docgen/src/index.ts`, adjust path resolution to go up 3 levels:
  - `../../../packages/templates`
  - fallback font/css paths similarly.

## Secrets handling
- Token stored at: `.secrets/google-token.json` (not printed).
