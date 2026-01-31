import { NextApiRequest, NextApiResponse } from 'next';
import { getSession, saveSession, summarizeOldMessages, updateSessionCache } from '../../lib/storage';
import { generateAssistantReply, embedText, createOrUpdateCache } from '../../lib/genai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) return res.status(400).json({ error: 'sessionId and message required' });

    const session = await getSession(sessionId);
    if (!session) return res.status(404).json({ error: 'session not found' });

    // Append coach message to transcript
    session.transcript.push({ speaker: 'coach', text: message, ts: Date.now() });

    const profile = session.profile;

    // Helper to format pile counts
    const formatPile = (habitude: string) => {
      const thatsMe = profile[`${habitude}_thats_me`] || 0;
      const sometimes = profile[`${habitude}_sometimes_me`] || 0;
      const notMe = profile[`${habitude}_not_me`] || 0;
      return `${thatsMe} that's me / ${sometimes} sometimes / ${notMe} not me`;
    };

    // Build detailed system prompt for the simulated user (client being coached)
    const systemPrompt = `You are ${profile.name || 'a person'}${profile.age ? `, age ${profile.age},` : ''} in a coaching session about money. YOUR NAME IS ${profile.name || 'not specified'}${profile.age ? ` AND YOU ARE ${profile.age} YEARS OLD` : ''} - remember this throughout the entire conversation, even after many turns. You're NOT self-aware of your patterns - you just live your life and make decisions that feel right in the moment.

Your Money Habitudes profile (how you sorted 9 cards for each category):
- Spontaneous: ${formatPile('spontaneous')}
- Status: ${formatPile('status')}
- Carefree: ${formatPile('carefree')}
- Planning: ${formatPile('planning')}
- Giving: ${formatPile('giving')}
- Security: ${formatPile('security')}

Persona: ${profile.persona}

YOUR REAL FINANCIAL SITUATION (stay in character with this backstory):
${profile.persona_backstory || 'You have a typical financial situation with some money challenges.'}

HOW TO RESPOND LIKE A REAL PERSON:
1. Keep responses 1-3 sentences long - talk naturally, not like writing an essay
2. You DON'T see patterns in your own behavior - answer each question in the moment
3. Have blind spots about money - your behaviors feel normal/justified to you
4. Sometimes contradict yourself without noticing (just like real people do)
5. Get a little defensive when coach points out patterns - rationalize your choices
6. Be vague about uncomfortable topics - avoid specifics when it feels exposing
7. Show confusion or uncertainty - say "I don't know" or "I haven't really thought about it" when appropriate
8. Use filler words naturally (um, like, you know, I guess, kinda)
9. Don't volunteer information - make the coach work to draw things out
10. Match your habitudes: High Spontaneous = impulsive justifications, High Giving = defensive about helping others, High Security = anxious when discussing risk, High Carefree = dismissive of consequences

IMPORTANT: You're being coached because you have money issues you don't fully understand. Don't be too articulate or self-aware - real clients are messy, confused, and don't have all the answers. Use your backstory as context but DON'T explain it all at once - let the coach discover it through questioning.`;

    // Check if we need to summarize (every 20 non-summary messages)
    const nonSummaryMessages = session.transcript.filter((m: any) => m.speaker !== 'summary');
    if (nonSummaryMessages.length >= 20) {
      const lastSummaryIndex = session.transcript.findLastIndex((m: any) => m.speaker === 'summary');
      const messagesToSummarize = lastSummaryIndex >= 0 
        ? session.transcript.slice(lastSummaryIndex + 1, lastSummaryIndex + 21)
        : session.transcript.slice(0, 20);
      
      if (messagesToSummarize.length === 20) {
        await summarizeOldMessages(session.session_id, messagesToSummarize);
        // Reload session to get updated transcript with summary
        const updatedSession = await getSession(sessionId);
        if (updatedSession) session.transcript = updatedSession.transcript;
      }
    }

    // Build contents array: all summaries + last 20 non-summary messages
    const summaries = session.transcript.filter((m: any) => m.speaker === 'summary');
    const recentMessages = session.transcript
      .filter((m: any) => m.speaker !== 'summary')
      .slice(-20);
    
    // Build full context: summaries + recent messages
    // NOTE: Caching disabled until SDK interface is updated
    const contents = [
      ...summaries.map((m: any) => ({ 
        role: 'user', 
        parts: [{ text: `[Previous conversation summary]: ${m.text}` }] 
      })),
      ...recentMessages.map((m: any) => ({ 
        role: m.speaker === 'coach' ? 'user' : 'model', 
        parts: [{ text: m.text }] 
      }))
    ];

    // Generate simulated user reply
    const reply = await generateAssistantReply(systemPrompt, contents, null);

    // Append simulated user reply to transcript
    session.transcript.push({ speaker: 'user', text: reply, ts: Date.now() });

    await saveSession(session);

    return res.status(200).json({ reply });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
