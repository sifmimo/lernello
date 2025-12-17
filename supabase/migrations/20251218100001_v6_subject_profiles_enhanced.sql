-- V6 Migration: Enhanced Subject Profiles
-- Enrichissement de la table subject_profiles pour l'adaptabilité par matière

-- Ajouter les nouvelles colonnes à subject_profiles si elles n'existent pas
DO $$ 
BEGIN
    -- knowledge_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subject_profiles' AND column_name = 'knowledge_type') THEN
        ALTER TABLE subject_profiles ADD COLUMN knowledge_type TEXT DEFAULT 'procedural';
    END IF;
    
    -- primary_modality
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subject_profiles' AND column_name = 'primary_modality') THEN
        ALTER TABLE subject_profiles ADD COLUMN primary_modality TEXT DEFAULT 'visual';
    END IF;
    
    -- secondary_modalities
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subject_profiles' AND column_name = 'secondary_modalities') THEN
        ALTER TABLE subject_profiles ADD COLUMN secondary_modalities TEXT[] DEFAULT '{}';
    END IF;
    
    -- cognitive_structure
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subject_profiles' AND column_name = 'cognitive_structure') THEN
        ALTER TABLE subject_profiles ADD COLUMN cognitive_structure JSONB DEFAULT '{}';
    END IF;
    
    -- theory_templates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subject_profiles' AND column_name = 'theory_templates') THEN
        ALTER TABLE subject_profiles ADD COLUMN theory_templates JSONB DEFAULT '{}';
    END IF;
    
    -- exercise_templates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subject_profiles' AND column_name = 'exercise_templates') THEN
        ALTER TABLE subject_profiles ADD COLUMN exercise_templates JSONB DEFAULT '{}';
    END IF;
    
    -- feedback_templates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subject_profiles' AND column_name = 'feedback_templates') THEN
        ALTER TABLE subject_profiles ADD COLUMN feedback_templates JSONB DEFAULT '{}';
    END IF;
    
    -- mastery_criteria
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subject_profiles' AND column_name = 'mastery_criteria') THEN
        ALTER TABLE subject_profiles ADD COLUMN mastery_criteria JSONB DEFAULT '{}';
    END IF;
    
    -- progression_model
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subject_profiles' AND column_name = 'progression_model') THEN
        ALTER TABLE subject_profiles ADD COLUMN progression_model TEXT DEFAULT 'linear';
    END IF;
    
    -- icon
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subject_profiles' AND column_name = 'icon') THEN
        ALTER TABLE subject_profiles ADD COLUMN icon TEXT;
    END IF;
    
    -- color
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subject_profiles' AND column_name = 'color') THEN
        ALTER TABLE subject_profiles ADD COLUMN color TEXT;
    END IF;
END $$;

-- Note: subject_profiles table already exists, only adding new columns

-- RLS
ALTER TABLE subject_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS subject_profiles_read ON subject_profiles;
CREATE POLICY subject_profiles_read ON subject_profiles FOR SELECT USING (true);

-- Seed des 6 profils de matière détaillés
-- Mathématiques
INSERT INTO subject_profiles (subject_id, knowledge_type, primary_modality, secondary_modalities, cognitive_structure, theory_templates, exercise_templates, feedback_templates, mastery_criteria, progression_model, icon, color)
SELECT 
    s.id,
    'procedural',
    'kinesthetic',
    ARRAY['visual', 'gamified'],
    '{"type": "hierarchical", "description": "Concepts construits sur des prérequis stricts", "prerequisite_strength": "strong", "transfer_potential": "high"}'::jsonb,
    '{"default": {"blocks": ["hook_problem", "manipulation", "concept", "rule", "examples", "synthesis"], "emphasis": "visual_representation"}, "montessori": {"blocks": ["manipulation", "discovery", "verbalization", "abstraction"], "emphasis": "concrete_to_abstract"}}'::jsonb,
    '{"types_priority": ["interactive_manipulation", "visual_qcm", "step_by_step_calculation", "drag_drop_ordering", "free_input_number", "word_problem"], "difficulty_factors": ["number_range", "operation_count", "abstraction_level"], "feedback_style": "show_steps"}'::jsonb,
    '{"correct": {"messages": ["Excellent calcul ! 🎯", "Tu as trouvé la bonne réponse !", "Parfait ! Ta méthode est correcte."], "show_alternative_methods": true}, "incorrect": {"messages": ["Pas tout à fait. Regarde bien les étapes.", "Essaie de reprendre depuis le début.", "Utilise la manipulation pour vérifier."], "show_hint_after": 1, "show_solution_after": 3, "offer_easier_variant": true}}'::jsonb,
    '{"accuracy_threshold": 0.85, "speed_factor": true, "method_variety": true, "transfer_test": true}'::jsonb,
    'mastery_based',
    'calculator',
    '#3B82F6'
FROM subjects s WHERE s.code = 'math'
ON CONFLICT (subject_id) DO UPDATE SET
    knowledge_type = EXCLUDED.knowledge_type,
    primary_modality = EXCLUDED.primary_modality,
    secondary_modalities = EXCLUDED.secondary_modalities,
    cognitive_structure = EXCLUDED.cognitive_structure,
    theory_templates = EXCLUDED.theory_templates,
    exercise_templates = EXCLUDED.exercise_templates,
    feedback_templates = EXCLUDED.feedback_templates,
    mastery_criteria = EXCLUDED.mastery_criteria,
    progression_model = EXCLUDED.progression_model,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    updated_at = NOW();

-- Français
INSERT INTO subject_profiles (subject_id, knowledge_type, primary_modality, secondary_modalities, cognitive_structure, theory_templates, exercise_templates, feedback_templates, mastery_criteria, progression_model, icon, color)
SELECT 
    s.id,
    'mixed',
    'reading_writing',
    ARRAY['auditory', 'visual'],
    '{"type": "networked", "description": "Concepts interconnectés (grammaire, vocabulaire, expression)", "prerequisite_strength": "moderate", "transfer_potential": "very_high"}'::jsonb,
    '{"grammaire": {"blocks": ["observation_text", "pattern_discovery", "rule_formulation", "exceptions", "practice"], "emphasis": "inductive_learning"}, "vocabulaire": {"blocks": ["context_discovery", "definition", "etymology", "usage_examples", "associations"], "emphasis": "semantic_networks"}, "expression": {"blocks": ["model_text", "analysis", "techniques", "guided_writing", "free_writing"], "emphasis": "progressive_autonomy"}}'::jsonb,
    '{"types_priority": ["fill_blank_context", "conjugation_table", "sentence_transformation", "text_comprehension", "dictation", "creative_writing", "word_association", "error_correction"], "difficulty_factors": ["text_complexity", "vocabulary_level", "grammar_rules_count"], "feedback_style": "highlight_pattern"}'::jsonb,
    '{"correct": {"messages": ["Bravo ! Tu maîtrises cette règle.", "Excellent ! Ton orthographe est parfaite.", "Super ! Tu as bien compris le texte."], "show_rule_reminder": true}, "incorrect": {"messages": ["Attention à l''accord !", "Relis la règle et observe l''exemple.", "Écoute bien le mot pour l''orthographier."], "highlight_error_type": true, "show_similar_examples": true}}'::jsonb,
    '{"accuracy_threshold": 0.80, "context_variety": true, "oral_component": true, "written_production": true}'::jsonb,
    'spiral',
    'book-open',
    '#8B5CF6'
FROM subjects s WHERE s.code = 'francais'
ON CONFLICT (subject_id) DO UPDATE SET
    knowledge_type = EXCLUDED.knowledge_type,
    primary_modality = EXCLUDED.primary_modality,
    secondary_modalities = EXCLUDED.secondary_modalities,
    cognitive_structure = EXCLUDED.cognitive_structure,
    theory_templates = EXCLUDED.theory_templates,
    exercise_templates = EXCLUDED.exercise_templates,
    feedback_templates = EXCLUDED.feedback_templates,
    mastery_criteria = EXCLUDED.mastery_criteria,
    progression_model = EXCLUDED.progression_model,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    updated_at = NOW();

-- Sciences
INSERT INTO subject_profiles (subject_id, knowledge_type, primary_modality, secondary_modalities, cognitive_structure, theory_templates, exercise_templates, feedback_templates, mastery_criteria, progression_model, icon, color)
SELECT 
    s.id,
    'conditional',
    'visual',
    ARRAY['kinesthetic', 'reading_writing'],
    '{"type": "causal", "description": "Concepts liés par des relations cause-effet", "prerequisite_strength": "moderate", "transfer_potential": "high"}'::jsonb,
    '{"default": {"blocks": ["observation", "question", "hypothesis", "experiment", "data", "conclusion", "application"], "emphasis": "scientific_method"}, "phenomenon": {"blocks": ["wonder", "description", "explanation", "mechanism", "real_world"], "emphasis": "understanding_why"}}'::jsonb,
    '{"types_priority": ["experiment_simulation", "hypothesis_testing", "data_interpretation", "cause_effect_matching", "classification", "diagram_labeling", "prediction"], "difficulty_factors": ["concept_abstraction", "variable_count", "data_complexity"], "feedback_style": "scientific_reasoning"}'::jsonb,
    '{"correct": {"messages": ["Excellente déduction scientifique !", "Tu raisonnes comme un vrai scientifique !", "Ton hypothèse était correcte !"], "explain_why_correct": true}, "incorrect": {"messages": ["Ton hypothèse n''était pas la bonne. Que s''est-il passé ?", "Observe à nouveau les données.", "En science, se tromper fait partie de l''apprentissage !"], "guide_to_correct_reasoning": true}}'::jsonb,
    '{"accuracy_threshold": 0.75, "reasoning_quality": true, "hypothesis_formulation": true, "data_interpretation": true}'::jsonb,
    'inquiry_based',
    'flask-conical',
    '#10B981'
FROM subjects s WHERE s.code = 'sciences'
ON CONFLICT (subject_id) DO UPDATE SET
    knowledge_type = EXCLUDED.knowledge_type,
    primary_modality = EXCLUDED.primary_modality,
    secondary_modalities = EXCLUDED.secondary_modalities,
    cognitive_structure = EXCLUDED.cognitive_structure,
    theory_templates = EXCLUDED.theory_templates,
    exercise_templates = EXCLUDED.exercise_templates,
    feedback_templates = EXCLUDED.feedback_templates,
    mastery_criteria = EXCLUDED.mastery_criteria,
    progression_model = EXCLUDED.progression_model,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    updated_at = NOW();

-- Histoire
INSERT INTO subject_profiles (subject_id, knowledge_type, primary_modality, secondary_modalities, cognitive_structure, theory_templates, exercise_templates, feedback_templates, mastery_criteria, progression_model, icon, color)
SELECT 
    s.id,
    'declarative',
    'visual',
    ARRAY['reading_writing', 'auditory'],
    '{"type": "chronological_thematic", "description": "Événements organisés dans le temps et par thèmes", "prerequisite_strength": "weak", "transfer_potential": "moderate"}'::jsonb,
    '{"default": {"blocks": ["hook_story", "context", "narrative", "key_figures", "causes", "consequences", "legacy"], "emphasis": "storytelling"}, "source_based": {"blocks": ["source_presentation", "analysis", "context", "interpretation", "critique"], "emphasis": "critical_thinking"}}'::jsonb,
    '{"types_priority": ["timeline_ordering", "source_analysis", "map_interaction", "character_matching", "cause_effect_linking", "period_comparison", "document_comprehension"], "difficulty_factors": ["time_span", "source_complexity", "causality_depth"], "feedback_style": "contextual_explanation"}'::jsonb,
    '{"correct": {"messages": ["Tu connais bien cette période !", "Excellent ! Tu as bien situé l''événement.", "Bravo ! Tu comprends les causes et conséquences."], "add_historical_anecdote": true}, "incorrect": {"messages": ["Attention aux dates ! Situe-toi sur la frise.", "Relis le contexte de cette époque.", "Qui étaient les personnages clés ?"], "show_timeline_context": true}}'::jsonb,
    '{"accuracy_threshold": 0.70, "chronology_understanding": true, "causality_understanding": true, "source_criticism": true}'::jsonb,
    'thematic',
    'landmark',
    '#F59E0B'
FROM subjects s WHERE s.code = 'histoire'
ON CONFLICT (subject_id) DO UPDATE SET
    knowledge_type = EXCLUDED.knowledge_type,
    primary_modality = EXCLUDED.primary_modality,
    secondary_modalities = EXCLUDED.secondary_modalities,
    cognitive_structure = EXCLUDED.cognitive_structure,
    theory_templates = EXCLUDED.theory_templates,
    exercise_templates = EXCLUDED.exercise_templates,
    feedback_templates = EXCLUDED.feedback_templates,
    mastery_criteria = EXCLUDED.mastery_criteria,
    progression_model = EXCLUDED.progression_model,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    updated_at = NOW();

-- Musique
INSERT INTO subject_profiles (subject_id, knowledge_type, primary_modality, secondary_modalities, cognitive_structure, theory_templates, exercise_templates, feedback_templates, mastery_criteria, progression_model, icon, color)
SELECT 
    s.id,
    'procedural',
    'auditory',
    ARRAY['kinesthetic', 'visual'],
    '{"type": "skill_tree", "description": "Compétences techniques et théoriques interconnectées", "prerequisite_strength": "strong", "transfer_potential": "moderate"}'::jsonb,
    '{"default": {"blocks": ["audio_hook", "listening_guide", "concept", "notation", "practice", "creation"], "emphasis": "ear_first"}, "instrument": {"blocks": ["demonstration", "technique", "slow_practice", "full_speed", "expression"], "emphasis": "progressive_mastery"}}'::jsonb,
    '{"types_priority": ["audio_recognition", "rhythm_reproduction", "note_reading", "interval_identification", "melody_completion", "instrument_simulation", "composition_mini"], "difficulty_factors": ["tempo", "complexity", "note_range"], "feedback_style": "audio_with_visual"}'::jsonb,
    '{"correct": {"messages": ["Tu as l''oreille musicale !", "Parfait ! Tu reconnais bien ce son.", "Bravo ! Ton rythme est précis."], "play_success_jingle": true}, "incorrect": {"messages": ["Écoute à nouveau attentivement.", "Compare avec l''exemple.", "Essaie de chanter la note dans ta tête."], "replay_correct_audio": true}}'::jsonb,
    '{"accuracy_threshold": 0.80, "ear_training": true, "rhythm_accuracy": true, "performance_component": true}'::jsonb,
    'skill_tree',
    'music',
    '#EC4899'
FROM subjects s WHERE s.code = 'musique'
ON CONFLICT (subject_id) DO UPDATE SET
    knowledge_type = EXCLUDED.knowledge_type,
    primary_modality = EXCLUDED.primary_modality,
    secondary_modalities = EXCLUDED.secondary_modalities,
    cognitive_structure = EXCLUDED.cognitive_structure,
    theory_templates = EXCLUDED.theory_templates,
    exercise_templates = EXCLUDED.exercise_templates,
    feedback_templates = EXCLUDED.feedback_templates,
    mastery_criteria = EXCLUDED.mastery_criteria,
    progression_model = EXCLUDED.progression_model,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    updated_at = NOW();

-- Informatique
INSERT INTO subject_profiles (subject_id, knowledge_type, primary_modality, secondary_modalities, cognitive_structure, theory_templates, exercise_templates, feedback_templates, mastery_criteria, progression_model, icon, color)
SELECT 
    s.id,
    'procedural',
    'kinesthetic',
    ARRAY['visual', 'reading_writing'],
    '{"type": "modular", "description": "Concepts modulaires combinables", "prerequisite_strength": "moderate", "transfer_potential": "very_high"}'::jsonb,
    '{"default": {"blocks": ["real_world_analogy", "concept", "pseudo_code", "demo", "practice", "debug"], "emphasis": "learning_by_doing"}, "algorithm": {"blocks": ["problem", "decomposition", "steps", "optimization", "generalization"], "emphasis": "computational_thinking"}}'::jsonb,
    '{"types_priority": ["block_programming", "algorithm_ordering", "bug_finding", "output_prediction", "pattern_completion", "logic_puzzle", "code_completion"], "difficulty_factors": ["instruction_count", "nesting_level", "abstraction"], "feedback_style": "execution_trace"}'::jsonb,
    '{"correct": {"messages": ["Ton algorithme fonctionne parfaitement !", "Excellent ! Tu penses comme un programmeur.", "Bug corrigé ! Tu es un vrai debugger."], "show_execution": true}, "incorrect": {"messages": ["Il y a un bug. Exécute pas à pas.", "Vérifie chaque instruction.", "Que se passe-t-il à l''étape 3 ?"], "highlight_error_line": true, "offer_step_by_step": true}}'::jsonb,
    '{"accuracy_threshold": 0.85, "debugging_skill": true, "algorithm_design": true, "code_reading": true}'::jsonb,
    'project_based',
    'code',
    '#6366F1'
FROM subjects s WHERE s.code = 'informatique'
ON CONFLICT (subject_id) DO UPDATE SET
    knowledge_type = EXCLUDED.knowledge_type,
    primary_modality = EXCLUDED.primary_modality,
    secondary_modalities = EXCLUDED.secondary_modalities,
    cognitive_structure = EXCLUDED.cognitive_structure,
    theory_templates = EXCLUDED.theory_templates,
    exercise_templates = EXCLUDED.exercise_templates,
    feedback_templates = EXCLUDED.feedback_templates,
    mastery_criteria = EXCLUDED.mastery_criteria,
    progression_model = EXCLUDED.progression_model,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    updated_at = NOW();
