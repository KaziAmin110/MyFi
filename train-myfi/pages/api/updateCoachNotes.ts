import { NextApiRequest, NextApiResponse } from 'next';
import { supa } from '../../lib/supa';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, notes, firstImpressions } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId required' });
    }

    const updateData: any = {};
    if (notes !== undefined) updateData.coach_notes = notes || '';
    if (firstImpressions !== undefined) updateData.first_impressions = firstImpressions || '';

    await supa
      .from('sessions')
      .update(updateData)
      .eq('id', sessionId);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
