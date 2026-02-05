#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { google } = require('googleapis');

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive'
];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...rest] = trimmed.split('=');
    const value = rest.join('=').trim();
    if (!value) return;
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

function loadClient() {
  loadEnvFile(path.resolve(__dirname, '../.env.local'));
  loadEnvFile(path.resolve(__dirname, '../../services/docgen/.env'));

  const clientPath = process.env.GOOGLE_OAUTH_CLIENT_PATH;
  const clientJson = process.env.GOOGLE_OAUTH_CLIENT_JSON;

  if (!clientPath && !clientJson) {
    throw new Error('Missing GOOGLE_OAUTH_CLIENT_PATH or GOOGLE_OAUTH_CLIENT_JSON');
  }

  const raw = clientJson
    ? JSON.parse(clientJson)
    : JSON.parse(fs.readFileSync(clientPath, 'utf-8'));

  const credentials = raw.installed || raw.web;
  if (!credentials) {
    throw new Error('Invalid OAuth client JSON');
  }

  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || (credentials.redirect_uris && credentials.redirect_uris[0]);
  if (!redirectUri) {
    throw new Error('Missing OAuth redirect URI');
  }

  return new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    redirectUri
  );
}

function resolveTokenPath() {
  const tokenPath = process.env.GOOGLE_OAUTH_TOKEN_PATH;
  if (tokenPath) return tokenPath;
  return path.resolve(__dirname, '..', '.secrets', 'google-token.json');
}

async function main() {
  const oauth = loadClient();
  const tokenPath = resolveTokenPath();
  const authUrl = oauth.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES
  });

  console.log('Authorize this app by visiting this URL:\n');
  console.log(authUrl);
  console.log('\nAfter approving, copy the "code" parameter from the URL and paste it here.');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const code = await new Promise((resolve) => {
    rl.question('Enter code: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  const { tokens } = await oauth.getToken(code);
  const tokenDir = path.dirname(tokenPath);
  if (!fs.existsSync(tokenDir)) {
    fs.mkdirSync(tokenDir, { recursive: true });
  }
  fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
  console.log(`Token saved to ${tokenPath}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
