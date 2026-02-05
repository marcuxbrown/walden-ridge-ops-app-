# Phase 1 — Offline Drafts + Photo Capture

## Overview
Adds offline draft capture, local queue, and photo attachments for iPad field use. Drafts sync when the device comes back online.

## What’s Included
- Local offline storage using IndexedDB (`idb-keyval`)
- “Sync offline drafts” button
- Photo capture input (`accept=image/*`, `capture=environment`)
- Attachments upload to Drive with URLs stored in the `attachments_urls` column

## Data Flow
1. User saves intake offline → stored in IndexedDB with a local `intakeId`.
2. When online, user clicks “Sync offline drafts”.
3. App posts to `/api/intakes`, then uploads photos to `/api/attachments`.
4. Sheet row is updated with JSON list of attachment URLs.

## Columns Added
`attachments_urls` (JSON string array of Drive links)

## Limits / Considerations
- Large photo uploads may be slow on cellular. Consider adding client-side compression in Phase 2.
- If Drive sharing is restricted, links will still work for signed-in users.
