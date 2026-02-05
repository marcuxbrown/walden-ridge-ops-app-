# Chokepoint Register — Product + Field UX Focus

| Chokepoint | Trigger | Impact | Mitigation | Owner |
|---|---|---|---|---|
| Form friction on iPad | Too many fields | Dropoffs before saving intake | Progressive sections, autosave, and validation hints | UX/Frontend |
| Ambiguous required data | Rapid call -> missing context | Incomplete doc + reopen loop | Required fields + OPEN QUESTION placeholders + quick review screen | Product |
| PDF standard drift | Template edits | Non-compliant documents | Locked CSS + hierarchy gate + QA gate enforcement | DocGen |
| Slow document turnaround | Pandoc/weasyprint cold start | Frustrated users waiting | Async generation w/ status updates + cached header assets | Eng Ops |
| OAuth token missing | Token file absent or expired | Save/generate fails | Run `scripts/google-oauth.js` to refresh token | Ops |
| Source confusion | Intake missing owner info | Bad assumptions | Field guidance text + highlight unsourced fields | UX |
| Device support gaps | Unsupported browser | Broken layout | PWA targeted at Safari/Chrome mobile, responsive testing matrix | QA |
| Incremental data versioning | Re-run intake mid-call | Data conflicts | Highlight last saved version + append `-conflict` snapshot for review | Backend |
