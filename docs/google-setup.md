# Google Sheets + Drive Setup (Phase 0) — OAuth (No Service Account Keys)

## 1) Create a Google Cloud project
- Enable **Google Sheets API** and **Google Drive API**.

## 2) Create OAuth credentials (Desktop App)
1. Go to **APIs & Services → Credentials**.
2. Click **Create Credentials → OAuth client ID**.
3. Application type: **Desktop app**.
4. Download the JSON file.

## 3) Create the intake sheet
- Create a Google Sheet (tab name: `Intakes`) using the same Google account you will authorize.
- Copy the **Sheet ID** from the URL (the long string between `/d/` and `/edit`).

## 4) Create a Drive folder for PDFs
- Create a folder in Google Drive (e.g., `WR Ops PDFs`) using the same Google account.
- Copy the folder ID from the URL.

## 5) Generate an OAuth token
Set the client path and token path in your env, then run:
```
cd /Users/525n/clawd/workspaces/walden-ridge-ops-app/apps/web
node scripts/google-oauth.js
```
When the browser opens, approve access and copy the `code` from the URL.

## 6) Fill env files
### Web app
`/Users/525n/clawd/workspaces/walden-ridge-ops-app/apps/web/.env.local`
```
GOOGLE_OAUTH_CLIENT_PATH=/absolute/path/to/oauth-client.json
GOOGLE_OAUTH_TOKEN_PATH=/Users/525n/clawd/workspaces/walden-ridge-ops-app/.secrets/google-token.json
GOOGLE_OAUTH_REDIRECT_URI=http://localhost
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_SHEET_NAME=Intakes
GOOGLE_DRIVE_FOLDER_ID=your_drive_folder_id
DOCGEN_URL=http://localhost:4000
```

### DocGen
`/Users/525n/clawd/workspaces/walden-ridge-ops-app/services/docgen/.env`
```
GOOGLE_OAUTH_CLIENT_PATH=/absolute/path/to/oauth-client.json
GOOGLE_OAUTH_TOKEN_PATH=/Users/525n/clawd/workspaces/walden-ridge-ops-app/.secrets/google-token.json
GOOGLE_OAUTH_REDIRECT_URI=http://localhost
GOOGLE_DRIVE_FOLDER_ID=your_drive_folder_id
LOCAL_FONT_DIR=/Users/525n/clawd/workspaces/walden-ridge-ops-app/packages/wr-standards/assets/fonts
WR_CSS_PATH=/Users/525n/clawd/workspaces/walden-ridge-ops-app/packages/wr-standards/internal-pdf-style.css
```

## 7) Start services
```
cd /Users/525n/clawd/workspaces/walden-ridge-ops-app/services/docgen && npm run dev
cd /Users/525n/clawd/workspaces/walden-ridge-ops-app/apps/web && npm run dev
```

## 8) Test
- Open `http://localhost:3000`
- Fill intake and Save
- Generate PDF (Drive link will appear)
