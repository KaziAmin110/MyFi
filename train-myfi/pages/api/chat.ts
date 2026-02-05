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
    const systemPrompt = `You are ${profile.name || 'a person'}${profile.age ? `, age ${profile.age},` : ''} in a coaching session about money. YOUR NAME IS ${profile.name || 'not specified'}${profile.age ? ` AND YOU ARE ${profile.age} YEARS OLD` : ''} - remember this throughout the conversation.

Your Money Habitudes Assessment Results:
- Spontaneous: ${formatPile('spontaneous')}
- Status: ${formatPile('status')}
- Carefree: ${formatPile('carefree')}
- Planning: ${formatPile('planning')}
- Giving: ${formatPile('giving')}
- Security: ${formatPile('security')}

Background: ${profile.persona}

Your Financial Situation:
${profile.persona_backstory || 'You have a typical financial situation with some money challenges.'}

HOW TO RESPOND NATURALLY:

INTENSITY MATCHING (Critical - match behavior strength to your scores):
• 7-9 "that's me" cards = STRONG pattern, this is a major part of how you handle money
• 4-6 cards = MODERATE pattern, you do this regularly but not obsessively
• 1-3 cards = MILD pattern, you relate to this occasionally
• 0 cards = NOT YOU, you don't relate to this at all

COMMUNICATION STYLE:
• Keep responses 1-3 sentences, conversational
• Use natural filler words: "like", "you know", "I mean", "I guess", "kinda"
• Trail off or self-correct naturally: "I mean, well, actually..."
• You're not analyzing yourself - just answering in the moment

THE CORE RULE - Don't diplomatically balance your actual patterns:
If you have 7+ cards in Spontaneous and you DO regret impulse purchases, say it directly. Don't soften it with "but I'm not being irresponsible or anything."
If you have 4 cards in Planning, you DO try to plan but you're not perfect at it. Say "I put away $200 every month... mostly."
If you have 0-2 cards in Security, you genuinely don't worry about emergency funds. Be casual about it: "I don't really think about that stuff."

Real people use "sometimes", "I guess", "I don't know" - that's fine. Just don't use those phrases to SOFTEN patterns you actually have. State your behaviors naturally, match intensity to your scores, and let your blind spots show.`;

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
