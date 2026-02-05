import type { NextApiRequest, NextApiResponse } from 'next';
import { getDriveClient } from '../../lib/googleDrive';
import { getSheetsClient, getSheetConfig, toColumnLetter } from '../../lib/googleSheets';

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
  if (!match) throw new Error('Invalid data URL');
  const mime = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  return { mime, buffer };
}

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

  const { intakeId, attachments } = req.body;
  if (!intakeId || !attachments?.length) {
    return res.status(400).json({ error: 'Missing intakeId or attachments' });
  }

  try {
    const drive = getDriveClient();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) return res.status(500).json({ error: 'Missing GOOGLE_DRIVE_FOLDER_ID' });

    const uploadedUrls: string[] = [];

    for (let i = 0; i < attachments.length; i += 1) {
      const item = attachments[i];
      const { mime, buffer } = parseDataUrl(item.dataUrl);
      const fileName = `intake-${intakeId}-${Date.now()}-${i + 1}.${mime.split('/')[1] || 'jpg'}`;

      const { data: file } = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId]
        },
        media: {
          mimeType: mime,
          body: Buffer.from(buffer)
        },
        fields: 'id, webViewLink, webContentLink'
      });

      if (!file.id) continue;

      try {
        await drive.permissions.create({
          fileId: file.id,
          requestBody: {
            role: 'reader',
            type: 'anyone'
          }
        });
      } catch (permissionError) {
        // Some orgs disallow public sharing.
      }

      uploadedUrls.push(file.webViewLink ?? file.webContentLink ?? '');
    }

    const { spreadsheetId, sheetName, header, rows } = await fetchSheetData();
    const intakeRowIndex = rows.findIndex((row) => row[0] === intakeId);
    if (intakeRowIndex === -1) {
      return res.status(404).json({ error: 'Intake row not found' });
    }

    const attachmentsIndex = header.indexOf('attachments_urls');
    if (attachmentsIndex === -1) {
      return res.status(500).json({ error: 'attachments_urls column missing' });
    }

    const rowNumber = intakeRowIndex + 2;
    const columnLetter = toColumnLetter(attachmentsIndex + 1);
    const range = `${sheetName}!${columnLetter}${rowNumber}`;

    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[JSON.stringify(uploadedUrls)]] }
    });

    return res.json({ urls: uploadedUrls });
  } catch (error: any) {
    return res.status(500).json({ error: error.message ?? 'Attachment upload failed' });
  }
}
