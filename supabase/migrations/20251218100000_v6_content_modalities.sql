-- V6 Migration: Content Modalities
-- Table pour gérer les différentes modalités d'apprentissage

CREATE TABLE IF NOT EXISTS content_modalities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    supported_formats TEXT[] NOT NULL,
    renderer_components TEXT[] NOT NULL,
    requires_audio BOOLEAN DEFAULT FALSE,
    requires_visual BOOLEAN DEFAULT TRUE,
    requires_interaction BOOLEAN DEFAULT FALSE,
    engagement_multiplier FLOAT DEFAULT 1.0,
    retention_multiplier FLOAT DEFAULT 1.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_content_modalities_code ON content_modalities(code);
CREATE INDEX IF NOT EXISTS idx_content_modalities_active ON content_modalities(is_active);

-- RLS
ALTER TABLE content_modalities ENABLE ROW LEVEL SECURITY;
CREATE POLICY content_modalities_read ON content_modalities FOR SELECT USING (true);

-- Seed des 5 modalités d'apprentissage
INSERT INTO content_modalities (code, name, description, supported_formats, renderer_components, requires_audio, requires_visual, requires_interaction, engagement_multiplier, retention_multiplier) VALUES
('visual', 'Visuel', 'Apprentissage par images, animations et vidéos', 
 ARRAY['image', 'animation', 'video', 'diagram', 'infographic', 'chart'],
 ARRAY['ImageBlock', 'AnimationBlock', 'VideoBlock', 'DiagramBlock', 'ChartBlock'],
 false, true, false, 1.2, 1.1),

('auditory', 'Auditif', 'Apprentissage par audio, narration et musique',
 ARRAY['audio', 'narration', 'music', 'podcast', 'voice_instruction'],
 ARRAY['AudioBlock', 'NarrationBlock', 'PodcastBlock', 'VoiceInstructionBlock'],
 true, false, false, 1.1, 1.3),

('kinesthetic', 'Kinesthésique', 'Apprentissage par manipulation et interaction',
 ARRAY['drag_drop', 'manipulation', 'simulation', 'drawing', 'gesture'],
 ARRAY['DragDropBlock', 'ManipulationBlock', 'SimulationBlock', 'DrawingBlock'],
 false, true, true, 1.4, 1.5),

('reading_writing', 'Lecture/Écriture', 'Apprentissage par textes et notes',
 ARRAY['text', 'notes', 'summary', 'mindmap', 'flashcard'],
 ARRAY['TextBlock', 'NotesBlock', 'SummaryBlock', 'MindMapBlock', 'FlashcardBlock'],
 false, true, false, 1.0, 1.2),

('gamified', 'Ludique', 'Apprentissage par jeux et défis',
 ARRAY['game', 'challenge', 'quiz', 'competition', 'puzzle', 'adventure'],
 ARRAY['GameBlock', 'ChallengeBlock', 'QuizBlock', 'CompetitionBlock', 'PuzzleBlock'],
 false, true, true, 1.5, 1.3)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    supported_formats = EXCLUDED.supported_formats,
    renderer_components = EXCLUDED.renderer_components,
    requires_audio = EXCLUDED.requires_audio,
    requires_visual = EXCLUDED.requires_visual,
    requires_interaction = EXCLUDED.requires_interaction,
    engagement_multiplier = EXCLUDED.engagement_multiplier,
    retention_multiplier = EXCLUDED.retention_multiplier;

-- Table pour le contenu par modalité
CREATE TABLE IF NOT EXISTS skill_modality_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    modality_id UUID REFERENCES content_modalities(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('theory', 'example', 'exercise', 'synthesis')),
    content_data JSONB NOT NULL,
    quality_score FLOAT DEFAULT 0,
    effectiveness_score FLOAT DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    language TEXT DEFAULT 'fr',
    duration_seconds INTEGER,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    is_validated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(skill_id, modality_id, content_type, language)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_skill_modality_content_skill ON skill_modality_content(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_modality_content_modality ON skill_modality_content(modality_id);
CREATE INDEX IF NOT EXISTS idx_skill_modality_content_type ON skill_modality_content(content_type);

-- RLS
ALTER TABLE skill_modality_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY skill_modality_content_read ON skill_modality_content FOR SELECT USING (true);

-- Table pour tracker les préférences de modalité par étudiant
CREATE TABLE IF NOT EXISTS student_modality_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    modality_id UUID REFERENCES content_modalities(id) ON DELETE CASCADE,
    preference_score FLOAT DEFAULT 50,
    success_rate FLOAT DEFAULT 0,
    engagement_score FLOAT DEFAULT 0,
    total_interactions INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, modality_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_student_modality_pref_student ON student_modality_preferences(student_id);

-- RLS
ALTER TABLE student_modality_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY student_modality_pref_read ON student_modality_preferences FOR SELECT USING (true);
CREATE POLICY student_modality_pref_insert ON student_modality_preferences FOR INSERT WITH CHECK (true);
CREATE POLICY student_modality_pref_update ON student_modality_preferences FOR UPDATE USING (true);
