// Curated actionable exercises mapped to habitude patterns.
// Injected into the system prompt so the AI can suggest relevant exercises.

import type { CoachingExercise } from "../types/coaching.types";

export const COACHING_EXERCISES: CoachingExercise[] = [
  // ── Indecisiveness / Large "That's Me" pile ──
  {
    id: "decisive_practice",
    situation: "User is indecisive, has many cards across multiple habitudes, or struggles to make financial decisions",
    exercise:
      "This week, practice making one small decision each day without second-guessing. Pick what to eat for dinner, what to watch, what to wear — and commit to it. Notice how it feels to just decide.",
    duration: "1 week",
    habitudes_relevant: ["general", "carefree"],
  },

  // ── Security-dominant, can't spend ──
  {
    id: "small_joy_purchase",
    situation: "User is security-dominant and struggles to spend money even when they can afford to",
    exercise:
      "Buy one small thing for yourself this week purely for enjoyment — under $10. A coffee you love, a song, a treat. Pay attention to how it feels, not what it costs.",
    duration: "1 week",
    habitudes_relevant: ["security"],
  },

  // ── Hidden spontaneous behavior / shame ──
  {
    id: "awareness_tracking",
    situation: "User has spontaneous spending they feel guilty about or hide from others",
    exercise:
      "For one week, track every purchase — not to judge yourself, just to notice. Write it down or use your phone notes. At the end of the week, look at the list and ask: what patterns do I see? No changing behavior yet, just observing.",
    duration: "1 week",
    habitudes_relevant: ["spontaneous"],
  },

  // ── Planning-giving tension (family obligations) ──
  {
    id: "honest_conversation",
    situation: "User feels tension between giving to family and their own financial goals, especially cultural/immigrant family dynamics",
    exercise:
      "Have one honest conversation this week about your own financial goals — with a family member, partner, or close friend. It doesn't have to be confrontational. Just share one thing you're saving for or working toward.",
    duration: "1 week",
    habitudes_relevant: ["planning", "giving"],
  },

  // ── Status awareness ──
  {
    id: "status_pause",
    situation: "User's spending may be driven by what others think or by maintaining appearances",
    exercise:
      'Before your next purchase over $50, pause and ask yourself: "Am I buying this for me, or for others to see?" There\'s no wrong answer — just notice which it is.',
    duration: "Ongoing",
    habitudes_relevant: ["status"],
  },

  // ── Conditional giving / "stingy" label ──
  {
    id: "unconditional_gift",
    situation: "User gives with conditions attached (accountability questions, expecting reciprocation) and it causes relationship friction",
    exercise:
      "This week, give something — time, money, or help — to someone without any conditions. No follow-up questions about how they use it. Just give and let go. Notice how it feels different.",
    duration: "1 week",
    habitudes_relevant: ["giving", "planning"],
  },

  // ── Carefree / disengaged from finances ──
  {
    id: "one_financial_question",
    situation: "User lets others handle their finances or doesn't engage with money decisions",
    exercise:
      "This week, ask one question about your finances that you normally wouldn't. Check your bank balance, ask a partner about a bill, or look up one thing you've been avoiding. Just one small step into engagement.",
    duration: "1 week",
    habitudes_relevant: ["carefree"],
  },

  // ── Inherited habitudes / childhood patterns ──
  {
    id: "first_money_memory",
    situation: "User shows signs of inherited habitudes (strong aversions, extreme rigidity, or patterns that mirror/rebel against a parent)",
    exercise:
      "This week, think about your earliest memory involving money. Write it down — just a paragraph. Who was there? How did you feel? You don't have to share it with anyone. Just notice if it connects to how you handle money now.",
    duration: "1 week",
    habitudes_relevant: ["general"],
  },

  // ── Rigid planner who can't pivot ──
  {
    id: "flexibility_experiment",
    situation: "User is a rigid planner who struggles to deviate from their plan even when circumstances change",
    exercise:
      "Pick one planned activity this week and intentionally change it. If you always cook on Tuesday, order food. If you always take the same route, try a new one. Practice the feeling of adapting your plan without it being a failure.",
    duration: "1 week",
    habitudes_relevant: ["planning"],
  },

  // ── Spontaneous + Planning (functioning addict pattern) ──
  {
    id: "safe_space_journal",
    situation: "User may be hiding behavior they feel ashamed of, or shows signs of the functioning addict pattern",
    exercise:
      "Get a small notebook or use a private notes app. Each day, write one sentence about something you spent money on that you wouldn't normally tell anyone about. No judgment, no action needed — just create a private, honest record for yourself.",
    duration: "2 weeks",
    habitudes_relevant: ["spontaneous", "planning"],
  },

  // ── Security + worry ──
  {
    id: "worry_time_box",
    situation: "User is consumed by financial worry, what-if scenarios, or anxiety about money regardless of their actual financial situation",
    exercise:
      "Set a 10-minute timer each day. During those 10 minutes, you're allowed to worry about money as much as you want. When the timer goes off, you're done for the day. If a worry pops up later, write it down and save it for tomorrow's 10 minutes.",
    duration: "1 week",
    habitudes_relevant: ["security"],
  },

  // ── General: "Sometimes" pile exploration ──
  {
    id: "sometimes_deep_dive",
    situation: "User has interesting cards in their Sometimes pile that haven't been explored yet",
    exercise:
      "Pick one card from your Sometimes pile that surprised you — one you weren't sure where to put. This week, notice every time that behavior shows up. When does it happen? Who are you with? How do you feel? Just collect data on it.",
    duration: "1 week",
    habitudes_relevant: ["general"],
  },
];

// Returns exercises relevant to a set of habitudes
export const getRelevantExercises = (
  habitudes: string[]
): CoachingExercise[] => {
  const lower = habitudes.map((h) => h.toLowerCase());

  return COACHING_EXERCISES.filter((ex) =>
    ex.habitudes_relevant.some(
      (h) => lower.includes(h) || h === "general"
    )
  );
};

// Formats exercises for inclusion in the system prompt
export const formatExercisesForPrompt = (
  exercises: CoachingExercise[]
): string => {
  if (exercises.length === 0) return "";

  let prompt = `\n════════════════════════════════════════
AVAILABLE COACHING EXERCISES
(Suggest ONE of these when the conversation reaches a natural closing point or when the user asks "what should I do?")
════════════════════════════════════════\n`;

  for (const ex of exercises) {
    prompt += `\n[${ex.id}] For: ${ex.situation}\n`;
    prompt += `Exercise: "${ex.exercise}"\n`;
    prompt += `Duration: ${ex.duration}\n`;
  }

  prompt += `\nIMPORTANT: Don't force an exercise. Only suggest one when the conversation naturally reaches a point where it would be helpful. Adapt the wording to feel natural, not like you're reading from a list.\n`;

  return prompt;
};
