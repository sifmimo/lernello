-- =============================================
-- V4 PHASE 1: ÉVOLUTION PEDAGOGICAL_METHODS
-- Ajout configurations détaillées
-- =============================================

ALTER TABLE public.pedagogical_methods 
ADD COLUMN IF NOT EXISTS presentation_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS exercise_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS feedback_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS progression_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS assessment_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS icon TEXT,
ADD COLUMN IF NOT EXISTS color TEXT;

-- Mise à jour des méthodes existantes
UPDATE public.pedagogical_methods SET
    presentation_config = '{"structure": ["rule_first", "examples", "practice"], "teacher_role": "transmitter", "blocks_priority": ["concept", "rule", "examples", "exercises"]}',
    exercise_config = '{"types_priority": ["qcm", "fill_blank", "free_input"], "correction": "teacher_correction"}',
    feedback_config = '{"timing": "immediate", "tone": "evaluative", "show_correct_answer": true}',
    progression_config = '{"model": "linear", "prerequisites": "flexible"}',
    assessment_config = '{"method": "testing", "frequency": "periodic"}',
    icon = '📚', color = '#4F46E5'
WHERE code = 'standard';

UPDATE public.pedagogical_methods SET
    presentation_config = '{"structure": ["manipulation_first", "concept_emerges"], "teacher_role": "guide", "blocks_priority": ["interactive_manipulation", "self_discovery"]}',
    exercise_config = '{"types_priority": ["manipulation", "sorting", "matching"], "correction": "self_correction"}',
    feedback_config = '{"timing": "built_into_material", "tone": "neutral_observational", "show_correct_answer": false}',
    progression_config = '{"model": "individual_mastery", "pace": "student_controlled"}',
    assessment_config = '{"method": "observation", "frequency": "continuous"}',
    icon = '🧩', color = '#10B981'
WHERE code = 'montessori';

UPDATE public.pedagogical_methods SET
    presentation_config = '{"structure": ["challenge_first", "learn_to_win"], "teacher_role": "game_master", "blocks_priority": ["challenge", "mini_game", "reward"]}',
    exercise_config = '{"types_priority": ["game", "challenge", "puzzle"], "correction": "game_feedback"}',
    feedback_config = '{"timing": "instant", "tone": "celebratory", "show_correct_answer": "as_power_up"}',
    progression_config = '{"model": "level_based", "pace": "challenge_adjusted"}',
    assessment_config = '{"method": "achievement_tracking", "frequency": "continuous"}',
    icon = '🎮', color = '#F59E0B'
WHERE code = 'gamified';

-- Nouvelles méthodes
INSERT INTO public.pedagogical_methods (code, name_key, description_key, icon, color, sort_order, presentation_config, exercise_config, feedback_config, progression_config, assessment_config)
VALUES 
('flipped', 'method.flipped', 'method.flipped.desc', '🔄', '#8B5CF6', 4,
 '{"structure": ["video_at_home", "practice_in_class"], "teacher_role": "coach", "blocks_priority": ["video", "self_check", "collaborative_practice"]}',
 '{"types_priority": ["interactive", "collaborative", "project"], "correction": "peer_and_teacher"}',
 '{"timing": "during_practice", "tone": "coaching", "show_correct_answer": "after_attempt"}',
 '{"model": "competency_based", "pace": "differentiated"}',
 '{"method": "formative_continuous", "frequency": "continuous"}'),
('freinet', 'method.freinet', 'method.freinet.desc', '✍️', '#EC4899', 5,
 '{"structure": ["expression_first", "investigation", "sharing"], "teacher_role": "facilitator", "blocks_priority": ["real_world", "creation", "collaboration"]}',
 '{"types_priority": ["project", "creation", "investigation"], "correction": "peer_review"}',
 '{"timing": "during_process", "tone": "constructive", "show_correct_answer": "through_discussion"}',
 '{"model": "project_based", "pace": "project_driven"}',
 '{"method": "portfolio", "frequency": "milestone"}'),
('problem_based', 'method.problem_based', 'method.problem_based.desc', '🔍', '#06B6D4', 6,
 '{"structure": ["problem_first", "research", "solution"], "teacher_role": "tutor", "blocks_priority": ["hook_problem", "investigation", "synthesis"]}',
 '{"types_priority": ["case_study", "open_ended", "research"], "correction": "rubric_based"}',
 '{"timing": "during_reflection", "tone": "questioning", "show_correct_answer": "multiple_valid"}',
 '{"model": "spiral", "pace": "complexity_adjusted"}',
 '{"method": "authentic_assessment", "frequency": "per_problem"}')
ON CONFLICT (code) DO UPDATE SET
    presentation_config = EXCLUDED.presentation_config,
    exercise_config = EXCLUDED.exercise_config,
    feedback_config = EXCLUDED.feedback_config,
    progression_config = EXCLUDED.progression_config,
    assessment_config = EXCLUDED.assessment_config,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color;
