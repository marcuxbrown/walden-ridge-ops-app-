import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { getSheetsClient, getSheetConfig } from '../../lib/googleSheets';

const HEADER = [
  'intake_id',
  'created_at',
  'property_name',
  'city',
  'state',
  'brand_flag',
  'owner_entity',
  'management_company',
  'contact_name',
  'contact_role',
  'contact_email',
  'contact_phone',
  'renovation_type',
  'occupancy_status',
  'scope_buckets',
  'phasing',
  'quiet_hours',
  'procurement_casegoods',
  'procurement_ffe',
  'procurement_mep',
  'procurement_owner_items',
  'key_risks',
  'open_questions',
  'next_steps_follow_up',
  'next_steps_step_one',
  'next_steps_step_two',
  'next_steps_step_three',
  'notes',
  'payload_json',
  'attachments_urls',
  'document_url'
];

async function ensureHeader() {
  const sheets = getSheetsClient();
  const { spreadsheetId, sheetName } = getSheetConfig();

  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!1:1`
  });

  const existing = data.values?.[0] ?? [];
  if (existing[0] !== 'intake_id') {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!1:1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADER] }
    });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { opportunity, intake, intakeId: clientIntakeId } = req.body;
  if (!opportunity || !intake) return res.status(400).json({ error: 'Missing opportunity or intake payload' });

  const intakeId = clientIntakeId || crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const payload = {
    opportunity,
    intake,
    captured_at: createdAt
  };

  const row = [
    intakeId,
    createdAt,
    opportunity.property_name ?? '',
    opportunity.city ?? '',
    opportunity.state ?? '',
    opportunity.brand_flag ?? '',
    opportunity.owner_entity ?? '',
    opportunity.management_company ?? '',
    intake.contact?.name ?? '',
    intake.contact?.role ?? '',
    intake.contact?.email ?? '',
    intake.contact?.phone ?? '',
    intake.scope?.renovation_type ?? '',
    intake.scope?.occupancy_status ?? '',
    (intake.scope?.scope_buckets ?? []).join(', '),
    intake.constraints?.phasing ?? '',
    intake.constraints?.quiet_hours ?? '',
    intake.procurement?.casegoods ?? '',
    intake.procurement?.ffe ?? '',
    intake.procurement?.mep ?? '',
    intake.procurement?.owner_items ?? '',
    intake.risks?.key_risks ?? '',
    intake.risks?.open_questions ?? '',
    intake.next_steps?.follow_up ?? '',
    intake.next_steps?.step_one ?? '',
    intake.next_steps?.step_two ?? '',
    intake.next_steps?.step_three ?? '',
    intake.notes ?? '',
    JSON.stringify(payload),
    '',
    ''
  ];

  try {
    await ensureHeader();
    const sheets = getSheetsClient();
    const { spreadsheetId, sheetName } = getSheetConfig();

    const appendResult = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] }
    });

    const updatedRange = appendResult.data.updates?.updatedRange ?? '';
    const match = updatedRange.match(/![A-Z]+(\d+):/);
    const rowNumber = match ? Number(match[1]) : null;

    return res.json({ intakeId, rowNumber });
  } catch (error: any) {
    return res.status(500).json({ error: error.message ?? 'Failed to save intake' });
  }
}
