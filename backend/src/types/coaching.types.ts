// Coaching-related types shared across services

// Profile and card placement types

export interface HabitudeProfile {
  planning: { thats_me: number; sometimes_me: number; not_me: number };
  security: { thats_me: number; sometimes_me: number; not_me: number };
  spontaneous: { thats_me: number; sometimes_me: number; not_me: number };
  carefree: { thats_me: number; sometimes_me: number; not_me: number };
  status: { thats_me: number; sometimes_me: number; not_me: number };
  giving: { thats_me: number; sometimes_me: number; not_me: number };
}

export interface CardPlacement {
  question_id: number;
  question_text: string;
  habitude_type: string;
  pile: "thats_me" | "sometimes_me" | "not_me";
  answer_value: number; // 1, 0, -1
}

// Pattern analysis types

export interface RedFlag {
  type: string;
  severity: "critical" | "high" | "medium";
  description: string;
  coaching_action: string;
}

export interface Warning {
  type: string;
  description: string;
  coaching_focus: string;
}

export interface Strength {
  habitude: string;
  description: string;
}

export interface InheritedHabitude {
  habitude: string;
  evidence: string;
  coaching_approach: string;
}

export interface InterestingTension {
  description: string;
  cards_involved: string[];
  coaching_question: string;
}

export interface PatternAnalysis {
  redFlags: RedFlag[];
  warnings: Warning[];
  strengths: Strength[];
  inheritedHabitudes: InheritedHabitude[];
  coachingPriorities: string[];
  interestingTensions: InterestingTension[];
}

export interface ProfileSummary {
  dominant: string[];
  subdominant: string[];
  low: string[];
  balanced: string[];
}

// Coaching brief (assembled from assessment data for prompt injection)

export interface CoachingBrief {
  hasAssessment: boolean;
  profile: HabitudeProfile | null;
  cardPlacements: CardPlacement[];
  analysis: PatternAnalysis | null;
  tensions: InterestingTension[];
  profileSummary: ProfileSummary | null;
}

// Coaching exercises

export interface CoachingExercise {
  id: string;
  situation: string;
  exercise: string;
  duration: string;
  habitudes_relevant: string[];
}
