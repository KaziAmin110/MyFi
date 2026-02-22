import { supabase } from "../database/db";
import { generateEmbedding, callAI } from "../utils/ai.utils";
import type {
  ChatSession,
  ChatMessage,
  CoachingKnowledge,
  GetSessionsResponse,
  GetMessagesResponse,
  CreateSessionResponse,
  SendMessageResponse,
} from "../types/chat.types";

export const getUserSessions = async (userId: string) => {
  // Get sessions with their messages
  const { data, error } = await supabase
    .from("chat_sessions")
    .select(`
      *,
      messages:chat_messages(id, created_at)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error };

  // Transform to API response format
  const sessions = data.map((session: any) => {
    // Calculate message count
    const messageCount = session.messages?.length || 0;
    
    // Get last message timestamp
    const lastMessageAt = session.messages && session.messages.length > 0
      ? session.messages.reduce((latest: string, msg: any) => 
          msg.created_at > latest ? msg.created_at : latest
        , session.messages[0].created_at)
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

export const getSessionById = async (sessionId: string, userId: string) => {
  return await supabase
    .from("chat_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();
};

export const createSession = async (userId: string) => {
  // Get latest session number for this user
  const { data: latestSession } = await supabase
    .from("chat_sessions")
    .select("session_number")
    .eq("user_id", userId)
    .order("session_number", { ascending: false })
    .limit(1)
    .single();

  const nextSessionNumber = latestSession ? latestSession.session_number + 1 : 1;

  // Calculate week dates
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: userId,
      session_number: nextSessionNumber,
      week_start_date: weekStart.toISOString(),
      week_end_date: weekEnd.toISOString(),
      is_empty: true,
    })
    .select()
    .single();

  if (error) return { data: null, error };

  // Transform to API response format
  const session = {
    id: data.id,
    title: data.title,
    weekStartDate: data.week_start_date,
    weekEndDate: data.week_end_date,
    status: data.status,
    isReadOnly: data.is_read_only,
  };

  return { data: session, error: null };
};

export const getMessages = async (sessionId: string) => {
  // Get session info
  const { data: session, error: sessionError } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (sessionError) return { data: null, error: sessionError };

  // Get messages
  const { data: messages, error: messagesError } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (messagesError) return { data: null, error: messagesError };

  // Get summary if exists
  const { data: summaryData } = await supabase
    .from("chat_summaries")
    .select("summary_text")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

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
    summary: summaryData?.summary_text || null,
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

export const searchCoachingKnowledge = async (
  query: string,
  limit: number = 3
) => {
  const embedding = await generateEmbedding(query, "RETRIEVAL_QUERY");

  const { data, error } = await supabase.rpc("match_coaching_knowledge", {
    query_embedding: embedding,
    match_threshold: 0.7,
    match_count: limit,
  });

  return { data, error };
};

export const chat = async (
  sessionId: string,
  userId: string,
  userMessage: string
) => {
  // Verify session belongs to user
  const { data: session, error: sessionError } = await getSessionById(
    sessionId,
    userId
  );

  if (sessionError || !session) {
    return { data: null, error: sessionError || "Session not found" };
  }

  // Get conversation history (last 10 messages) - use raw query for chat context
  const { data: dbMessages, error: historyError } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (historyError) {
    return { data: null, error: historyError };
  }

  const conversationHistory =
    dbMessages?.slice(-10).map((msg: ChatMessage) => ({
      role: msg.role === "user" ? ("user" as const) : ("model" as const),
      text: msg.content,
    })) || [];

  // Search coaching knowledge
  const { data: knowledgeResults, error: searchError } =
    await searchCoachingKnowledge(userMessage);

  if (searchError) {
    console.error("Error searching coaching knowledge:", searchError);
  }

  // Build context from coaching knowledge
  const coachingContext =
    knowledgeResults
      ?.map((kb: CoachingKnowledge, index: number) => {
        return `[Knowledge ${index + 1}]\n${kb.content}\n`;
      })
      .join("\n") || "";

  // Build system prompt
  const systemPrompt = `You are a compassionate financial wellness coach using the Money Habitudes framework. Your goal is to help users understand their money behaviors without judgment.

Context from Coaching Knowledge:
${coachingContext}

Guidelines:
- Be warm, empathetic, and conversational
- Ask open-ended questions to understand their money story
- Help them recognize patterns in their spending and saving behaviors
- Use the Money Habitudes framework (Planning, Security, Spontaneous, Carefree, Status, Giving) when relevant
- Never give specific financial advice or product recommendations
- Focus on awareness and understanding, not fixing or judging
- Keep responses concise (2-3 paragraphs max)`;

  try {
    // Get AI response
    const aiResponse = await callAI(
      systemPrompt,
      userMessage,
      conversationHistory
    );

    // Save user message
    const { data: userMsg, error: userMsgError } = await saveMessage(
      sessionId,
      userMessage,
      "user"
    );

    if (userMsgError) {
      return { data: null, error: userMsgError };
    }

    // Save AI response
    const { data: aiMsg, error: aiMsgError } = await saveMessage(
      sessionId,
      aiResponse,
      "assistant"
    );

    if (aiMsgError) {
      return { data: null, error: aiMsgError };
    }

    // Mark session as active if first message
    if (session.is_empty) {
      await markSessionActive(sessionId);
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
