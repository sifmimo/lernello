-- V7: Micro-Lessons - Excellence du Contenu Pédagogique
-- Structure pour les micro-leçons de 3-5 minutes avec validation qualité

-- Table principale des micro-leçons
CREATE TABLE IF NOT EXISTS micro_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 1,
    
    -- Métadonnées
    title TEXT NOT NULL,
    subtitle TEXT,
    estimated_duration_seconds INTEGER NOT NULL DEFAULT 240,
    difficulty_tier INTEGER NOT NULL DEFAULT 1 CHECK (difficulty_tier BETWEEN 1 AND 3),
    
    -- Contenu structuré (JSONB)
    hook JSONB NOT NULL DEFAULT '{}',
    discover JSONB NOT NULL DEFAULT '{}',
    learn JSONB NOT NULL DEFAULT '{}',
    practice JSONB NOT NULL DEFAULT '{}',
    apply JSONB NOT NULL DEFAULT '{}',
    
    -- Qualité
    quality_score INTEGER NOT NULL DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
    review_status TEXT NOT NULL DEFAULT 'draft' CHECK (review_status IN ('draft', 'reviewed', 'approved')),
    quality_checks JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_reviewed_at TIMESTAMPTZ,
    
    -- Contrainte d'unicité
    UNIQUE(skill_id, order_index)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_micro_lessons_skill_id ON micro_lessons(skill_id);
CREATE INDEX IF NOT EXISTS idx_micro_lessons_quality ON micro_lessons(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_micro_lessons_status ON micro_lessons(review_status);

-- Table de progression des élèves sur les micro-leçons
CREATE TABLE IF NOT EXISTS student_micro_lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    micro_lesson_id UUID NOT NULL REFERENCES micro_lessons(id) ON DELETE CASCADE,
    
    -- Progression
    current_step TEXT NOT NULL DEFAULT 'hook' CHECK (current_step IN ('hook', 'discover', 'learn', 'practice', 'apply', 'completed')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Performance
    practice_score INTEGER DEFAULT 0,
    practice_attempts INTEGER DEFAULT 0,
    apply_score INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    
    -- Interactions
    interactions JSONB DEFAULT '[]',
    hints_used INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(student_id, micro_lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_student_micro_progress_student ON student_micro_lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_micro_progress_lesson ON student_micro_lesson_progress(micro_lesson_id);

-- Table des feedbacks enrichis
CREATE TABLE IF NOT EXISTS enhanced_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Contexte
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    micro_lesson_id UUID REFERENCES micro_lessons(id) ON DELETE SET NULL,
    exercise_id UUID,
    
    -- Feedback
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('correct', 'incorrect', 'partial')),
    message TEXT NOT NULL,
    explanation TEXT,
    visual_data JSONB,
    next_action JSONB NOT NULL,
    encouragement TEXT NOT NULL,
    character_emotion TEXT DEFAULT 'encouraging',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enhanced_feedbacks_student ON enhanced_feedbacks(student_id);

-- Table des célébrations
CREATE TABLE IF NOT EXISTS celebrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    
    -- Type de célébration
    celebration_level TEXT NOT NULL CHECK (celebration_level IN ('correct_answer', 'streak_3', 'lesson_complete', 'level_up', 'mastery')),
    animation TEXT NOT NULL,
    sound TEXT,
    message TEXT NOT NULL,
    
    -- Contexte
    context JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_celebrations_student ON celebrations(student_id);
CREATE INDEX IF NOT EXISTS idx_celebrations_level ON celebrations(celebration_level);

-- Fonction de mise à jour automatique du timestamp
CREATE OR REPLACE FUNCTION update_micro_lesson_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS trigger_micro_lessons_updated ON micro_lessons;
CREATE TRIGGER trigger_micro_lessons_updated
    BEFORE UPDATE ON micro_lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_micro_lesson_timestamp();

DROP TRIGGER IF EXISTS trigger_student_micro_progress_updated ON student_micro_lesson_progress;
CREATE TRIGGER trigger_student_micro_progress_updated
    BEFORE UPDATE ON student_micro_lesson_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_micro_lesson_timestamp();

-- RLS Policies
ALTER TABLE micro_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_micro_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE celebrations ENABLE ROW LEVEL SECURITY;

-- Policies pour micro_lessons (lecture publique, écriture admin)
CREATE POLICY "micro_lessons_select" ON micro_lessons
    FOR SELECT USING (true);

CREATE POLICY "micro_lessons_insert" ON micro_lessons
    FOR INSERT WITH CHECK (true);

CREATE POLICY "micro_lessons_update" ON micro_lessons
    FOR UPDATE USING (true);

-- Policies pour student_micro_lesson_progress
CREATE POLICY "student_micro_progress_select" ON student_micro_lesson_progress
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM students WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "student_micro_progress_insert" ON student_micro_lesson_progress
    FOR INSERT WITH CHECK (
        student_id IN (
            SELECT id FROM students WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "student_micro_progress_update" ON student_micro_lesson_progress
    FOR UPDATE USING (
        student_id IN (
            SELECT id FROM students WHERE user_id = auth.uid()
        )
    );

-- Policies pour enhanced_feedbacks
CREATE POLICY "enhanced_feedbacks_select" ON enhanced_feedbacks
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM students WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "enhanced_feedbacks_insert" ON enhanced_feedbacks
    FOR INSERT WITH CHECK (
        student_id IN (
            SELECT id FROM students WHERE user_id = auth.uid()
        )
    );

-- Policies pour celebrations
CREATE POLICY "celebrations_select" ON celebrations
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM students WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "celebrations_insert" ON celebrations
    FOR INSERT WITH CHECK (
        student_id IN (
            SELECT id FROM students WHERE user_id = auth.uid()
        )
    );

-- Vue pour les statistiques de qualité des micro-leçons
CREATE OR REPLACE VIEW micro_lessons_quality_stats AS
SELECT 
    s.id as subject_id,
    s.name as subject_name,
    COUNT(ml.id) as total_lessons,
    AVG(ml.quality_score) as avg_quality_score,
    COUNT(CASE WHEN ml.quality_score >= 90 THEN 1 END) as excellent_count,
    COUNT(CASE WHEN ml.quality_score >= 75 AND ml.quality_score < 90 THEN 1 END) as good_count,
    COUNT(CASE WHEN ml.quality_score >= 60 AND ml.quality_score < 75 THEN 1 END) as warning_count,
    COUNT(CASE WHEN ml.quality_score < 60 THEN 1 END) as rejected_count,
    COUNT(CASE WHEN ml.review_status = 'approved' THEN 1 END) as approved_count
FROM subjects s
LEFT JOIN domains d ON d.subject_id = s.id
LEFT JOIN skills sk ON sk.domain_id = d.id
LEFT JOIN micro_lessons ml ON ml.skill_id = sk.id
GROUP BY s.id, s.name;
