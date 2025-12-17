export interface HookContent {
  type: 'question' | 'challenge' | 'story' | 'mystery' | 'real_world';
  text: string;
  visual_emoji?: string;
  audio_narration?: string;
  interaction?: 'tap' | 'swipe' | 'none';
  engagement_hook?: string;
}

export interface DiscoverContent {
  type: 'observation' | 'manipulation' | 'exploration';
  observation_prompt: string;
  guided_discovery: string[];
  aha_moment: string;
  tool?: 'base_ten_blocks' | 'number_line' | 'fraction_visual' | 'balance' | 'text_highlighter' | 'sorting_area';
  visual_aid?: string;
}

export interface LearnContent {
  concept_name: string;
  explanation: {
    simple: string;
    standard: string;
    advanced: string;
  };
  visual_representation: {
    type: 'animation' | 'diagram' | 'illustration' | 'video';
    url?: string;
    description: string;
  };
  key_formula?: string;
  mnemonic?: string;
  common_mistakes: string[];
  key_takeaway: string;
}

export interface PracticeExercise {
  type: 'guided' | 'scaffolded' | 'independent';
  question: string;
  input_type: 'number' | 'text' | 'select' | 'drag' | 'tap';
  options?: string[];
  expected_answer: string;
  alternatives?: string[];
  scaffolding?: string;
  hint: string;
  visual_aid?: string;
  feedback_correct: string;
  feedback_incorrect: string;
}

export interface PracticeContent {
  instruction?: string;
  exercises: PracticeExercise[];
}

export interface ApplyContent {
  context: string;
  challenge: string;
  input_type: 'number' | 'text' | 'select' | 'free_response';
  expected_answer?: string;
  success_criteria: string;
  real_world_connection: string;
}

export interface MicroLesson {
  id: string;
  skill_id: string;
  order: number;
  
  title: string;
  subtitle: string;
  estimated_duration_seconds: number;
  difficulty_tier: 1 | 2 | 3;
  
  hook: HookContent;
  discover: DiscoverContent;
  learn: LearnContent;
  practice: PracticeContent;
  apply: ApplyContent;
  
  quality_score: number;
  review_status: 'draft' | 'reviewed' | 'approved';
  
  created_at: string;
  updated_at: string;
  last_reviewed_at?: string;
}

export interface MicroLessonGenerationParams {
  skill_id: string;
  skill_name: string;
  skill_description?: string;
  domain_name: string;
  subject_name: string;
  subject_code: string;
  difficulty: number;
  prerequisites?: string[];
  student_age: number;
  student_learning_style?: string;
  student_interests?: string[];
}

export interface QualityCheckResult {
  criterion: string;
  weight: number;
  pass: boolean;
  score: number;
  feedback: string;
}

export interface QualityReport {
  total_score: number;
  checks: QualityCheckResult[];
  status: 'rejected' | 'warning' | 'good' | 'excellent';
  recommendations: string[];
}

export interface EnhancedFeedback {
  type: 'correct' | 'incorrect' | 'partial';
  message: string;
  explanation?: string;
  visual?: {
    type: 'animation' | 'highlight' | 'comparison' | 'step_reveal';
    data: Record<string, unknown>;
  };
  next_action: {
    label: string;
    action: 'retry' | 'hint' | 'continue' | 'review' | 'skip';
  };
  encouragement: string;
  character_emotion?: 'happy' | 'encouraging' | 'thinking' | 'celebrating' | 'supportive';
}

export type CelebrationLevel = 'correct_answer' | 'streak_3' | 'lesson_complete' | 'level_up' | 'mastery';

export interface CelebrationConfig {
  level: CelebrationLevel;
  animation: 'confetti_light' | 'stars_rise' | 'lumi_dance' | 'confetti_explosion' | 'fireworks';
  sound?: 'ding' | 'success' | 'fanfare' | 'level_up' | 'applause';
  message: string;
  duration_ms: number;
}
