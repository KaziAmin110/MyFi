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

export async function generatePersonaBackstory(profile: any): Promise<{name: string, age: number, backstory: string}> {
  if (!genAI) return { name: 'Client', age: 30, backstory: 'Generic person with typical financial situation.' };
  
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
  
  // Build intensity context for dominant and low habitudes
  const intensityContext = habitudes.map(h => {
    let intensity = '';
    if (h.score >= 7) intensity = 'VERY STRONG/EXTREME';
    else if (h.score >= 4) intensity = 'MODERATE';
    else if (h.score >= 1) intensity = 'MILD';
    else intensity = 'NOT PRESENT';
    return `${h.name}: ${h.score}/9 (${intensity})`;
  }).join('\n');
  
  const frameworkDefinitions = `
MONEY HABITUDES FRAMEWORK (use these exact definitions):

PLANNING: Money helps achieve goals. Using money INTENTIONALLY for goals (practical OR impractical - planning a vacation even when rent is short is still planning behavior). This is about financial goal-setting and intentional spending, NOT about being organized or making to-do lists.
Examples: Budgeting apps, saving for specific purchases, investing for retirement, planning dream vacation even if financially risky

SECURITY: Money = feeling safe and in control. EMOTIONAL financial safety in the moment. Financial vigilance and need to FEEL safe regardless of what facts say. May abandon logical plans if they don't FEEL safe emotionally.
Examples: Emergency fund obsession, checking accounts daily, anxious about bills even when financially stable, needs cash on hand to feel secure

SPONTANEOUS: Money = enjoy the moment. Acting impulsively when emotionally flooded. KNOWS better but does it anyway, then feels guilty after. Out of control with spending.
Examples: Impulse purchases when stressed, online shopping when bored, buying things they regret, emotional spending they know is wrong

CAREFREE: Money isn't a priority. GIVEN UP control (not out of control like Spontaneous). From past financial failures or never being given financial control. Lets life happen.
Examples: Doesn't check account balance, avoids financial decisions, lets others manage money, "it'll work out" attitude from learned helplessness

STATUS: Money = present positive image to others. Using money/items to fit in OR stand out. Impression on others matters. The focus returns to self - wants recognition.
Examples: Designer clothes to impress, newest tech to keep up, expensive car for image, brand-name everything, social media flexing

GIVING: Money = help others. ONLY outward-facing help. Genuine joy from giving with NO expectation of recognition. Focus stays on others, not self.
Examples: Anonymous donations, helping family without mention, paying friend's bill quietly, tithing, genuine generosity without wanting credit

INTENSITY MATTERS - Score Spectrum:
- 7-9 "That's Me" cards = VERY STRONG/EXTREME pattern - this dominates their financial behavior, almost compulsive
- 4-6 cards = MODERATE pattern - shows up regularly, significant but not overwhelming
- 1-3 cards = MILD pattern - occasional, subtle, background influence
- 0 cards = NOT PRESENT - this behavior doesn't describe them at all

Scale the behaviors in the backstory to match intensity. A 9 in Spontaneous = serious impulse control issues. A 4 in Spontaneous = occasional impulse buys.`;

  const systemPrompt = `You are creating a realistic character profile for a coaching client. Generate their identity and financial backstory.

${frameworkDefinitions}

CURRENT PROFILE INTENSITY:
${intensityContext}

Format your response as JSON:
{
  "name": "[realistic first name appropriate for their background]",
  "age": [realistic age for ${profile.persona}],
  "backstory": "[1 paragraph, 4-5 sentences about their financial situation]"
}

For the backstory paragraph, based on their Money Habitudes profile, include:
- Current financial situation (income range realistic for ${profile.persona}, debt/savings status)
- 2 specific MONEY BEHAVIORS tied to dominant habitudes (${dominantHabitudes.join(', ')}) - scale intensity to their scores
- 1 blind spot or anxiety related to low habitudes (${lowHabitudes.join(', ')})

CRITICAL - NATURAL HUMAN COMMUNICATION:
- Use the EXACT Money Habitudes definitions - don't use general life behaviors
- PLANNING = financial goal-setting, NOT life organization
- SECURITY = emotional need to feel financially safe, NOT general safety
- Scale behavior intensity to match scores (9 is extreme, 4 is moderate, 0 is absent)
- Make them talk/think like a REAL PERSON with these patterns, not someone analyzing their patterns diplomatically
- HIGH habitudes (7-9): They embody this naturally without hedging. High Spontaneous = justify impulses or feel guilty after, NOT "sometimes I wonder if it was wise"
- LOW habitudes (0-2): They genuinely don't do this, period. 0 Planning = actually don't set financial goals, NOT "sometimes I try to plan"
- Let them be definitive about some things, casual about others, unaware of blind spots - like actual humans
- Don't make them overly self-aware, balanced, or diplomatic - they have real patterns and real blind spots
- Be concise but specific. Include 1-2 specific numbers/situations.`;

  try {
    const result = await genAI.models.generateContent({
      model,
      config: { systemInstruction: systemPrompt },
      contents: [{
        role: 'user',
        parts: [{ text: `Create profile for: ${profile.persona}\n\nMoney Habitudes:\n- Spontaneous: ${profile.spontaneous_thats_me} thats_me\n- Status: ${profile.status_thats_me} thats_me\n- Carefree: ${profile.carefree_thats_me} thats_me\n- Planning: ${profile.planning_thats_me} thats_me\n- Giving: ${profile.giving_thats_me} thats_me\n- Security: ${profile.security_thats_me} thats_me` }]
      }]
    });
    
    const text = result.text;
    // Try to parse JSON from the response
    try {
      // Remove markdown code blocks if present
      const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(jsonText);
      return {
        name: parsed.name || 'Client',
        age: parsed.age || 30,
        backstory: parsed.backstory || text
      };
    } catch (parseErr) {
      // If JSON parsing fails, treat entire response as backstory
      return {
        name: 'Client',
        age: 30,
        backstory: text
      };
    }
  } catch (err) {
    return {
      name: 'Client',
      age: 30,
      backstory: `${profile.persona} with typical financial situation and money habits.`
    };
  }
}

