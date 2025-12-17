export type BlockType = 
  | 'hook'
  | 'concept'
  | 'example'
  | 'practice'
  | 'synthesis'
  | 'real_world'
  | 'metacognition'
  | 'extension';

export type BlockFormat = 
  | 'text'
  | 'story'
  | 'question'
  | 'challenge'
  | 'mystery'
  | 'game'
  | 'visual'
  | 'animation'
  | 'video'
  | 'audio'
  | 'interactive'
  | 'guided'
  | 'worked_out'
  | 'video_demo'
  | 'peer_example'
  | 'micro_exercise'
  | 'quick_check'
  | 'drag_drop'
  | 'mnemonic'
  | 'visual_summary'
  | 'key_points'
  | 'song'
  | 'scenario'
  | 'career'
  | 'hobby'
  | 'daily_life'
  | 'self_check'
  | 'strategy_tip'
  | 'growth_mindset'
  | 'deep_dive'
  | 'curiosity'
  | 'historical'
  | 'fun_fact';

export type PresentationType = 
  | 'story'
  | 'direct'
  | 'discovery'
  | 'game'
  | 'project'
  | 'dialogue';

export type PedagogicalApproach = 
  | 'traditional'
  | 'montessori'
  | 'game_based'
  | 'flipped'
  | 'freinet'
  | 'problem_based';

export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing';

export type SkillType = 'cognitive' | 'procedural' | 'metacognitive' | 'socio_emotional' | 'psychomotor';

export type DomainType = 'academic' | 'life_skill' | 'creative' | 'physical' | 'social';

export type Transferability = 'specific' | 'transferable' | 'universal';

export interface ContentBlock {
  id?: string;
  type: BlockType;
  format: BlockFormat;
  content: BlockContent;
  order?: number;
}

export interface BlockContent {
  text?: string;
  character?: string;
  emotion?: string;
  image_url?: string;
  alt_text?: string;
  caption?: string;
  animation_id?: string;
  interactive?: boolean;
  narration?: string;
  video_url?: string;
  audio_url?: string;
  problem?: string;
  steps?: { instruction: string; answer: string }[];
  visual_support?: string;
  exercise_template_id?: string;
  difficulty?: number;
  feedback_style?: string;
  phrase?: string;
  visual_anchor?: string;
  audio_id?: string;
  key_points?: string[];
  context?: string;
  situation?: string;
  connection_to_skill?: string;
  question?: string;
  tip?: string;
  fact?: string;
  source?: string;
}

export interface TargetProfile {
  age_range?: [number, number];
  learning_style?: LearningStyle;
  interests?: string[];
  level?: 'beginner' | 'intermediate' | 'advanced';
  energy?: 'low' | 'medium' | 'high';
}

export interface SkillPresentation {
  id: string;
  skill_id: string;
  presentation_type: PresentationType;
  target_profile: TargetProfile;
  content_blocks: ContentBlock[];
  language: string;
  pedagogical_approach: PedagogicalApproach;
  estimated_duration_minutes: number;
  engagement_score: number;
  effectiveness_score: number;
  is_default: boolean;
  is_ai_generated: boolean;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PedagogicalMethod {
  id: string;
  code: string;
  name_key: string;
  description_key: string;
  icon?: string;
  color?: string;
  presentation_config: PresentationConfig;
  exercise_config: ExerciseConfig;
  feedback_config: FeedbackConfig;
  progression_config: ProgressionConfig;
  assessment_config: AssessmentConfig;
  is_active: boolean;
  sort_order: number;
}

export interface PresentationConfig {
  structure: string[];
  teacher_role?: string;
  student_role?: string;
  materials?: string;
  pacing?: string;
  blocks_priority: string[];
}

export interface ExerciseConfig {
  types_priority: string[];
  correction?: string;
  repetition?: string;
  context?: string;
}

export interface FeedbackConfig {
  timing: string;
  source?: string;
  tone: string;
  show_correct_answer: boolean | string;
}

export interface ProgressionConfig {
  model: string;
  prerequisites?: string;
  branching?: string;
  pace?: string;
}

export interface AssessmentConfig {
  method: string;
  frequency: string;
  comparison?: string;
  visible_to_student?: boolean;
}

export interface EnhancedSkill {
  id: string;
  domain_id: string;
  code: string;
  name_key: string;
  description_key?: string;
  difficulty_level: number;
  prerequisites: string[];
  estimated_duration_minutes: number;
  country_programs: string[];
  sort_order: number;
  is_active: boolean;
  skill_type: SkillType;
  domain_type: DomainType;
  bloom_level: number;
  transferability: Transferability;
  learning_styles: LearningStyle[];
  age_adaptations: Record<string, unknown>;
  tags: string[];
}
