import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { promisify } from 'util';
import { execFile } from 'child_process';
import nunjucks from 'nunjucks';
import { google } from 'googleapis';

const execFileAsync = promisify(execFile);

dotenv.config();

const app = express();
app.use(express.json({ limit: '2mb' }));

const PORT = process.env.PORT ?? 4000;
// Note: when running via ts-node-dev, __dirname is `services/docgen/src`, so we need to go up 3 levels to reach repo root.
const TEMPLATE_ROOT = path.resolve(__dirname, '../../../packages/templates');
const FONT_DIR = process.env.LOCAL_FONT_DIR ?? path.resolve(__dirname, '../../../packages/wr-standards/assets/fonts');
const CSS_PATH = process.env.WR_CSS_PATH ?? path.resolve(__dirname, '../../../packages/wr-standards/internal-pdf-style.css');
const HEADER_PATH = process.env.WR_RUNNING_HEADER;
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID ?? '';

const REQUIRED_FONTS = [
  'IBMPlexSans-Regular.otf',
  'IBMPlexSans-SemiBold.otf',
  'IBMPlexSans-Bold.otf'
];

function assertFonts() {
  const missing = REQUIRED_FONTS.filter((font) => !fs.existsSync(path.join(FONT_DIR, font)));
  if (missing.length) {
    const message = `Missing required fonts: ${missing.join(', ')}`;
    throw new Error(message);
  }
}

function runQa(markdown: string, wrClass: string) {
  const errors: string[] = [];

  if (/^####\s/m.test(markdown)) {
    errors.push('Hierarchy depth exceeded: found #### headings.');
  }

  const requiredMeta = ['SOURCE:', 'AS OF:', 'UNITS:', 'TIMEFRAME:'];
  requiredMeta.forEach((token) => {
    if (!markdown.includes(token)) {
      errors.push(`Missing metadata field: ${token}`);
    }
  });

  if (wrClass === 'publish' && markdown.includes('OPEN QUESTION')) {
    errors.push('Publish class cannot include OPEN QUESTION placeholders.');
  }

  return errors;
}

function loadOAuthToken() {
  const tokenJson = process.env.GOOGLE_OAUTH_TOKEN_JSON;
  const tokenPath = process.env.GOOGLE_OAUTH_TOKEN_PATH;

  if (tokenJson) {
    return JSON.parse(tokenJson);
  }

  if (!tokenPath) {
    throw new Error('Missing GOOGLE_OAUTH_TOKEN_PATH or GOOGLE_OAUTH_TOKEN_JSON');
  }

  if (!fs.existsSync(tokenPath)) {
    throw new Error('OAuth token not found. Run scripts/google-oauth.js');
  }

  return JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
}

function getDriveClient() {
  const clientPath = process.env.GOOGLE_OAUTH_CLIENT_PATH;
  const clientJson = process.env.GOOGLE_OAUTH_CLIENT_JSON;

  if (!clientPath && !clientJson) {
    throw new Error('Missing GOOGLE_OAUTH_CLIENT_PATH or GOOGLE_OAUTH_CLIENT_JSON');
  }

  const raw = clientJson
    ? JSON.parse(clientJson)
    : JSON.parse(fs.readFileSync(clientPath as string, 'utf-8'));
  const credentials = raw.installed ?? raw.web;
  if (!credentials) {
    throw new Error('Invalid OAuth client JSON');
  }

  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI ?? credentials.redirect_uris?.[0];
  if (!redirectUri) {
    throw new Error('Missing OAuth redirect URI');
  }

  const oauth = new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    redirectUri
  );

  const token = loadOAuthToken();
  oauth.setCredentials(token);

  return google.drive({ version: 'v3', auth: oauth });
}

app.get('/', (_req: any, res: any) => {
  res.json({
    service: 'walden-ridge-docgen',
    status: 'ok',
    endpoints: ['/health', '/generate']
  });
});

app.post('/generate', async (req: any, res: any) => {
  try {
    const { templateId, intakeId, wrClass, payload } = req.body;
    if (!templateId || !intakeId || !wrClass || !payload) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!DRIVE_FOLDER_ID) {
      return res.status(500).json({ error: 'Missing GOOGLE_DRIVE_FOLDER_ID' });
    }

    assertFonts();

    const templatePath = path.join(TEMPLATE_ROOT, `${templateId}.md`);
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ error: `Template not found: ${templateId}` });
    }

    const template = fs.readFileSync(templatePath, 'utf-8');
    const env = nunjucks.configure({ autoescape: false });
    const rendered = env.renderString(template, payload);

    const qaErrors = runQa(rendered, wrClass);
    if (qaErrors.length) {
      return res.status(422).json({ status: 'fail', qaErrors });
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wr-docgen-'));
    const mdPath = path.join(tmpDir, `${templateId}-${intakeId}.md`);
    const pdfPath = path.join(tmpDir, `${templateId}-${intakeId}.pdf`);

    fs.writeFileSync(mdPath, rendered, 'utf-8');

    const args = [
      mdPath,
      '-o',
      pdfPath,
      '--pdf-engine=weasyprint',
      '--css',
      CSS_PATH
    ];
    if (HEADER_PATH && fs.existsSync(HEADER_PATH)) {
      args.push('--include-before-body', HEADER_PATH);
    }

    await execFileAsync('pandoc', args);

    const drive = getDriveClient();
    const fileName = `${templateId}-${intakeId}.pdf`;

    const { data: file } = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [DRIVE_FOLDER_ID]
      },
      media: {
        mimeType: 'application/pdf',
        body: fs.createReadStream(pdfPath)
      },
      fields: 'id, webViewLink, webContentLink'
    });

    if (!file.id) {
      throw new Error('Drive upload failed');
    }

    try {
      await drive.permissions.create({
        fileId: file.id,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });
    } catch (permissionError) {
      // Some orgs disallow public sharing; still return the link for signed-in access.
    }

    return res.json({
      status: 'pass',
      documentId: file.id,
      pdfUrl: file.webViewLink ?? file.webContentLink
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message ?? 'DocGen error' });
  }
});

app.get('/health', (_req: any, res: any) => {
  res.json({ status: 'ok', version: 'phase-0' });
});

app.listen(PORT, () => {
  console.log(`DocGen service listening on http://localhost:${PORT}`);
});
