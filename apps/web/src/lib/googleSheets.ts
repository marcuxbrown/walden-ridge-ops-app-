import { google } from 'googleapis';
import { getOAuthClient } from './googleAuth';

export function getSheetsClient() {
  const auth = getOAuthClient();
  return google.sheets({ version: 'v4', auth });
}

export function getSheetConfig() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) throw new Error('Missing GOOGLE_SHEET_ID');
  const sheetName = process.env.GOOGLE_SHEET_NAME ?? 'Intakes';
  return { spreadsheetId, sheetName };
}

export function toColumnLetter(index: number) {
  let result = '';
  let n = index;
  while (n > 0) {
    const remainder = (n - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}
