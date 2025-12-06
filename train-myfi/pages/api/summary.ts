import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../lib/storage';
import { generateAssistantReply } from '../../lib/genai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { sessionId } = req.query;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

    const session = await getSession(String(sessionId));
    if (!session) return res.status(404).json({ error: 'session not found' });

    const transcriptText = session.transcript.map((t: any) => `${t.speaker}: ${t.text}`).join('\n');
    const systemPrompt = `You are a coach summarizer. Produce a short bullet summary of the key points in the following transcript and recommended next questions for the coach.`;

    const contents = [{ role: 'user', parts: [{ text: transcriptText }] }];
    const summary = await generateAssistantReply(systemPrompt, contents);

    return res.status(200).json({ summary });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
