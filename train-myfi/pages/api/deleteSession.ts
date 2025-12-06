import type { NextApiRequest, NextApiResponse } from 'next';
import { supa } from '../../lib/supa';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

  try {
    const { error } = await supa
      .from('sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
