import { NextApiRequest, NextApiResponse } from 'next';
import { supa } from '../../lib/supa';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { data: sessions, error } = await supa
      .from('sessions')
      .select('id, created_at, updated_at, status, turn_count, dominant_habitudes, spontaneous_thats_me, status_thats_me, carefree_thats_me, planning_thats_me, giving_thats_me, security_thats_me')
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Format sessions for UI
    const formatted = (sessions || []).map((s: any) => {
      // Calculate persona from dominant habitudes
      const dominant = s.dominant_habitudes || [];
      const persona = dominant.length > 0 
        ? dominant.slice(0, 2).join(' + ') 
        : 'mixed profile';
      
      return {
        id: s.id,
        persona,
        updated_at: s.updated_at,
        turn_count: s.turn_count || 0,
        status: s.status || 'active'
      };
    });

    res.status(200).json(formatted);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
