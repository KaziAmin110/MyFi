import { supabase } from "../database/db";
import { HabitudeAnalyzer } from "./habitude-analyzer.service";
import type {
  HabitudeProfile,
  CardPlacement,
  CoachingBrief,
} from "../types/coaching.types";

// ── Core Functions ──

// Returns the user's latest completed assessment session ID and results
const getLatestCompletedSession = async (
  userId: string
): Promise<{ sessionId: string; results: any } | null> => {
  const { data, error } = await supabase
    .from("assessment_sessions")
    .select("id, results")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return { sessionId: data.id, results: data.results };
};

// Fetches all individual card placements for an assessment session
const getCardPlacements = async (
  sessionId: string
): Promise<CardPlacement[]> => {
  const { data, error } = await supabase
    .from("assessment_responses")
    .select(
      `
      answer_value,
      question_id,
      questions!inner (
        id,
        question_text,
        habitude_type,
        order_index
      )
    `
    )
    .eq("session_id", sessionId)
    .order("questions(order_index)", { ascending: true });

  if (error || !data) return [];

  return data.map((row: any) => {
    const val = Number(row.answer_value);
    let pile: CardPlacement["pile"];
    if (val === 1) pile = "thats_me";
    else if (val === 0) pile = "sometimes_me";
    else pile = "not_me";

    return {
      question_id: row.questions.id,
      question_text: row.questions.question_text,
      habitude_type: row.questions.habitude_type,
      pile,
      answer_value: val,
    };
  });
};

// Converts the results JSON into a HabitudeProfile
const buildProfile = (results: any): HabitudeProfile => {
  // Results format from calculateSessionResults:
  // { planning: { thats_me: N, sometimes_me: N, not_me: N }, ... }
  const defaultPile = { thats_me: 0, sometimes_me: 0, not_me: 0 };

  return {
    planning: { ...defaultPile, ...results.planning },
    security: { ...defaultPile, ...results.security },
    spontaneous: { ...defaultPile, ...results.spontaneous },
    carefree: { ...defaultPile, ...results.carefree },
    status: { ...defaultPile, ...results.status },
    giving: { ...defaultPile, ...results.giving },
  };
};

// Builds the complete coaching brief for a user (1-2 DB queries + pure computation)
export const buildCoachingBrief = async (
  userId: string
): Promise<{ data: CoachingBrief | null; error: string | null }> => {
  try {
    // 1. Get latest completed assessment
    const session = await getLatestCompletedSession(userId);

    if (!session) {
      return {
        data: {
          hasAssessment: false,
          profile: null,
          cardPlacements: [],
          analysis: null,
          tensions: [],
          profileSummary: null,
        },
        error: null,
      };
    }

    // 2. Get individual card placements
    const cards = await getCardPlacements(session.sessionId);

    // 3. Build habitude profile
    const profile = buildProfile(session.results);

    // 4. Run pattern analysis (pure computation, <1ms)
    const analysis = HabitudeAnalyzer.analyzeProfile(profile);

    // 5. Find interesting tensions in card placements
    const tensions = HabitudeAnalyzer.findTensions(cards);

    // 6. Get profile summary
    const profileSummary = HabitudeAnalyzer.getProfileSummary(profile);

    return {
      data: {
        hasAssessment: true,
        profile,
        cardPlacements: cards,
        analysis,
        tensions,
        profileSummary,
      },
      error: null,
    };
  } catch (err: any) {
    console.error("Error building coaching brief:", err.message);
    return { data: null, error: err.message };
  }
};

// Formats the coaching brief into the text block injected into the system prompt
export const formatBriefForPrompt = (brief: CoachingBrief): string => {
  if (!brief.hasAssessment || !brief.profile || !brief.analysis) {
    throw new Error("Cannot format coaching brief: assessment data is missing");
  }

  const { profile, analysis, tensions, profileSummary, cardPlacements } = brief;

  let prompt = "";

  // ── Profile Summary ──
  prompt += `════════════════════════════════════════
USER'S MONEY HABITUDES PROFILE
════════════════════════════════════════
`;
  prompt += `Planning: ${profile.planning.thats_me} That's Me | ${profile.planning.sometimes_me} Sometimes | ${profile.planning.not_me} Not Me\n`;
  prompt += `Security: ${profile.security.thats_me} That's Me | ${profile.security.sometimes_me} Sometimes | ${profile.security.not_me} Not Me\n`;
  prompt += `Spontaneous: ${profile.spontaneous.thats_me} That's Me | ${profile.spontaneous.sometimes_me} Sometimes | ${profile.spontaneous.not_me} Not Me\n`;
  prompt += `Carefree: ${profile.carefree.thats_me} That's Me | ${profile.carefree.sometimes_me} Sometimes | ${profile.carefree.not_me} Not Me\n`;
  prompt += `Status: ${profile.status.thats_me} That's Me | ${profile.status.sometimes_me} Sometimes | ${profile.status.not_me} Not Me\n`;
  prompt += `Giving: ${profile.giving.thats_me} That's Me | ${profile.giving.sometimes_me} Sometimes | ${profile.giving.not_me} Not Me\n`;

  if (profileSummary) {
    if (profileSummary.dominant.length > 0)
      prompt += `\nDominant habitudes: ${profileSummary.dominant.join(", ")}\n`;
    if (profileSummary.subdominant.length > 0)
      prompt += `Sub-dominant: ${profileSummary.subdominant.join(", ")}\n`;
    if (profileSummary.low.length > 0)
      prompt += `Low/absent: ${profileSummary.low.join(", ")}\n`;
  }

  // ── Red Flags ──
  if (analysis.redFlags.length > 0) {
    prompt += `\n🚨 RED FLAGS (HIGHEST PRIORITY — READ CAREFULLY):\n`;
    for (const flag of analysis.redFlags) {
      prompt += `\nTYPE: ${flag.type.toUpperCase()} (Severity: ${flag.severity})\n`;
      prompt += `${flag.description}\n`;
      prompt += `COACHING ACTION: ${flag.coaching_action}\n`;
    }
  }

  // ── Warnings ──
  if (analysis.warnings.length > 0) {
    prompt += `\n════════════════════════════════════════
PATTERN WARNINGS
════════════════════════════════════════\n`;
    for (const w of analysis.warnings) {
      prompt += `\n[${w.type}]\n${w.description}\nCoaching Focus: ${w.coaching_focus}\n`;
    }
  }

  // ── Inherited Habitudes ──
  if (analysis.inheritedHabitudes.length > 0) {
    prompt += `\n════════════════════════════════════════
INHERITED HABITUDES (Trauma-Based Patterns)
════════════════════════════════════════\n`;
    for (const ih of analysis.inheritedHabitudes) {
      prompt += `\n${ih.habitude.toUpperCase()}: ${ih.evidence}\nApproach: ${ih.coaching_approach}\n`;
    }
  }

  // ── Strengths ──
  if (analysis.strengths.length > 0) {
    prompt += `\nSTRENGTHS:\n`;
    for (const s of analysis.strengths) {
      prompt += `- ${s.habitude}: ${s.description}\n`;
    }
  }

  // ── Coaching Priorities ──
  prompt += `\n════════════════════════════════════════
YOUR COACHING PRIORITIES (in order)
════════════════════════════════════════\n`;
  analysis.coachingPriorities.forEach((p, i) => {
    prompt += `${i + 1}. ${p}\n`;
  });

  // ── Interesting Tensions ──
  if (tensions.length > 0) {
    prompt += `\n════════════════════════════════════════
INTERESTING TENSIONS TO EXPLORE
(These are contradictions or exceptions in the user's card sort — exactly what Cara would pick up on)
════════════════════════════════════════\n`;
    // Limit to top 3 most interesting
    const topTensions = tensions.slice(0, 3);
    for (const t of topTensions) {
      prompt += `\n${t.description}\nSuggested question: "${t.coaching_question}"\n`;
    }
  }

  // ── Key "Sometimes" Cards ──
  const sometimesCards = cardPlacements.filter((c) => c.pile === "sometimes_me");
  if (sometimesCards.length > 0) {
    prompt += `\n════════════════════════════════════════
USER'S "SOMETIMES" CARDS (Where transformation happens)
════════════════════════════════════════\n`;
    // Group by habitude
    const byHab: Record<string, string[]> = {};
    for (const c of sometimesCards) {
      if (!byHab[c.habitude_type]) byHab[c.habitude_type] = [];
      byHab[c.habitude_type].push(c.question_text);
    }
    for (const [hab, texts] of Object.entries(byHab)) {
      prompt += `\n${hab.toUpperCase()} (Sometimes):\n`;
      texts.forEach((t) => (prompt += `  - "${t}"\n`));
    }
    prompt += `\nRemember: "Sometimes" means one of four things:\n`;
    prompt += `1. One-time event they still carry shame about\n`;
    prompt += `2. Frequent behavior they don't recognize as frequent\n`;
    prompt += `3. Conditional behavior (only with certain people/places/times)\n`;
    prompt += `4. Black-and-white thinker — "if it's not 100%, it's sometimes"\n`;
    prompt += `Use When/What/Who/Where/How to explore which type it is.\n`;
  }

  return prompt;
};
