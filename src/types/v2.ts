import type { Json } from './database'

// =============================================
// PHASE 1: STRUCTURE COMPÉTENCE COMPLÈTE (V2)
// =============================================

export type ContentSource = 'official' | 'user' | 'ai'

export interface SkillContent {
  id: string
  skill_id: string
  objective: string
  context: string | null
  theory: string
  synthesis: string | null
  enrichments: Json
  pedagogical_method: string
  source: ContentSource
  created_by: string | null
  is_validated: boolean
  language: string
  created_at: string
  updated_at: string
}

export interface SkillExample {
  id: string
  skill_id: string
  title: string
  problem: string
  solution: string
  explanation: string
  sort_order: number
  language: string
  created_at: string
}

export interface SkillSelfAssessment {
  id: string
  skill_id: string
  question: string
  type: 'yes_no' | 'scale' | 'open'
  language: string
  sort_order: number
  created_at: string
}

export interface FullSkillContent {
  content: SkillContent | null
  examples: SkillExample[]
  selfAssessments: SkillSelfAssessment[]
}

// =============================================
// PHASE 2: CONTENU UTILISATEUR (V2)
// =============================================

export type ModuleType = 'official' | 'user'
export type ShareLevel = 'view' | 'use' | 'edit'
export type ContentType = 'module' | 'skill' | 'exercise'

export interface UserModule {
  id: string
  subject_id: string
  created_by: string
  code: string
  name: string
  description: string | null
  is_public: boolean
  rating_average: number
  rating_count: number
  created_at: string
  updated_at: string
}

export interface UserSkill {
  id: string
  module_id: string
  module_type: ModuleType
  created_by: string
  code: string
  name: string
  description: string | null
  difficulty_level: number
  is_public: boolean
  rating_average: number
  rating_count: number
  created_at: string
  updated_at: string
}

export interface ContentShare {
  id: string
  content_type: ContentType
  content_id: string
  shared_by: string
  shared_with: string
  share_level: ShareLevel
  created_at: string
}

export interface ContentRating {
  id: string
  content_type: ContentType
  content_id: string
  rated_by: string
  rating: number
  comment: string | null
  created_at: string
}

// =============================================
// PHASE 3: MÉTHODES PÉDAGOGIQUES (V2)
// =============================================

export interface PedagogicalMethod {
  id: string
  code: string
  name_key: string
  description_key: string | null
  prompt_instructions: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export type PedagogicalMethodCode = 'standard' | 'montessori' | 'singapore' | 'gamified'

// =============================================
// PHASE 4: QUOTAS ET FREEMIUM (V2)
// =============================================

export type PlanType = 'free' | 'premium'

export interface PlanLimits {
  modules_per_month: number
  skills_per_month: number
  exercises_per_skill: number
  ai_requests_per_day: number
}

export interface PlanUsage {
  modules: number
  skills: number
  ai_requests: number
}

export interface UserPlan {
  id: string
  user_id: string
  plan_type: PlanType
  limits: PlanLimits
  current_usage: PlanUsage
  started_at: string
  expires_at: string | null
  last_reset: string
  created_at: string
  updated_at: string
}

export interface SkillExerciseUsage {
  id: string
  skill_id: string
  user_id: string
  platform_generated: number
  user_generated: number
  updated_at: string
}

export interface ExerciseUsageCheck {
  can_generate: boolean
  use_platform_tokens: boolean
  current_usage: number
  limit: number
  remaining: number
  plan_type: PlanType
}

// =============================================
// GÉNÉRATION IA STRUCTURÉE (13 POINTS V2)
// =============================================

export interface GeneratedSkillContent {
  objective: string
  context: string
  theory: string
  synthesis: string
  enrichments: {
    links?: string[]
    videos?: string[]
    books?: string[]
  }
}

export interface GeneratedSkillExample {
  title: string
  problem: string
  solution: string
  explanation: string
}

export interface GeneratedSkillSelfAssessment {
  question: string
  type: 'yes_no' | 'scale' | 'open'
}

export interface FullGeneratedSkill {
  content: GeneratedSkillContent
  examples: GeneratedSkillExample[]
  selfAssessments: GeneratedSkillSelfAssessment[]
}

// =============================================
// VALIDATION IA (V2)
// =============================================

export interface AIValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

export interface ContentValidationRequest {
  contentType: ContentType
  subjectId: string
  name: string
  description?: string
  content?: string
}

// =============================================
// PHASE 5: ADMIN ET TRADUCTIONS (V2)
// =============================================

export interface CountryProgram {
  id: string
  country_code: string
  country_name: string
  country_flag: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AIModelConfig {
  id: string
  provider: 'openai' | 'anthropic' | 'platform'
  model_name: string
  display_name: string
  is_default: boolean
  is_active: boolean
  max_tokens: number
  created_at: string
}

export interface ContentTranslation {
  id: string
  key: string
  language: string
  value: string
  created_at: string
  updated_at: string
}

export type ContentStatus = 'draft' | 'published'

export interface SubjectExtended {
  id: string
  code: string
  name_key: string
  description_key: string | null
  icon: string | null
  sort_order: number
  is_active: boolean
  is_official: boolean
  status: ContentStatus
  language: string
  method_code: string
  country_program_id: string | null
  created_at: string
  updated_at: string
}
