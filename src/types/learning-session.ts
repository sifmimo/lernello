export type SessionType = 'learn' | 'practice' | 'review';
export type SessionStatus = 'in_progress' | 'completed' | 'abandoned';

export interface LearningSession {
  id: string;
  student_id: string;
  skill_id: string;
  session_type: SessionType;
  target_duration_minutes: number;
  target_exercises: number;
  status: SessionStatus;
  current_step: number;
  total_steps: number;
  exercises_completed: number;
  exercises_correct: number;
  xp_earned: number;
  started_at: string;
  completed_at: string | null;
  exercises_order: string[];
  theory_shown: boolean;
  created_at: string;
}

export interface SkillTheoryContent {
  id: string;
  skill_id: string;
  title: string;
  introduction: string;
  concept_explanation: string;
  key_points: string[];
  examples: TheoryExample[];
  tips: string[];
  common_mistakes: string[];
  language: string;
  difficulty_level: number;
  estimated_read_time_seconds: number;
  is_validated: boolean;
}

export interface TheoryExample {
  problem: string;
  solution: string;
  explanation: string;
}

export interface SessionExercise {
  id: string;
  type: string;
  content: {
    question?: string;
    text?: string;
    options?: string[] | Array<{ text: string; description?: string; emoji?: string }>;
    correct?: number;
    answer?: string;
    blanks?: string[];
    items?: string[] | Array<{ text: string; category: number }>;
    correctOrder?: number[];
    hint?: string;
    acceptedAnswers?: string[];
    useAIEvaluation?: boolean;
    pairs?: Array<{ left: string; right: string }>;
    categories?: string[];
    // Timeline
    events?: Array<{ text: string; order: number }>;
    // Hotspot
    scenario?: string;
    correctItem?: string;
    // Puzzle
    pieces?: string[];
    // Drawing
    instruction?: string;
    expectedShape?: string;
    // Animation
    action?: string;
  };
  difficulty: number;
  is_ai_generated?: boolean;
  quality_score?: number;
}

export interface SessionStep {
  type: 'theory' | 'exercise' | 'recap';
  index: number;
  data?: SkillTheoryContent | SessionExercise | SessionRecap;
}

export interface SessionRecap {
  exercises_completed: number;
  exercises_correct: number;
  accuracy: number;
  xp_earned: number;
  time_spent_seconds: number;
  streak_bonus: boolean;
  level_up: boolean;
  new_level?: number;
  canContinue: boolean;
  skillId: string;
}

export interface CreateSessionParams {
  studentId: string;
  skillId: string;
  sessionType: SessionType;
  targetMinutes?: number;
  generateNew?: boolean; // Forcer la génération de nouveaux exercices
}

export interface SessionProgress {
  current_step: number;
  total_steps: number;
  exercises_completed: number;
  exercises_correct: number;
  current_streak: number;
}
