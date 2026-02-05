import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  if (!url || !anon) return res.status(500).json({ error: 'Supabase env missing' });

  const supabase = createClient(url, anon);
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) return res.status(500).json({ error: error.message });

  return res.json({ ok: true });
}
