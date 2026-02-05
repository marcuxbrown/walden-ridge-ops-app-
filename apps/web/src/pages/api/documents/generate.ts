import type { NextApiRequest, NextApiResponse } from 'next';
import { getSheetsClient, getSheetConfig, toColumnLetter } from '../../../lib/googleSheets';

async function fetchSheetData() {
  const sheets = getSheetsClient();
  const { spreadsheetId, sheetName } = getSheetConfig();
  const headerResult = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!1:1`
  });
  const header = headerResult.data.values?.[0] ?? [];

  const rowsResult = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!2:2000`
  });
  const rows = rowsResult.data.values ?? [];
  return { spreadsheetId, sheetName, header, rows };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { intakeId, templateId = 'lead-call-intake-worksheet', wrClass = 'worksheet' } = req.body;
  if (!intakeId) return res.status(400).json({ error: 'Missing intakeId' });

  try {
    const { spreadsheetId, sheetName, header, rows } = await fetchSheetData();
    const payloadIndex = header.indexOf('payload_json');
    const documentIndex = header.indexOf('document_url');
    if (payloadIndex === -1) return res.status(500).json({ error: 'payload_json column missing' });
    if (documentIndex === -1) return res.status(500).json({ error: 'document_url column missing' });

    const rowIndex = rows.findIndex((row) => row[0] === intakeId);
    if (rowIndex === -1) return res.status(404).json({ error: 'Intake not found' });

    const payloadJson = rows[rowIndex][payloadIndex];
    const payload = payloadJson ? JSON.parse(payloadJson) : null;
    if (!payload) return res.status(500).json({ error: 'Payload missing from sheet' });

    const docgenUrl = process.env.DOCGEN_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
    if (!docgenUrl) return res.status(500).json({ error: 'DOCGEN_URL not configured' });

    const response = await fetch(`${docgenUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId, intakeId, wrClass, payload })
    });

    const body = await response.json();
    if (!response.ok) return res.status(response.status).json(body);

    const rowNumber = rowIndex + 2;
    const columnLetter = toColumnLetter(documentIndex + 1);
    const range = `${sheetName}!${columnLetter}${rowNumber}`;

    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[body.pdfUrl ?? '']] }
    });

    return res.json(body);
  } catch (error: any) {
    return res.status(500).json({ error: error.message ?? 'Document generation failed' });
  }
}
