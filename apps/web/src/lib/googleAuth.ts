import { google } from 'googleapis';
import fs from 'fs';

function loadOAuthCredentials() {
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

  return { credentials, redirectUri };
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

export function getOAuthClient() {
  const { credentials, redirectUri } = loadOAuthCredentials();

  const oauth = new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    redirectUri
  );

  const token = loadOAuthToken();
  oauth.setCredentials(token);
  return oauth;
}
