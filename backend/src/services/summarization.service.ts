// Handles all memory management for the coaching system.
// Three levels: (1) rolling summary within a session, (2) session summary at session end,
// (3) user coaching profile accumulated across all sessions.

import { supabase } from "../database/db";
import { callAI, generateEmbedding } from "../utils/ai.utils";

export const MESSAGE_WINDOW = 20;
export const SUMMARY_TRIGGER = 10;

// Generates or updates a rolling summary of older messages within a session
export const generateRollingSummary = async (
  existingSummary: string,
  messages: Array<{ role: string; content: string }>
): Promise<{ data: string | null; error: string | null }> => {
  try {
    const messageText = messages
      .map((m) => `${m.role === "user" ? "User" : "Cara"}: ${m.content}`)
      .join("\n\n");

    const prompt = existingSummary
      ? `Here is the existing summary of earlier messages:\n\n${existingSummary}\n\nHere are new messages since that summary:\n\n${messageText}\n\nCreate an UPDATED summary that merges both. Capture:\n- Key things the user revealed (life context, relationships, emotions, cultural background)\n- Specific money patterns or behaviors discussed\n- Breakthroughs or moments of realization\n- Topics started but not fully explored (note the depth: "briefly mentioned" vs "partially explored" vs "deeply discussed")\n- The user's emotional state and comfort level\n- Any exercises suggested or commitments made\n\n4-6 sentences. Preserve specific details (names, amounts, situations) — don't generalize.`
      : `Here are coaching conversation messages:\n\n${messageText}\n\nSummarize this conversation segment. Capture:\n- Key things the user revealed (life context, relationships, emotions)\n- Specific money patterns or behaviors discussed\n- Breakthroughs or moments of realization\n- Topics started but not fully explored\n- The user's emotional state and comfort level\n\n3-5 sentences. Preserve specific details — don't generalize.`;

    const summary = await callAI(
      "You are a coaching conversation summarizer. Your summaries maintain context so the coach remembers what was discussed. Be precise. Preserve specific details (names, amounts, situations). Note both what WAS discussed AND what was LEFT unexplored.",
      prompt,
      []
    );

    return { data: summary, error: null };
  } catch (err: any) {
    console.error("Error generating rolling summary:", err.message);
    return { data: null, error: err.message };
  }
};

// Persists the rolling summary to the chat_sessions table
export const updateSessionRollingSummary = async (
  sessionId: string,
  summary: string,
  msgCount: number
): Promise<{ error: string | null }> => {
  const { error } = await supabase
    .from("chat_sessions")
    .update({
      rolling_summary: summary,
      rolling_summary_msg_count: msgCount,
    })
    .eq("id", sessionId);

  if (error) return { error: error.message };
  return { error: null };
};

// Generates a summary for a completed session and stores it in chat_summaries.
// Called lazily when a user creates a new session.
export const generateSessionSummary = async (
  sessionId: string
): Promise<{ data: string | null; error: string | null }> => {
  try {
    // Fetch all messages
    const { data: messages, error } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) return { data: null, error: error.message };
    if (!messages || messages.length === 0) return { data: null, error: null };

    // Get rolling summary and user_id from the session
    const { data: session } = await supabase
      .from("chat_sessions")
      .select("rolling_summary, user_id")
      .eq("id", sessionId)
      .single();

    // Look up the user's first name
    let firstName = "there";
    if (session?.user_id) {
      const { data: userRow } = await supabase
        .from("users")
        .select("name")
        .eq("id", session.user_id)
        .single();
      if (userRow?.name) {
        firstName = userRow.name.split(" ")[0];
      }
    }

    // Build the conversation text from the most recent messages
    const recentMessages = messages.slice(-20);
    const messageText = recentMessages
      .map((m: any) => `${m.role === "user" ? "User" : "Cara"}: ${m.content}`)
      .join("\n\n");

    const contextPrefix = session?.rolling_summary
      ? `Earlier in this conversation (summarized):\n${session.rolling_summary}\n\nMost recent messages:\n`
      : "";

    // Generate both summaries in parallel — AI-internal and user-facing
    const [summary, userSummary] = await Promise.all([
      callAI(
        "You are summarizing a completed coaching session. Your summary will be used in future sessions so the coach remembers what happened. Be specific and preserve important details.",
        `${contextPrefix}${messageText}\n\nSummarize this complete coaching session in 4-6 sentences. Include:\n- What topics were discussed and to what depth (briefly touched / partially explored / deeply discussed with breakthrough)\n- What the user revealed about themselves, their life, their feelings about money\n- Any breakthroughs, realizations, or emotional moments\n- What coaching areas remain unexplored or were only briefly touched\n- Any exercises suggested or commitments the user made\n- How comfortable the user seemed and areas they might have avoided`,
        []
      ),
      callAI(
        `You are writing a brief, warm recap that ${firstName} will read when they look back at this completed coaching session. Write in second person. Sound like a real person, not a report. This session is already over — write entirely in the past tense. Do not list everything that was discussed. Pick the most meaningful moments or insights from the conversation and say it simply. 4-8 sentences maximum.`,
        `${contextPrefix}${messageText}\n\nWrite a 4-6 sentence recap. Focus on the things that mattered most — a realization, a connection they made, or something they uncovered about themselves. Be specific but brief. Sound warm and human, not clinical.`,
        []
      ),
    ]);

    // Generate embedding for semantic search in future sessions
    const embedding = await generateEmbedding(summary, "RETRIEVAL_DOCUMENT");

    // Store AI-internal summary in chat_summaries (used for RAG)
    const { error: insertError } = await supabase
      .from("chat_summaries")
      .insert({
        session_id: sessionId,
        summary_text: summary,
        embedding: embedding,
      });

    if (insertError) {
      console.warn("[SESSION SUMMARY] Failed to store:", insertError.message);
    }

    // Store user-facing summary on the session row
    const { error: userSummaryError } = await supabase
      .from("chat_sessions")
      .update({ user_summary: userSummary })
      .eq("id", sessionId);

    if (userSummaryError) {
      console.warn("[USER SUMMARY] Failed to store:", userSummaryError.message);
    }

    return { data: summary, error: null };
  } catch (err: any) {
    console.error("Error generating session summary:", err.message);
    return { data: null, error: err.message };
  }
};

// Updates the user's accumulated coaching profile with insights from a new session.
// Progressive merge: each session's insights get folded into the overall profile.
export const updateUserCoachingProfile = async (
  userId: string,
  sessionSummary: string
): Promise<{ error: string | null }> => {
  try {
    // Get existing profile
    const { data: existing } = await supabase
      .from("user_coaching_profiles")
      .select("coaching_summary, sessions_summarized")
      .eq("user_id", userId)
      .maybeSingle();

    let newSummary: string;

    if (existing && existing.coaching_summary) {
      // Merge existing profile with new session
      newSummary = await callAI(
        "You maintain a coaching client's long-term profile. This profile accumulates across all sessions and is the coach's primary reference. Preserve ALL important information — compress older details but never drop them entirely.",
        `Here is the existing coaching profile:\n\n${existing.coaching_summary}\n\nHere is what happened in their latest session:\n\n${sessionSummary}\n\nProduce an UPDATED coaching profile. The profile must capture:\n- Who this person is (life context, relationships, cultural background, occupation)\n- Their dominant money patterns and habitudes\n- Key insights and breakthroughs across ALL sessions (not just the latest)\n- Topic depth tracking — for each major area, note how deeply it has been explored:\n  • "briefly mentioned" = came up but wasn't explored\n  • "partially explored" = discussed but more depth needed\n  • "deeply explored" = significant discussion, user had insights\n  • "breakthrough" = user had a realization or shift in perspective\n  • "user avoided/deflected" = topic was raised but user seemed uncomfortable\n- Growth or changes observed over time (compare early sessions to recent ones)\n- Exercises suggested and whether user followed through\n- Emotional patterns (what they're comfortable discussing vs what they avoid)\n- What to explore next\n\n8-12 sentences. This is the coach's complete reference for this person.`,
        []
      );
    } else {
      // First session — create initial profile
      newSummary = await callAI(
        "You are creating a coaching client profile from their first session. This will be the coach's reference for all future conversations with this person.",
        `Here is what happened in this user's first coaching session:\n\n${sessionSummary}\n\nCreate an initial coaching profile. Include:\n- What we know about who they are\n- Their money patterns based on what was discussed\n- Topics explored and how deeply\n- Topics that remain to explore\n- Their comfort level with money conversations\n- Any next steps or exercises suggested\n\n4-6 sentences.`,
        []
      );
    }

    const sessionsCount = (existing?.sessions_summarized || 0) + 1;

    // Upsert the profile
    const { error } = await supabase.from("user_coaching_profiles").upsert(
      {
        user_id: userId,
        coaching_summary: newSummary,
        sessions_summarized: sessionsCount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    console.error("Error updating coaching profile:", err.message);
    return { error: err.message };
  }
};

// Returns the user's coaching profile for injection into the system prompt
export const getUserCoachingProfile = async (
  userId: string
): Promise<{ data: string | null; error: string | null }> => {
  const { data, error } = await supabase
    .from("user_coaching_profiles")
    .select("coaching_summary, sessions_summarized")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data || !data.coaching_summary) return { data: null, error: null };

  return { data: data.coaching_summary, error: null };
};

// Checks for previous sessions that have messages but no summary.
// Called lazily when a user creates a new session.
export const summarizePreviousSessionsIfNeeded = async (
  userId: string
): Promise<{ error: string | null }> => {
  // Find non-empty sessions for this user
  const { data: sessions, error: fetchError } = await supabase
    .from("chat_sessions")
    .select("id, session_number")
    .eq("user_id", userId)
    .eq("is_empty", false)
    .order("created_at", { ascending: false })
    .limit(5);

  if (fetchError) return { error: fetchError.message };
  if (!sessions || sessions.length === 0) return { error: null };

  for (const session of sessions) {
    // Check if this session already has a summary
    const { data: existingSummary } = await supabase
      .from("chat_summaries")
      .select("id")
      .eq("session_id", session.id)
      .maybeSingle();

    if (!existingSummary) {
      console.log(`Generating summary for session ${session.id} (session #${session.session_number})`);
      const { data: summary, error: summaryErr } = await generateSessionSummary(session.id);

      if (summaryErr) {
        console.warn(`[SESSION SUMMARY] Failed for session ${session.id}:`, summaryErr);
        continue;
      }

      if (summary) {
        const { error: profileErr } = await updateUserCoachingProfile(userId, summary);
        if (profileErr) {
          console.warn(`[COACHING PROFILE] Failed to update:`, profileErr);
        } else {
          console.log(`Session ${session.id} summarized and profile updated`);
        }
      }
    }
  }

  return { error: null };
};
