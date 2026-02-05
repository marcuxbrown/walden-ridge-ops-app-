import { google } from 'googleapis';
import { getOAuthClient } from './googleAuth';

export function getDriveClient() {
  const auth = getOAuthClient();
  return google.drive({ version: 'v3', auth });
}
