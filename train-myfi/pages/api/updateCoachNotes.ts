import { NextApiRequest, NextApiResponse } from 'next';
import { supa } from '../../lib/supa';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, notes } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId required' });
    }

    await supa
      .from('sessions')
      .update({ coach_notes: notes || '' })
      .eq('id', sessionId);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
