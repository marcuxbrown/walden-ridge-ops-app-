# Walden Ridge Ops Web App (Phase 0)

## Stack
- Next.js 14 (App Router disabled for simplicity)
- TypeScript + React Hook Form + Zod for validation
- Google Sheets (OAuth) as the Phase 0 datastore
- Google Drive (OAuth) for generated PDFs
- Served as a PWA targetting iPad browsers

## Focus Areas
1. Lead Call Intake form with sections for contact/opportunity, scope & procurement, risks, and next steps.
2. Write intake rows into Google Sheets via OAuth token.
3. `POST /api/documents/generate` to trigger the DocGen service.
4. Provide status indicators for document generation and a download button for the Drive link.
5. Offline draft queue + photo attachments (Phase 1).

## Scripts
- `npm run dev`: starts the Next.js dev server on `localhost:3000`.
- `npm run build`: compiles the app for production.
- `npm run start`: runs the compiled application.
- `npm run lint`: runs ESLint.

## .env.local
Copy `.env.local.example` and fill OAuth client + token path + sheet id + DocGen URL.

See `docs/google-setup.md` for the Google Sheets + Drive setup steps.

Generate the OAuth token via `apps/web/scripts/google-oauth.js`.

## Next Steps
- Wire up Supabase client + swr/fetch utility.
- Model the intake form state and persist to `intakes_lead_call` via serverless API.
- Add document generation button and show QA status + download link.
