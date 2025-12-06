import { NextApiRequest, NextApiResponse } from 'next';
import { getSession, saveSession } from '../../lib/storage';
import { generateRandomProfile } from '../../lib/profiles';
import { generatePersonaBackstory } from '../../lib/genai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { sessionId } = req.query;
  if (sessionId) {
    const s = await getSession(String(sessionId));
    if (s) return res.status(200).json(s);
    return res.status(404).json({ error: 'Not found' });
  }

  // create new session with random profile and backstory
  const profile = generateRandomProfile();
  
  // Generate realistic backstory based on habitudes
  const backstory = await generatePersonaBackstory(profile);
  profile.persona_backstory = backstory;
  
  const session = {
    session_id: `sess_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    profile,
    transcript: []
  };
  await saveSession(session);
  return res.status(200).json(session);
}
