import { GoogleGenAI } from '@google/genai';

const key = process.env.GEMINI_API_KEY;

export const genAI = key ? new GoogleGenAI({ apiKey: key }) : null;

// Cache management for prompt caching
// NOTE: Caching disabled - @google/genai SDK v1.30.0 has different interface than docs
// TODO: Update once correct TypeScript interface is available
export async function createOrUpdateCache(
  sessionId: string,
  systemPrompt: string,
  summaries: Array<{ text: string }>
): Promise<string | null> {
  // Temporarily disabled - SDK interface doesn't match Python docs
  return null;
}

export async function embedText(text: string): Promise<number[] | null> {
  if (!genAI) return null;
  const res = await genAI.models.embedContent({
    model: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
    contents: text,
    config: { outputDimensionality: Number(process.env.GEMINI_EMBEDDING_DIMENSION || 768) }
  });
  if (!res.embeddings || !res.embeddings[0]) return null;
  return res.embeddings[0].values;
}

export async function generateAssistantReply(
  systemPrompt: string,
  contents: any[],
  cacheName?: string | null
) {
  if (!genAI) {
    // Fallback: simple mock reply
    const lastUser = contents.reverse().find((c: any) => c.role === 'user');
    return `Mock reply based on: "${lastUser?.parts?.[0]?.text?.slice(0,120)}..."`;
  }

  const model = process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash';

  let retries = 3;
  let lastErr: any = null;
  while (retries > 0) {
    try {
      // Caching disabled for now - use regular generation
      const result = await genAI.models.generateContent({
        model,
        config: { systemInstruction: systemPrompt },
        contents
      });
      
      return result.text;
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));
      lastErr = err;
      if (String(msg).includes('503') || String(msg).toLowerCase().includes('overloaded')) {
        retries -= 1;
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 1500));
          continue;
        }
      }
      break;
    }
  }

  // Graceful fallback message so UI shows something
  return "sorry Cara, having a quick hiccup answering that — can you ask again in 1 to 2 minutes?";
}

export async function summarizeConversation(messages: Array<{role: string, content: string}>) {
  if (!genAI) return "[Summary unavailable - no API key]";
  
  const model = process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash';
  
  const conversationText = messages.map(m => 
    `${m.role === 'coach' ? 'Coach' : 'Client'}: ${m.content}`
  ).join('\n\n');
  
  const systemPrompt = `You are summarizing a coaching conversation about money habits. Create a concise summary (3-5 sentences) that captures:
1. Main topics discussed
2. Key insights about the client's money attitudes
3. Important patterns or concerns revealed

Be specific but brief. This summary will be used as context for continuing the conversation.`;

  try {
    const result = await genAI.models.generateContent({
      model,
      config: { systemInstruction: systemPrompt },
      contents: [{ role: 'user', parts: [{ text: conversationText }] }]
    });
    return result.text;
  } catch (err) {
    return `[Summary of ${messages.length} messages - topics included client's financial concerns and money habits]`;
  }
}

export async function generatePersonaBackstory(profile: any): Promise<string> {
  if (!genAI) return "Generic person with typical financial situation.";
  
  const model = process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash';
  
  // Analyze habitudes to create realistic patterns
  const dominantHabitudes = [];
  const lowHabitudes = [];
  
  const habitudes = [
    { name: 'spontaneous', score: profile.spontaneous_thats_me || 0 },
    { name: 'status', score: profile.status_thats_me || 0 },
    { name: 'carefree', score: profile.carefree_thats_me || 0 },
    { name: 'planning', score: profile.planning_thats_me || 0 },
    { name: 'giving', score: profile.giving_thats_me || 0 },
    { name: 'security', score: profile.security_thats_me || 0 },
  ];
  
  habitudes.sort((a, b) => b.score - a.score);
  dominantHabitudes.push(habitudes[0].name, habitudes[1].name);
  lowHabitudes.push(habitudes[5].name, habitudes[4].name);
  
  const systemPrompt = `You are creating a realistic financial backstory for a coaching client. Based on their Money Habitudes profile, create a 3-paragraph backstory that includes:

Paragraph 1: Current financial situation
- Specific income range (realistic for their persona: ${profile.persona})
- Debt amounts if any (credit card, loans, etc.)
- Savings/emergency fund status
- Recent major financial decision

Paragraph 2: Spending patterns and behaviors
- 2-3 specific money habits tied to their dominant habitudes (${dominantHabitudes.join(', ')})
- Include contradictory behaviors they don't recognize
- Recent examples of these patterns in action

Paragraph 3: Emotional relationship with money
- Hidden anxieties or blind spots related to low habitudes (${lowHabitudes.join(', ')})
- What they avoid thinking about
- What they justify or rationalize

CRITICAL: Make this feel like a real person with messy, contradictory behaviors. Include specific numbers and situations. Don't make them self-aware - they think their choices make sense.`;

  try {
    const result = await genAI.models.generateContent({
      model,
      config: { systemInstruction: systemPrompt },
      contents: [{
        role: 'user',
        parts: [{ text: `Create backstory for: ${profile.persona}\n\nMoney Habitudes:\n- Spontaneous: ${profile.spontaneous_thats_me} thats_me\n- Status: ${profile.status_thats_me} thats_me\n- Carefree: ${profile.carefree_thats_me} thats_me\n- Planning: ${profile.planning_thats_me} thats_me\n- Giving: ${profile.giving_thats_me} thats_me\n- Security: ${profile.security_thats_me} thats_me` }]
      }]
    });
    return result.text;
  } catch (err) {
    return `${profile.persona} with typical financial situation and money habits.`;
  }
}

