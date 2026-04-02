import { supabase } from "../database/db";
import { generateEmbedding, callAI } from "../utils/ai.utils";
import { buildCoachingBrief, formatBriefForPrompt } from "./coaching-brief.service";
import { getRelevantExercises, formatExercisesForPrompt } from "./coaching-exercises.service";
import type {
  ChatSession,
  ChatMessage,
  CoachingKnowledge,
  CreateSessionResponse,
  GetSessionsResponse,
  GetMessagesResponse,
  SendMessageResponse,
} from "../types/chat.types";
import {
  generateRollingSummary,
  getUserCoachingProfile,
  updateSessionRollingSummary,
  summarizePreviousSessionsIfNeeded,
  MESSAGE_WINDOW,
  SUMMARY_TRIGGER,
} from "./summarization.service";

export const getUserSessions = async (
  userId: string
): Promise<{ data: GetSessionsResponse["sessions"] | null; error: string | null }> => {

  // Get sessions with their messages
  const { data, error } = await supabase
    .from("chat_sessions")
    .select(`*, chat_messages(id, created_at)`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };

  // Transform to API response format
  const sessions = data.map((session: any) => {
    const messageCount = session.chat_messages?.length || 0;
    
    const lastMessageAt = session.chat_messages && session.chat_messages.length > 0
      ? session.chat_messages.reduce((latest: string, msg: any) => 
          msg.created_at > latest ? msg.created_at : latest
        , session.chat_messages[0].created_at)
      : null;

    return {
      id: session.id,
      title: session.title,
      weekStartDate: session.week_start_date,
      weekEndDate: session.week_end_date,
      status: session.status,
      isReadOnly: session.is_read_only,
      messageCount,
      lastMessageAt,
      createdAt: session.created_at,
    };
  });

  return { data: sessions, error: null };
};

export const getSessionById = async (
  sessionId: string,
  userId: string
): Promise<{ data: ChatSession | null; error: string | null }> => {
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as ChatSession, error: null };
};

// DB-only session creation — no AI calls. Used by the cron job.
export const createSessionRecord = async (
  userId: string
): Promise<{ data: CreateSessionResponse["session"] | null; error: string | null }> => {
  await supabase
    .from("chat_sessions")
    .update({ status: "completed", is_read_only: true })
    .eq("user_id", userId)
    .eq("status", "active");

  const { data: latestSession } = await supabase
    .from("chat_sessions")
    .select("session_number")
    .eq("user_id", userId)
    .order("session_number", { ascending: false })
    .limit(1)
    .single();

  const nextSessionNumber = latestSession ? latestSession.session_number + 1 : 1;

  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + diffToMonday);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: userId,
      session_number: nextSessionNumber,
      title: `Session ${nextSessionNumber}`,
      week_start_date: weekStart.toISOString(),
      week_end_date: weekEnd.toISOString(),
      is_empty: true,
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  return {
    data: {
      id: data.id,
      title: data.title,
      weekStartDate: data.week_start_date,
      weekEndDate: data.week_end_date,
      status: data.status,
      isReadOnly: data.is_read_only,
    },
    error: null,
  };
};

// Full session creation — summarizes previous sessions + generates opening message.
// Used for first session (assessment completion) and manual "New Session" button.
export const createSession = async (
  userId: string
): Promise<{ data: CreateSessionResponse["session"] | null; error: string | null }> => {
  const { error: summaryErr } = await summarizePreviousSessionsIfNeeded(userId);
  if (summaryErr) console.warn("[SUMMARIZATION FAILED]", summaryErr);

  const result = await createSessionRecord(userId);
  if (result.error || !result.data) return result;

  await generateOpeningMessage(result.data.id, userId);
  return result;
};

// Generate the AI's opening message + 3 conversation-route prompts for a new session.
// Called once at session creation. The message is saved to chat_messages,
// and the prompts are stored on chat_sessions.suggested_prompts.
const generateOpeningMessage = async (sessionId: string, userId: string): Promise<void> => {
  try {
    const { data: brief } = await buildCoachingBrief(userId);
    if (!brief?.hasAssessment) return; // No assessment yet — skip silently

    const coachingBriefContext = formatBriefForPrompt(brief);

    let userProfileContext = "";
    const { data: profile } = await getUserCoachingProfile(userId);
    if (profile) userProfileContext = profile;

    const systemPrompt = `You are MyFi, a Money Habitudes coaching assistant. Generate a warm opening message for a new coaching session.

## THIS USER'S ASSESSMENT RESULTS
${coachingBriefContext}

${userProfileContext ? `## YOUR HISTORY WITH THIS USER\nWhat you know from previous sessions:\n${userProfileContext}\n\nBuild on previous insights. Reference something specific from past sessions.\n` : ""}

## INSTRUCTIONS
Write a brief, warm opening message (2-3 sentences). If this is a returning user, reference something from their previous sessions. If this is their first session, welcome them and reference one interesting thing from their assessment results.

Keep your tone casual and direct — like a sharp friend who knows about money psychology. Use contractions. No therapy-speak.

After your greeting, on a new line write exactly:
PROMPTS:
prompt1|prompt2|prompt3

Each prompt is a SHORT reply the user might say back to you (6-12 words, under 50 chars). These are written in the USER's voice — first person, conversational. When the user taps one, it gets sent as their message in the chat, so it must read naturally as something a real person would type.

Examples of good prompts:
- "I want to talk about my overspending habits"
- "Let's dig into that exercise from last week"
- "Tell me more about my status patterns"
- "I've been thinking about how I save money"

Make them specific to this user's assessment results and history, and make sure they connect to your opening message.`;

    const aiResponse = await callAI(systemPrompt, "Generate opening message", []);

    // Parse message and prompts
    const parts = aiResponse.split("PROMPTS:");
    const messageContent = parts[0].trim();
    let prompts = [
      "I want to explore my dominant habitudes",
      "Tell me about a recent money decision I made",
      "What's been on my mind financially",
    ];

    if (parts[1]) {
      const parsed = parts[1].trim().split("|").map((p: string) => p.trim()).filter(Boolean);
      if (parsed.length >= 3) prompts = parsed.slice(0, 3);
    }

    // Save the opening message as a regular assistant message
    await saveMessage(sessionId, messageContent, "assistant");

    // Store the prompts on the session
    await supabase
      .from("chat_sessions")
      .update({ suggested_prompts: prompts })
      .eq("id", sessionId);
  } catch (err: any) {
    // Non-fatal — session still works, user just won't see an opening message
    console.warn("[OPENING MESSAGE]", err.message);
  }
};

export const getMessages = async (
  sessionId: string,
  userId?: string
): Promise<{ data: GetMessagesResponse | null; error: string | null }> => {
  // Run all three queries in parallel — ~3x faster than sequential
  const [sessionResult, messagesResult, summaryResult] = await Promise.all([
    supabase
      .from("chat_sessions")
      .select("*")
      .eq("id", sessionId)
      .single(),
    supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true }),
    supabase
      .from("chat_summaries")
      .select("summary_text")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
  ]);

  if (sessionResult.error) return { data: null, error: sessionResult.error.message };
  if (messagesResult.error) return { data: null, error: messagesResult.error.message };

  const session = sessionResult.data;
  let messages = messagesResult.data;

  // Fallback: if session has no messages, generate the opening message now
  if (messages.length === 0 && userId) {
    await generateOpeningMessage(sessionId, userId);
    const { data: refreshed } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    if (refreshed) messages = refreshed;

    // Re-fetch session to get updated suggested_prompts
    const { data: updatedSession } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();
    if (updatedSession) Object.assign(session, updatedSession);
  }

  // Transform to API response format
  const response: GetMessagesResponse = {
    session: {
      id: session.id,
      title: session.title,
      isReadOnly: session.is_read_only,
      weekStartDate: session.week_start_date,
      weekEndDate: session.week_end_date,
    },
    messages: messages.map((msg: ChatMessage) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: msg.created_at,
    })),
    summary: summaryResult.data?.summary_text || null,
    suggestedPrompts: session.suggested_prompts || [],
  };

  return { data: response, error: null };
};

export const saveMessage = async (
  sessionId: string,
  content: string,
  role: "user" | "assistant"
) => {
  return await supabase
    .from("chat_messages")
    .insert({
      session_id: sessionId,
      content: content,
      role: role,
    })
    .select()
    .single();
};

export const markSessionActive = async (sessionId: string) => {
  return await supabase
    .from("chat_sessions")
    .update({ is_empty: false })
    .eq("id", sessionId);
};

// Generate a short descriptive title from the first user message + AI response
const generateSessionTitle = async (
  sessionId: string,
  userMessage: string,
  aiResponse: string
): Promise<void> => {
  const title = await callAI(
    "You are a title generator. Given a coaching conversation's first exchange, produce a short descriptive title (3-6 words). Return ONLY the title, no quotes, no punctuation at the end.",
    `User: ${userMessage.slice(0, 300)}\nCoach: ${aiResponse.slice(0, 300)}`,
    []
  );

  const cleanTitle = title.trim().replace(/^["']|["']$/g, "").slice(0, 60);

  if (cleanTitle) {
    await supabase
      .from("chat_sessions")
      .update({ title: cleanTitle })
      .eq("id", sessionId);
  }
};

export const searchCoachingKnowledge = async (
  query: string,
  limit: number = 3
): Promise<{ data: CoachingKnowledge[] | null; error: string | null }> => {
  try {
    const embedding = await generateEmbedding(query, "RETRIEVAL_QUERY");

    const { data, error } = await supabase.rpc("match_coaching_knowledge", {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: limit,
    });

    if (error) return { data: null, error: error.message };
    return { data: data as CoachingKnowledge[], error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
};

export const chat = async (
  sessionId: string,
  userId: string,
  userMessage: string
): Promise<{ data: SendMessageResponse | null; error: string | null }> => {
  // Verify session belongs to user
  const { data: session, error: sessionError } = await getSessionById(
    sessionId,
    userId
  );

  if (sessionError || !session) {
    return { data: null, error: sessionError || "Session not found" };
  }

  // Get conversation history
  const { data: dbMessages, error: historyError } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (historyError) {
    return { data: null, error: historyError.message };
  }

  // Build conversation history with rolling summary for long conversations
  let conversationHistory: Array<{ role: "user" | "model"; text: string }>;
  let rollingContext = "";

  if (dbMessages && dbMessages.length > MESSAGE_WINDOW) {
    // Long conversation: keep last MESSAGE_WINDOW messages as full history
    conversationHistory = dbMessages.slice(-MESSAGE_WINDOW).map((msg: ChatMessage) => ({
      role: msg.role === "user" ? ("user" as const) : ("model" as const),
      text: msg.content,
    }));

    // Rolling summary: covers messages older than the window
    rollingContext = session.rolling_summary || "";
    const summaryCovers = session.rolling_summary_msg_count || 0;
    const olderMsgCount = dbMessages.length - MESSAGE_WINDOW;

    // Update rolling summary when enough unsummarized messages accumulate
    if (olderMsgCount - summaryCovers >= SUMMARY_TRIGGER) {
      const unsummarized = dbMessages.slice(summaryCovers, olderMsgCount);
      const { data: newSummary, error: rollErr } = await generateRollingSummary(
        rollingContext,
        unsummarized.map((m: ChatMessage) => ({ role: m.role, content: m.content }))
      );
      if (rollErr) {
        console.warn("[ROLLING SUMMARY]", rollErr);
      } else if (newSummary) {
        rollingContext = newSummary;
        const { error: updateErr } = await updateSessionRollingSummary(sessionId, rollingContext, olderMsgCount);
        if (updateErr) console.warn("[ROLLING SUMMARY] DB update failed:", updateErr);
      }
    }
  } else {
    // Short conversation: use all messages
    conversationHistory = (dbMessages || []).map((msg: ChatMessage) => ({
      role: msg.role === "user" ? ("user" as const) : ("model" as const),
      text: msg.content,
    }));
  }

  const isFirstMessage = !dbMessages || dbMessages.length === 0;

  // Build coaching brief from user's assessment data (REQUIRED)
  const { data: brief, error: briefError } = await buildCoachingBrief(userId);
  if (briefError || !brief) return { data: null, error: briefError || "Failed to build coaching brief" };

  if (!brief.hasAssessment) {
    return { data: null, error: "ASSESSMENT_REQUIRED" };
  }

  const coachingBriefContext = formatBriefForPrompt(brief);
  let exercisesContext = "";

  if (brief.profileSummary) {
    const allHabitudes = [
      ...brief.profileSummary.dominant,
      ...brief.profileSummary.subdominant,
      ...brief.profileSummary.low,
    ];
    const exercises = getRelevantExercises(allHabitudes);
    exercisesContext = formatExercisesForPrompt(exercises);
  }

  // Get user coaching profile (cross-session memory)
  let userProfileContext = "";
  const { data: profile, error: profileError } = await getUserCoachingProfile(userId);
  if (profileError) console.warn("[COACHING PROFILE]", profileError);
  if (profile) userProfileContext = profile;

  // Search coaching knowledge (RAG supplement)
  let coachingKnowledgeContext = "";
  const { data: knowledgeResults, error: searchError } = await searchCoachingKnowledge(userMessage);
  if (searchError) console.warn("[RAG SEARCH]", searchError);
  coachingKnowledgeContext = knowledgeResults
    ?.map((kb: CoachingKnowledge, index: number) => `[Reference ${index + 1}]\n${kb.content}`)
    .join("\n\n") || "";

  // Build system prompt
  const systemPrompt = `You are MyFi, a Money Habitudes coaching assistant. You help people understand their relationship with money through the Money Habitudes card-sorting framework.

## YOUR IDENTITY
- You are an AI coaching assistant, NOT a human coach. Never pretend otherwise.
- You use the Money Habitudes framework created by Syble Solomon.
- You are warm, direct, and genuinely curious — you love finding patterns in people's money stories.
- You speak casually and naturally — like a sharp friend who happens to know a lot about money psychology. Not a therapist.
- You normalize everything. Everyone has money patterns. None are inherently "bad." Say things like "a lot of people carry that same pattern."
- When you spot a pattern, you NAME it plainly: "So basically, you're the family bank" or "That's what we call an inherited habitude."

## THE SIX HABITUDES
1. **Planning** — Researching, goal-setting, budgeting, tracking spending
2. **Security** — Saving for emergencies, insurance, preparing for worst-case
3. **Spontaneous** — Impulse buying, living in the moment, "retail therapy"
4. **Carefree** — Not thinking about money, avoiding bills, "it'll work out"
5. **Status** — Buying brands, keeping up appearances, money = success signal
6. **Giving** — Generosity, lending, picking up the check, hard to say no

## CARD PLACEMENT MEANINGS
- **"That's Me"** = Strong identification (high count = dominant habitude)
- **"Sometimes Me"** = Situational or conflicted — THE MOST INTERESTING cards to explore. A "Sometimes" card means one of four things: (a) a one-time event they carry shame about, (b) frequent behavior they undercount, (c) conditional — only in certain situations/with certain people, (d) black-and-white thinking ("if it's not 100%, it's sometimes"). Use When/What/Who/Where/How to figure out which.
- **"Not Me"** = Rejected behavior (7+ cards = potentially inherited/reactive habitude — they may be rejecting a pattern they saw in a parent or caretaker)

## THIS USER'S ASSESSMENT RESULTS
${coachingBriefContext}

${userProfileContext ? `## YOUR HISTORY WITH THIS USER\nWhat you know from previous sessions:\n${userProfileContext}\n\nBuild on this. Reference past insights, go deeper into new areas. Don't re-ask things they already told you.\n` : ""}

${rollingContext ? `## EARLIER IN THIS CONVERSATION\nSummary of earlier messages:\n${rollingContext}\nMaintain continuity — don't repeat questions or re-explore topics already covered.\n` : ""}

## COACHING RULES
1. **One question at a time.** Never stack 2+ questions in one message.
2. **Use When/What/Who/Where/How.** Never ask "Why" — it triggers defensiveness.
3. **Follow their energy.** If they bring up a topic, explore it before moving on. Don't force your agenda.
4. **Name the pattern, then ask about it.** "So it sounds like security is your anchor. What does that actually look like for you?"
5. **Dig into "Sometimes" cards.** This is where the real coaching happens. Ask: "When does that show up?" / "What's happening when you lean that way?" / "Who are you with when that happens?"
6. **Spot tensions.** High Spontaneous + High Planning = internal conflict. Name it: "Interesting combo — you're a planner AND spontaneous. How do those play out together?"
7. **Explore inherited habitudes.** If 7+ "Not Me" cards in a category, ask: "Did someone in your life have strong [habitude] patterns? Sometimes we reject what we grew up around."
8. **Explore the WHO.** There's almost always a person behind a money pattern. Ask who taught them that, who they're doing it for, or who they're reacting against.
9. **Ask about severity and frequency.** "How often does that happen?" / "How much does that actually stress you?"
10. **Keep responses concise.** Aim for 50-150 words. Go shorter for follow-up questions, a bit longer when explaining a habitude concept. The question at the end is always the most important part of your message.
11. **Never give specific financial advice** (no stock picks, product recommendations, or budget numbers).
12. **Suggest exercises naturally** — only when relevant to what they're already discussing.

## RESPONSE STYLE — CRITICAL
- **Your core move: Spot → Name → Ask.** Pick up ONE detail from what they said, name the pattern you see, ask one focused question. That's it. Don't try to address everything they said.
- **Brief confirms are fine. Paragraph reflections are NOT.** "So basically, you handle the money stress so your family doesn't have to" — that's a good short confirm. Spending two sentences repeating what they said is not. They know what they said.
- **DO NOT over-affirm.** Skip: "That's really powerful," "Thank you for sharing," "I appreciate your vulnerability." Say: "Yeah, that makes sense" or "That's interesting" or just go straight to the question.
- **NEVER start a message with "That's a really..."** — no "That's a really clear/honest/sharp/interesting/powerful/important" openings. Vary your openers. Start with the pattern name, a short confirm, a direct observation, or just the question.
- **Avoid the word "really" as filler.** Don't say "really clear," "really common," "really interesting." Drop the "really" — it adds nothing. Say "clear," "common," "interesting."
- **DO NOT use therapy/academic vocabulary.** Never say: "bridge that gap," "tangible symbol," "internal self-worth," "somatic," "holding space," "safe container," "resonates." Plain English only.
- **DO NOT ask "how does that feel in your body?"** Ask practical questions: "What does that look like day to day?" / "When does that actually come up?"
- **DO NOT start messages with compliments about the user's insight.** Just respond.
- **BE DIRECT.** If you see it, say it plainly. "So the car is your trophy for making it" — not "It sounds like you're beginning to realize that the external validation might not truly resonate..."
- **Use contractions.** Sound human.
- **Mirror their language.** If they say "kinda scary," say "scary," not "anxiety-inducing."

${isFirstMessage ? `## FIRST MESSAGE FLOW
This is the start of a new conversation. Open warmly:
- Greet them by name if available
- Reference ONE interesting thing from their assessment results (a tension, a dominant habitude, or a "Sometimes" pattern) and ask about it
- Keep it to 2-3 sentences. Don't overwhelm.` : ""}

${exercisesContext ? `## AVAILABLE EXERCISES\nSuggest ONLY when naturally relevant. Don't list them unprompted.\n${exercisesContext}\n` : ""}

${coachingKnowledgeContext ? `## REFERENCE MATERIAL\n${coachingKnowledgeContext}\n` : ""}

## TONE EXAMPLES
Good:
- "So basically, you're the family bank."
- "What does that actually look like day to day?"
- "That's interesting — so it only happens when you're with your coworkers?"
- "A lot of people carry that same pattern from their family."
- "Makes sense. What happens when the plan falls apart?"
- "Yeah, that's a real tension to sit with."
- "When you say 'careful' — careful how?"
- "Who taught you that money works that way?"
- "Tell me about a time that actually happened."
- "How often does that come up?"

Bad (NEVER use these):
- "That's a really clear distinction." ← filler opener, drop "really"
- "That's a really powerful and vulnerable insight." ← therapy-speak
- "That's a really honest answer." ← compliment opener, just respond
- "I really appreciate you sharing that with me." ← performative
- "It sounds like you're realizing that the external validation might not truly resonate if it's not built on a foundation of internal self-worth." ← way too long, academic
- "How does that feel in your body?" ← not money coaching
- "Thank you for being so honest." ← patronizing
- "That's profound." ← over-the-top
- "You're touching on something really important here." ← stalling instead of coaching`;

  try {
    // Get AI response FIRST — if this fails, nothing gets saved
    const aiResponse = await callAI(
      systemPrompt,
      userMessage,
      conversationHistory
    );

    // Save both messages together — prevents orphaned user messages without a response
    const { data: userMsg, error: userMsgError } = await saveMessage(
      sessionId,
      userMessage,
      "user"
    );

    if (userMsgError) {
      return { data: null, error: userMsgError.message };
    }

    const { data: aiMsg, error: aiMsgError } = await saveMessage(
      sessionId,
      aiResponse,
      "assistant"
    );

    if (aiMsgError) {
      // User message was saved but AI message failed — delete the orphaned user message
      await supabase.from("chat_messages").delete().eq("id", userMsg!.id);
      return { data: null, error: aiMsgError.message };
    }

    // Mark session as active and generate AI title on first message
    if (session.is_empty) {
      await markSessionActive(sessionId);
      // Fire-and-forget: generate a short descriptive title from the first exchange
      generateSessionTitle(sessionId, userMessage, aiResponse).catch((err) =>
        console.warn("[SESSION TITLE]", err.message)
      );
    }

    // Transform to API response format
    const response: SendMessageResponse = {
      userMessage: {
        id: userMsg!.id,
        role: "user",
        content: userMsg!.content,
        createdAt: userMsg!.created_at,
      },
      assistantMessage: {
        id: aiMsg!.id,
        role: "assistant",
        content: aiMsg!.content,
        createdAt: aiMsg!.created_at,
      },
    };

    return { data: response, error: null };
  } catch (error: any) {
    console.error("Error in chat service:", error);
    return { data: null, error: error.message };
  }
};
