# Supabase Schema & API Contracts (Phase 0)

## Tables
### profiles
- `id` UUID (auth.users.id)
- `name` text
- `role` text (`field`, `ops`, `admin`)
- `created_at` timestamptz default now()

### opportunities
- `id` uuid pk
- `property_name` text
- `city` text
- `state` text
- `brand_flag` text
- `owner_entity` text
- `management_company` text
- `created_by` uuid references `auth.users`
- `created_at` timestamptz default now()

### intakes_lead_call
- `id` uuid pk default gen_random_uuid()
- `opportunity_id` uuid references `opportunities`
- `created_by` uuid references `auth.users`
- `captured_at` timestamptz
- `data` jsonb (validated by shared Zod schema)
- `status` text default 'draft'
- `created_at` timestamptz default now()
- `updated_at` timestamptz default now()

### documents
- `id` uuid pk default gen_random_uuid()
- `intake_id` uuid references `intakes_lead_call`
- `opportunity_id` uuid references `opportunities`
- `created_by` uuid references `auth.users`
- `template_id` text
- `wr_class` text
- `md_path` text
- `pdf_path` text
- `qa_report` jsonb
- `status` text (`pending`, `pass`, `fail`)
- `created_at` timestamptz default now()

## Functions / Views (future)
- `intakes_with_documents`: join intakes → active documents for summary cards.

## API Endpoints (within Next.js or another API layer)
### `POST /v1/intakes`
- Body: `{ opportunityId, payload }`
- Authentication required.
- Creates/updates opportunity metadata + inserts record inside `intakes_lead_call`.
- Returns: `{ intakeId, nextSteps, gaps }` where `gaps` lists missing required fields.

### `GET /v1/intakes/:id`
- Returns intake + opportunity metadata + existing documents status.

### `POST /v1/documents/generate`
- Body: `{ intakeId, templateId, wrClass }`
- Triggers DocGen service via signed request (service role + webhook).
- Returns: `{ documentId, status, mdUrl?, pdfUrl?, qaReport }`.

### `GET /v1/documents/:id`
- Returns generation status, QA report, and direct download URLs (signed by Supabase).

### `POST /v1/auth/magic-link`
- Accepts email, calls Supabase `auth.signInWithOtp`.
- Returns a message instructing the user to check email.

## Supabase Storage Buckets
- `wr-generated-docs/`: private (service uploads, signed URLs for downloads).

## RLS Examples
- Profiles table: allow `select` only for the logged-in user.
- Documents: allow owner to insert/select; admins (`role=admin`) can view all.

## Migration Notes
- `intakes_lead_call.data` should record field-level metadata (field name, value, question label) for traceability.
