# WR Standards Package

## Purpose
Holds locked styling assets required for `pandoc --pdf-engine=weasyprint` exports.

## Requirements
1. Place the IBM Plex Sans font files in `assets/fonts/`:
   - `IBMPlexSans-Regular.otf`
   - `IBMPlexSans-SemiBold.otf`
   - `IBMPlexSans-Bold.otf`
2. Keep the running header HTML fragment that references the WR logo (copy from existing `outputs/walden-ridge/documents/exports/wr-running-header.html`).
3. Any updates to typography or spacing must maintain the locked line-height values and avoid hierarchy depth >3.
