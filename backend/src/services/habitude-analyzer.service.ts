// Deterministic pattern analysis of Money Habitudes assessment results.
// Pure computation — rule-based pattern matching, no AI or DB calls.

import type {
  HabitudeProfile,
  CardPlacement,
  PatternAnalysis,
  InterestingTension,
  ProfileSummary,
} from "../types/coaching.types";

// ─── Helper: get score from profile ───────────────────────────────

type HabitudeName = keyof HabitudeProfile;
const HABITUDE_NAMES: HabitudeName[] = [
  "planning",
  "security",
  "spontaneous",
  "carefree",
  "status",
  "giving",
];

const thatsMe = (profile: HabitudeProfile, h: HabitudeName): number =>
  profile[h].thats_me;
const notMe = (profile: HabitudeProfile, h: HabitudeName): number =>
  profile[h].not_me;
const sometimesMe = (profile: HabitudeProfile, h: HabitudeName): number =>
  profile[h].sometimes_me;

export class HabitudeAnalyzer {
  // Analyzes a habitude profile for patterns, red flags, and coaching priorities
  static analyzeProfile(profile: HabitudeProfile): PatternAnalysis {
    const analysis: PatternAnalysis = {
      redFlags: [],
      warnings: [],
      strengths: [],
      inheritedHabitudes: [],
      coachingPriorities: [],
      interestingTensions: [],
    };

    // Critical red flags

    // Pattern 1: Dominant Spontaneous + Dominant Carefree → Mental health concern
    // "I'm engaging in risky behavior AND I don't care about consequences"
    if (thatsMe(profile, "spontaneous") >= 6 && thatsMe(profile, "carefree") >= 6) {
      analysis.redFlags.push({
        type: "mental_health_concern",
        severity: "critical",
        description:
          "Dominant spontaneous (out of control) combined with dominant carefree (given up control). This pattern often indicates depression, giving up entirely, or a mental health crisis.",
        coaching_action:
          'DO NOT discuss budgeting or financial planning. Focus on human connection first. Ask: "How has your week been? What did you do yesterday?" Build relationship before addressing money. Consider suggesting professional support.',
      });
      analysis.coachingPriorities.unshift(
        "PRIORITY 1: Emotional check-in and human connection — not financial coaching"
      );
    }

    // Pattern 2: Functioning Addict — Dominant Planning + Dominant Spontaneous
    // Plans meticulously to hide out-of-control behavior
    if (thatsMe(profile, "planning") >= 7 && thatsMe(profile, "spontaneous") >= 7) {
      analysis.warnings.push({
        type: "functioning_addict_pattern",
        description:
          'High planning (7+) with high spontaneous (7+). Classic "functioning addict" pattern — plans meticulously to maintain appearances while engaging in hidden out-of-control behavior (spending, substances, gambling). The planning serves to conceal the spontaneous behavior.',
        coaching_focus:
          "Look for shame, secrecy, hidden spending. Build trust slowly. Don't force transparency. When they're ready to share, respond with empathy not judgment. This may correlate with addiction beyond just money.",
      });
      analysis.coachingPriorities.push(
        "Build trust; explore what the spontaneous behavior is meeting emotionally"
      );
    }

    // Inherited habitudes (trauma-based aversions: 7-9 "not me" cards in a habitude)

    for (const hab of HABITUDE_NAMES) {
      const notMeCount = notMe(profile, hab);
      if (notMeCount >= 7) {
        analysis.inheritedHabitudes.push({
          habitude: hab,
          evidence: `Strong aversion: ${notMeCount} "Not Me" cards in ${hab}. This extreme rejection is almost always trauma-based — rebelling against a parent or caregiver's behavior.`,
          coaching_approach: `Ask: "Tell me about your first money memory" or "What does '${hab}' mean to you? Who comes to mind?" Help them see: "That wasn't your fault. You were a child. You don't have to spend your life proving you're not like them."`,
        });
        analysis.coachingPriorities.push(
          `Gently explore childhood experiences related to ${hab} (inherited habitude detected: ${notMeCount} "Not Me" cards)`
        );
      }
    }

    // Dominant habitude coaching priorities

    // Planning dominant
    if (thatsMe(profile, "planning") >= 7) {
      analysis.coachingPriorities.push(
        'Planning-dominant: Planning ≠ logical planning. Someone can plan to go to Cancun even if rent will be short. ALWAYS ask: What are you planning FOR? Watch for rigidity, sunk cost fallacy, "my plan is better because it\'s mine" (endowment bias).'
      );
      analysis.strengths.push({
        habitude: "Planning",
        description:
          "Goal-oriented, thinks ahead, can create and follow through on plans.",
      });
    }

    // Security dominant
    if (thatsMe(profile, "security") >= 7) {
      analysis.coachingPriorities.push(
        'Security-dominant: Security is EMOTIONAL, not logical. Roller coaster analogy — even buckled in safely, if they don\'t FEEL safe, facts won\'t matter. Ask: "What would make you FEEL safe?" not "What is safe?" Facts and data bounce off security-driven people.'
      );
      analysis.strengths.push({
        habitude: "Security",
        description:
          "Strong vigilance and awareness of financial risks. Good at anticipating problems.",
      });
    }

    // Spontaneous dominant (if not already flagged in red flags)
    if (
      thatsMe(profile, "spontaneous") >= 7 &&
      !(thatsMe(profile, "spontaneous") >= 6 && thatsMe(profile, "carefree") >= 6)
    ) {
      analysis.warnings.push({
        type: "high_spontaneous",
        description:
          'Dominant spontaneous (7+). This means "out of control" — knows they shouldn\'t, does it anyway, feels guilt/shame after. Often accompanied by secrecy. May correlate with other impulsive behaviors beyond money.',
        coaching_focus:
          "Lead with empathy, never shame. Explore: What need is being met in the moment? What triggers this? Use When/What/Who/Where/How (never Why). The behavior is trying to meet a legitimate need, just in an unhealthy way.",
      });
      analysis.coachingPriorities.push(
        "Address shame around spontaneous behavior; explore the emotional needs being met"
      );
    }

    // Carefree dominant (if not already flagged)
    if (
      thatsMe(profile, "carefree") >= 6 &&
      !(thatsMe(profile, "spontaneous") >= 6 && thatsMe(profile, "carefree") >= 6)
    ) {
      analysis.warnings.push({
        type: "high_carefree",
        description:
          'Dominant carefree (6+). This is "given UP control" — different from spontaneous. May follow others\' advice without questioning, let a partner handle everything, or be vulnerable to manipulation. Carefree is the ONLY habitude not present from birth — it develops from being over-managed, giving up after failures, or complete trust in someone else.',
        coaching_focus:
          'Gradually increase engagement without overwhelming. Small steps. Help them see: "You CAN understand this. You SHOULD have a voice in your own financial decisions."',
      });
      analysis.coachingPriorities.push(
        "Increase financial engagement gradually; build confidence in their own decision-making"
      );
    }

    // Status dominant
    if (thatsMe(profile, "status") >= 7) {
      analysis.warnings.push({
        type: "high_status",
        description:
          "Dominant status (7+). High status often correlates with high debt (keeping up appearances). Remember: Basic status is healthy (dressing appropriately for situations). Status means different things culturally.",
        coaching_focus:
          "Don't judge status as shallow. Explore: Is this about fitting in or standing out? Is spending within means? Status vs Giving test: If they want recognition/praise, it's status. If they'd do it anonymously, it's giving.",
      });
      analysis.strengths.push({
        habitude: "Status",
        description:
          "Aware of social context and presentation. Can show up appropriately for situations.",
      });
    }

    // Giving dominant
    if (thatsMe(profile, "giving") >= 7) {
      analysis.warnings.push({
        type: "high_giving",
        description:
          'Dominant giving (7+). May give without regard for own needs (airplane oxygen mask problem). Can enable others by removing their sense of responsibility. Check: Is this genuine giving or obligation-based (e.g., tithing often shows up as Planning, not Giving)?',
        coaching_focus:
          "Help them balance giving with self-care. It's okay to have conditions on their giving — that's their Planning habitude setting healthy boundaries.",
      });
      analysis.strengths.push({
        habitude: "Giving",
        description:
          "Genuinely cares about others. Generosity brings authentic joy.",
      });
    }

    // Profile-wide patterns

    const totalThatsMe = HABITUDE_NAMES.reduce(
      (sum, h) => sum + thatsMe(profile, h),
      0
    );

    // Rigid identity — very few "That's Me" cards
    if (totalThatsMe < 10) {
      analysis.warnings.push({
        type: "rigid_identity",
        description:
          'Very few "That\'s Me" cards (under 10 total). "The no police" — extremely clear about what they do/don\'t do. Often an inherited trauma response to chaotic childhood. May struggle with flexibility, relationships, and saying yes to new experiences.',
        coaching_focus:
          "Help them see identity doesn't have to be absolute. You can be a planner and still make spontaneous decisions sometimes. Black-and-white thinking is protective but limiting.",
      });
    }

    // Indecisive identity — too many "That's Me" cards
    if (totalThatsMe > 25) {
      analysis.warnings.push({
        type: "indecisive_identity",
        description:
          'Many "That\'s Me" cards (over 46%). Pulled in many directions, possibly trying to please everyone. Common in young adults (18-21) figuring out identity. In older adults, suggests difficulty establishing boundaries.',
        coaching_focus:
          "Help them identify what's truly theirs vs. what they think others expect. It's okay to disappoint people sometimes. Boundaries are healthy.",
      });
    }

    // Can't enjoy life — low spontaneous + high planning
    if (thatsMe(profile, "spontaneous") <= 2 && thatsMe(profile, "planning") >= 7) {
      analysis.warnings.push({
        type: "cant_enjoy",
        description:
          'Very low spontaneous with high planning. So locked down they may struggle to enjoy anything. In retirement, may have plenty of money but can\'t "flip the switch" to spend it.',
        coaching_focus:
          'When appropriate, help them practice small spontaneous acts. Move 1-2 spontaneous cards from "Not Me" to "Sometimes." Never expect 0 to 9 — incremental change only.',
      });
    }

    // Default priorities

    if (analysis.coachingPriorities.length === 0) {
      analysis.coachingPriorities.push(
        "Balanced profile — let the user guide conversation topics",
        'Focus on the "Sometimes" pile — that\'s where transformation happens'
      );
    }

    return analysis;
  }

  // Finds interesting tensions/contradictions in individual card placements
  static findTensions(cards: CardPlacement[]): InterestingTension[] {
    const tensions: InterestingTension[] = [];

    // Group by pile
    const thatsMe = cards.filter((c) => c.pile === "thats_me");
    const sometimes = cards.filter((c) => c.pile === "sometimes_me");
    const notMeCards = cards.filter((c) => c.pile === "not_me");

    // Group by habitude
    const byHabitude: Record<string, CardPlacement[]> = {};
    for (const card of cards) {
      if (!byHabitude[card.habitude_type]) byHabitude[card.habitude_type] = [];
      byHabitude[card.habitude_type].push(card);
    }

    // Tension 1: Cards in "Sometimes" for a habitude where most cards are "That's Me"
    // (The "exception" cards — where does the dominant behavior break?)
    for (const [habitude, hCards] of Object.entries(byHabitude)) {
      const thatsMeCount = hCards.filter((c) => c.pile === "thats_me").length;
      const sometimeCards = hCards.filter((c) => c.pile === "sometimes_me");

      if (thatsMeCount >= 6 && sometimeCards.length > 0) {
        for (const card of sometimeCards) {
          tensions.push({
            description: `User is strongly ${habitude} (${thatsMeCount} "That's Me" cards), but put "${card.question_text}" in Sometimes. This is where their ${habitude} behavior has exceptions.`,
            cards_involved: [card.question_text],
            coaching_question: `You seem to strongly identify with ${habitude}, but you said "${card.question_text}" is only sometimes true. When does that happen? Who are you with? What's different in those moments?`,
          });
        }
      }
    }

    // Tension 2: Cards in "That's Me" for a habitude where most are "Not Me"
    // (Contradiction — why this one card?)
    for (const [habitude, hCards] of Object.entries(byHabitude)) {
      const notMeCount = hCards.filter((c) => c.pile === "not_me").length;
      const thatsMeCards = hCards.filter((c) => c.pile === "thats_me");

      if (notMeCount >= 6 && thatsMeCards.length > 0) {
        for (const card of thatsMeCards) {
          tensions.push({
            description: `User strongly rejects ${habitude} (${notMeCount} "Not Me" cards), but kept "${card.question_text}" in "That's Me." This one statement resonates despite rejecting the habitude overall.`,
            cards_involved: [card.question_text],
            coaching_question: `Most ${habitude} statements didn't resonate with you at all, but "${card.question_text}" did. Tell me about that — what makes this one different?`,
          });
        }
      }
    }

    // Tension 3: Large "Sometimes" pile (over 50% of cards)
    if (sometimes.length > 27) {
      tensions.push({
        description: `User has ${sometimes.length} cards in "Sometimes" — over half the deck. This could mean indecisiveness, conditional behavior, or absolute thinking ("if it's not 100%, it's sometimes").`,
        cards_involved: [],
        coaching_question:
          'You put a lot of cards in "Sometimes." When you were sorting, what made you put something in Sometimes vs. "That\'s Me"? Was it that it only happens some of the time, or that it depends on the situation?',
      });
    }

    return tensions;
  }

  // Returns dominant, subdominant, low, and balanced habitudes
  static getProfileSummary(profile: HabitudeProfile): ProfileSummary {
    const dominant: string[] = [];
    const subdominant: string[] = [];
    const low: string[] = [];
    const balanced: string[] = [];

    for (const h of HABITUDE_NAMES) {
      const score = thatsMe(profile, h);
      if (score >= 7) dominant.push(h);
      else if (score >= 5) subdominant.push(h);
      else if (score <= 2) low.push(h);
      else balanced.push(h);
    }

    return { dominant, subdominant, low, balanced };
  }
}
