-- V6 Migration: Exercise Templates
-- Table pour les templates d'exercices universels

CREATE TABLE IF NOT EXISTS exercise_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    bloom_level INTEGER CHECK (bloom_level BETWEEN 1 AND 6),
    modality TEXT NOT NULL,
    compatible_subjects TEXT[] DEFAULT '{}',
    content_schema JSONB NOT NULL,
    renderer_component TEXT NOT NULL,
    evaluation_type TEXT NOT NULL CHECK (evaluation_type IN ('auto', 'ai_assisted', 'manual', 'self')),
    evaluation_config JSONB DEFAULT '{}',
    generation_prompt_template TEXT,
    supports_hints BOOLEAN DEFAULT TRUE,
    supports_partial_credit BOOLEAN DEFAULT FALSE,
    estimated_time_seconds INTEGER DEFAULT 60,
    difficulty_range INT4RANGE DEFAULT '[1,5]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_exercise_templates_code ON exercise_templates(code);
CREATE INDEX IF NOT EXISTS idx_exercise_templates_modality ON exercise_templates(modality);
CREATE INDEX IF NOT EXISTS idx_exercise_templates_bloom ON exercise_templates(bloom_level);

-- RLS
ALTER TABLE exercise_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY exercise_templates_read ON exercise_templates FOR SELECT USING (true);

-- Seed des templates d'exercices

-- 1. Manipulation mathématique interactive
INSERT INTO exercise_templates (code, name, description, bloom_level, modality, compatible_subjects, content_schema, renderer_component, evaluation_type, evaluation_config, generation_prompt_template, supports_hints, supports_partial_credit, estimated_time_seconds, difficulty_range) VALUES
('math_manipulation', 'Manipulation mathématique interactive', 'Exercice de manipulation visuelle pour les mathématiques', 3, 'kinesthetic', ARRAY['math'],
'{"type": "object", "required": ["manipulation_type", "config", "target", "instruction"], "properties": {"manipulation_type": {"enum": ["number_line", "fraction_visual", "geometry", "balance", "place_value", "base_blocks", "clock"]}, "config": {"type": "object"}, "target": {"type": "object"}, "instruction": {"type": "string"}, "hints": {"type": "array", "items": {"type": "string"}}, "audio_instruction": {"type": "string"}}}'::jsonb,
'MathManipulationExercise', 'auto',
'{"check_final_state": true, "partial_credit_for_progress": true, "track_manipulation_steps": true}'::jsonb,
'Génère un exercice de manipulation pour {skill_name}. Type: {manipulation_type}. Difficulté: {difficulty}/5. L''enfant doit manipuler visuellement pour trouver la réponse.',
true, true, 90, '[1,5]')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    content_schema = EXCLUDED.content_schema,
    evaluation_config = EXCLUDED.evaluation_config;

-- 2. Dictée interactive
INSERT INTO exercise_templates (code, name, description, bloom_level, modality, compatible_subjects, content_schema, renderer_component, evaluation_type, evaluation_config, generation_prompt_template, supports_hints, supports_partial_credit, estimated_time_seconds, difficulty_range) VALUES
('dictation', 'Dictée interactive', 'Exercice de dictée avec audio et correction automatique', 3, 'auditory', ARRAY['francais', 'languages'],
'{"type": "object", "required": ["audio_url", "text", "focus_rules"], "properties": {"audio_url": {"type": "string"}, "text": {"type": "string"}, "focus_rules": {"type": "array", "items": {"type": "string"}}, "difficulty_words": {"type": "array", "items": {"type": "string"}}, "playback_speed_options": {"type": "array", "items": {"type": "number"}, "default": [0.75, 1, 1.25]}, "allow_replay": {"type": "boolean", "default": true}, "max_replays": {"type": "integer", "default": 3}}}'::jsonb,
'DictationExercise', 'ai_assisted',
'{"check_spelling": true, "check_punctuation": true, "check_accents": true, "tolerance_level": "strict", "highlight_errors_by_type": true}'::jsonb,
'Génère une dictée de {word_count} mots pour un enfant de {age} ans. Règles ciblées: {focus_rules}. Thème: {theme}.',
false, true, 180, '[2,5]')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    content_schema = EXCLUDED.content_schema,
    evaluation_config = EXCLUDED.evaluation_config;

-- 3. Simulation d'expérience scientifique
INSERT INTO exercise_templates (code, name, description, bloom_level, modality, compatible_subjects, content_schema, renderer_component, evaluation_type, evaluation_config, generation_prompt_template, supports_hints, supports_partial_credit, estimated_time_seconds, difficulty_range) VALUES
('science_experiment', 'Simulation d''expérience scientifique', 'Simulation interactive d''une expérience avec hypothèse et conclusion', 4, 'kinesthetic', ARRAY['sciences'],
'{"type": "object", "required": ["experiment_type", "hypothesis", "variables", "procedure", "expected_result"], "properties": {"experiment_type": {"enum": ["observation", "measurement", "comparison", "transformation"]}, "hypothesis": {"type": "string"}, "variables": {"type": "object", "properties": {"independent": {"type": "string"}, "dependent": {"type": "string"}, "controlled": {"type": "array", "items": {"type": "string"}}}}, "materials": {"type": "array", "items": {"type": "string"}}, "procedure": {"type": "array", "items": {"type": "object", "properties": {"step": {"type": "integer"}, "instruction": {"type": "string"}, "interaction": {"type": "string"}}}}, "expected_result": {"type": "object"}, "conclusion_prompt": {"type": "string"}}}'::jsonb,
'ScienceExperimentSimulation', 'ai_assisted',
'{"check_procedure_order": true, "check_observation_accuracy": true, "check_conclusion_reasoning": true}'::jsonb,
'Génère une simulation d''expérience sur {topic}. L''enfant doit tester l''hypothèse: {hypothesis}. Niveau: {difficulty}/5.',
true, true, 300, '[2,5]')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    content_schema = EXCLUDED.content_schema,
    evaluation_config = EXCLUDED.evaluation_config;

-- 4. Analyse de source historique
INSERT INTO exercise_templates (code, name, description, bloom_level, modality, compatible_subjects, content_schema, renderer_component, evaluation_type, evaluation_config, generation_prompt_template, supports_hints, supports_partial_credit, estimated_time_seconds, difficulty_range) VALUES
('source_analysis', 'Analyse de document historique', 'Analyse critique d''un document historique avec questions', 4, 'visual', ARRAY['histoire', 'geography', 'civics'],
'{"type": "object", "required": ["source", "questions"], "properties": {"source": {"type": "object", "properties": {"type": {"enum": ["text", "image", "map", "chart", "artifact", "video"]}, "content_url": {"type": "string"}, "content_text": {"type": "string"}, "metadata": {"type": "object", "properties": {"author": {"type": "string"}, "date": {"type": "string"}, "origin": {"type": "string"}, "context": {"type": "string"}}}}}, "questions": {"type": "array", "items": {"type": "object", "properties": {"question": {"type": "string"}, "question_type": {"enum": ["identification", "interpretation", "critique", "comparison"]}, "answer_type": {"enum": ["qcm", "free", "highlight", "matching"]}, "expected_answer": {"type": "string"}, "rubric": {"type": "object"}}}}}}'::jsonb,
'SourceAnalysisExercise', 'ai_assisted',
'{"check_source_identification": true, "check_context_understanding": true, "check_critical_thinking": true}'::jsonb,
'Génère une analyse de document sur {period}. Type de source: {source_type}. Questions de niveau {difficulty}/5.',
true, true, 240, '[3,5]')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    content_schema = EXCLUDED.content_schema,
    evaluation_config = EXCLUDED.evaluation_config;

-- 5. Programmation par blocs
INSERT INTO exercise_templates (code, name, description, bloom_level, modality, compatible_subjects, content_schema, renderer_component, evaluation_type, evaluation_config, generation_prompt_template, supports_hints, supports_partial_credit, estimated_time_seconds, difficulty_range) VALUES
('block_programming', 'Programmation par blocs', 'Exercice de programmation visuelle avec blocs', 3, 'kinesthetic', ARRAY['informatique'],
'{"type": "object", "required": ["objective", "available_blocks", "expected_output"], "properties": {"objective": {"type": "string"}, "scenario": {"type": "object", "properties": {"character": {"type": "string"}, "environment": {"type": "string"}, "goal": {"type": "string"}}}, "available_blocks": {"type": "array", "items": {"type": "object", "properties": {"type": {"enum": ["move", "turn", "repeat", "if", "variable", "function"]}, "label": {"type": "string"}, "params": {"type": "object"}}}}, "initial_state": {"type": "object"}, "expected_output": {"type": "object"}, "max_blocks": {"type": "integer"}}}'::jsonb,
'BlockProgrammingExercise', 'auto',
'{"check_output": true, "check_efficiency": true, "allow_multiple_solutions": true}'::jsonb,
'Génère un exercice de programmation par blocs. Objectif: {objective}. Blocs disponibles: {block_types}. Difficulté: {difficulty}/5.',
true, true, 180, '[1,5]')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    content_schema = EXCLUDED.content_schema,
    evaluation_config = EXCLUDED.evaluation_config;

-- 6. Reconnaissance audio (musique)
INSERT INTO exercise_templates (code, name, description, bloom_level, modality, compatible_subjects, content_schema, renderer_component, evaluation_type, evaluation_config, generation_prompt_template, supports_hints, supports_partial_credit, estimated_time_seconds, difficulty_range) VALUES
('audio_recognition', 'Reconnaissance audio', 'Exercice d''écoute et identification sonore', 2, 'auditory', ARRAY['musique', 'languages'],
'{"type": "object", "required": ["audio_url", "question", "options", "correct_answer"], "properties": {"audio_url": {"type": "string"}, "question": {"type": "string"}, "audio_type": {"enum": ["note", "interval", "chord", "rhythm", "instrument", "melody"]}, "options": {"type": "array", "items": {"type": "string"}}, "correct_answer": {"type": "integer"}, "replay_limit": {"type": "integer", "default": 3}}}'::jsonb,
'AudioRecognitionExercise', 'auto',
'{"check_answer": true, "track_replay_count": true}'::jsonb,
'Génère un exercice de reconnaissance audio. Type: {audio_type}. Difficulté: {difficulty}/5.',
true, false, 60, '[1,5]')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    content_schema = EXCLUDED.content_schema,
    evaluation_config = EXCLUDED.evaluation_config;

-- 7. Frise chronologique interactive
INSERT INTO exercise_templates (code, name, description, bloom_level, modality, compatible_subjects, content_schema, renderer_component, evaluation_type, evaluation_config, generation_prompt_template, supports_hints, supports_partial_credit, estimated_time_seconds, difficulty_range) VALUES
('timeline_ordering', 'Frise chronologique interactive', 'Placement d''événements sur une frise chronologique', 3, 'kinesthetic', ARRAY['histoire', 'sciences'],
'{"type": "object", "required": ["events", "time_range"], "properties": {"events": {"type": "array", "items": {"type": "object", "properties": {"id": {"type": "string"}, "title": {"type": "string"}, "date": {"type": "string"}, "description": {"type": "string"}, "image_url": {"type": "string"}}}}, "time_range": {"type": "object", "properties": {"start": {"type": "string"}, "end": {"type": "string"}}}, "show_dates": {"type": "boolean", "default": false}}}'::jsonb,
'TimelineExercise', 'auto',
'{"check_order": true, "partial_credit": true, "tolerance_years": 0}'::jsonb,
'Génère un exercice de frise chronologique sur {period}. Nombre d''événements: {event_count}. Difficulté: {difficulty}/5.',
true, true, 120, '[2,5]')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    content_schema = EXCLUDED.content_schema,
    evaluation_config = EXCLUDED.evaluation_config;

-- 8. QCM avec explication
INSERT INTO exercise_templates (code, name, description, bloom_level, modality, compatible_subjects, content_schema, renderer_component, evaluation_type, evaluation_config, generation_prompt_template, supports_hints, supports_partial_credit, estimated_time_seconds, difficulty_range) VALUES
('qcm_explanation', 'QCM avec explication', 'Question à choix multiple avec justification de la réponse', 2, 'reading_writing', ARRAY['*'],
'{"type": "object", "required": ["question", "options", "correct_answer", "explanations"], "properties": {"question": {"type": "string"}, "options": {"type": "array", "items": {"type": "string"}}, "correct_answer": {"type": "integer"}, "explanations": {"type": "object", "properties": {"correct": {"type": "string"}, "incorrect": {"type": "array", "items": {"type": "string"}}}}, "image_url": {"type": "string"}, "audio_url": {"type": "string"}}}'::jsonb,
'QCMExplanationExercise', 'auto',
'{"show_explanation_on_answer": true}'::jsonb,
'Génère un QCM avec explications pour {skill_name}. Difficulté: {difficulty}/5.',
true, false, 60, '[1,5]')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    content_schema = EXCLUDED.content_schema,
    evaluation_config = EXCLUDED.evaluation_config;

-- 9. Texte à trous contextuel
INSERT INTO exercise_templates (code, name, description, bloom_level, modality, compatible_subjects, content_schema, renderer_component, evaluation_type, evaluation_config, generation_prompt_template, supports_hints, supports_partial_credit, estimated_time_seconds, difficulty_range) VALUES
('fill_blank_context', 'Texte à trous contextuel', 'Compléter un texte avec des mots manquants', 3, 'reading_writing', ARRAY['francais', 'languages', '*'],
'{"type": "object", "required": ["text", "blanks"], "properties": {"text": {"type": "string"}, "blanks": {"type": "array", "items": {"type": "object", "properties": {"position": {"type": "integer"}, "answer": {"type": "string"}, "alternatives": {"type": "array", "items": {"type": "string"}}, "hint": {"type": "string"}}}}, "word_bank": {"type": "array", "items": {"type": "string"}}, "context": {"type": "string"}}}'::jsonb,
'FillBlankContextExercise', 'auto',
'{"case_sensitive": false, "accept_alternatives": true}'::jsonb,
'Génère un texte à trous sur {topic}. Règle ciblée: {rule}. Difficulté: {difficulty}/5.',
true, true, 90, '[1,5]')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    content_schema = EXCLUDED.content_schema,
    evaluation_config = EXCLUDED.evaluation_config;

-- 10. Association/Matching
INSERT INTO exercise_templates (code, name, description, bloom_level, modality, compatible_subjects, content_schema, renderer_component, evaluation_type, evaluation_config, generation_prompt_template, supports_hints, supports_partial_credit, estimated_time_seconds, difficulty_range) VALUES
('matching', 'Association', 'Relier des éléments correspondants', 2, 'kinesthetic', ARRAY['*'],
'{"type": "object", "required": ["pairs"], "properties": {"pairs": {"type": "array", "items": {"type": "object", "properties": {"left": {"type": "string"}, "right": {"type": "string"}, "left_type": {"enum": ["text", "image", "audio"]}, "right_type": {"enum": ["text", "image", "audio"]}}}}, "instruction": {"type": "string"}, "shuffle": {"type": "boolean", "default": true}}}'::jsonb,
'MatchingExercise', 'auto',
'{"partial_credit": true}'::jsonb,
'Génère un exercice d''association sur {topic}. Nombre de paires: {pair_count}. Difficulté: {difficulty}/5.',
true, true, 90, '[1,5]')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    content_schema = EXCLUDED.content_schema,
    evaluation_config = EXCLUDED.evaluation_config;
