-- V9 Learning Sessions System
-- Refonte complète de la partie "Apprendre"

-- 1. Table des sessions d'apprentissage
CREATE TABLE IF NOT EXISTS learning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    
    -- Configuration
    session_type TEXT NOT NULL DEFAULT 'practice' CHECK (session_type IN ('learn', 'practice', 'review')),
    target_duration_minutes INTEGER NOT NULL DEFAULT 5,
    target_exercises INTEGER NOT NULL DEFAULT 5,
    
    -- État
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    current_step INTEGER DEFAULT 0,
    total_steps INTEGER NOT NULL,
    
    -- Résultats
    exercises_completed INTEGER DEFAULT 0,
    exercises_correct INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    
    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Métadonnées
    exercises_order JSONB NOT NULL DEFAULT '[]',
    theory_shown BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_sessions_student ON learning_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_skill ON learning_sessions(skill_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_status ON learning_sessions(status);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_created ON learning_sessions(created_at DESC);

-- 2. Table du contenu théorique structuré
CREATE TABLE IF NOT EXISTS skill_theory_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    
    -- Contenu structuré
    title TEXT NOT NULL,
    introduction TEXT NOT NULL,
    concept_explanation TEXT NOT NULL,
    key_points JSONB NOT NULL DEFAULT '[]',
    examples JSONB NOT NULL DEFAULT '[]',
    tips JSONB DEFAULT '[]',
    common_mistakes JSONB DEFAULT '[]',
    
    -- Métadonnées
    language TEXT NOT NULL DEFAULT 'fr',
    difficulty_level INTEGER DEFAULT 1,
    estimated_read_time_seconds INTEGER DEFAULT 60,
    
    -- Qualité
    is_validated BOOLEAN DEFAULT FALSE,
    validation_score INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_skill_theory_skill_lang ON skill_theory_content(skill_id, language);

-- 3. Table de rotation des exercices par élève
CREATE TABLE IF NOT EXISTS student_exercise_rotation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    
    -- Rotation tracking
    current_rotation INTEGER DEFAULT 1,
    exercises_seen_this_rotation JSONB DEFAULT '[]',
    last_exercise_id UUID,
    last_exercise_type TEXT,
    
    -- Stats
    total_exercises_done INTEGER DEFAULT 0,
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(student_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_exercise_rotation_student ON student_exercise_rotation(student_id);

-- 4. Enrichir la table exercises existante
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS pool_status TEXT DEFAULT 'active';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS success_rate FLOAT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS avg_time_seconds FLOAT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 50;

-- Contrainte sur pool_status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'exercises_pool_status_check'
    ) THEN
        ALTER TABLE exercises ADD CONSTRAINT exercises_pool_status_check 
            CHECK (pool_status IN ('active', 'retired', 'flagged'));
    END IF;
END $$;

-- Index pour sélection rapide des exercices
CREATE INDEX IF NOT EXISTS idx_exercises_pool ON exercises(skill_id, pool_status, quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_exercises_skill_active ON exercises(skill_id) WHERE pool_status = 'active';

-- 5. RLS Policies

-- learning_sessions
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own sessions" ON learning_sessions;
CREATE POLICY "Users can view their own sessions" ON learning_sessions
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM student_profiles WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create sessions for their profiles" ON learning_sessions;
CREATE POLICY "Users can create sessions for their profiles" ON learning_sessions
    FOR INSERT WITH CHECK (
        student_id IN (
            SELECT id FROM student_profiles WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their own sessions" ON learning_sessions;
CREATE POLICY "Users can update their own sessions" ON learning_sessions
    FOR UPDATE USING (
        student_id IN (
            SELECT id FROM student_profiles WHERE user_id = auth.uid()
        )
    );

-- skill_theory_content
ALTER TABLE skill_theory_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read theory content" ON skill_theory_content;
CREATE POLICY "Anyone can read theory content" ON skill_theory_content
    FOR SELECT USING (true);

-- student_exercise_rotation
ALTER TABLE student_exercise_rotation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their rotation data" ON student_exercise_rotation;
CREATE POLICY "Users can manage their rotation data" ON student_exercise_rotation
    FOR ALL USING (
        student_id IN (
            SELECT id FROM student_profiles WHERE user_id = auth.uid()
        )
    );

-- 6. Fonction pour mettre à jour la rotation après un exercice
CREATE OR REPLACE FUNCTION update_exercise_rotation(
    p_student_id UUID,
    p_skill_id UUID,
    p_exercise_id UUID,
    p_exercise_type TEXT
) RETURNS VOID AS $$
DECLARE
    v_rotation RECORD;
    v_seen JSONB;
    v_pool_size INTEGER;
BEGIN
    -- Récupérer ou créer la rotation
    SELECT * INTO v_rotation FROM student_exercise_rotation
    WHERE student_id = p_student_id AND skill_id = p_skill_id;
    
    IF NOT FOUND THEN
        INSERT INTO student_exercise_rotation (student_id, skill_id, exercises_seen_this_rotation, last_exercise_id, last_exercise_type)
        VALUES (p_student_id, p_skill_id, jsonb_build_array(p_exercise_id), p_exercise_id, p_exercise_type);
        RETURN;
    END IF;
    
    -- Ajouter l'exercice aux vus
    v_seen := v_rotation.exercises_seen_this_rotation || jsonb_build_array(p_exercise_id);
    
    -- Compter le pool total
    SELECT COUNT(*) INTO v_pool_size FROM exercises
    WHERE skill_id = p_skill_id AND pool_status = 'active';
    
    -- Si tous vus, nouvelle rotation
    IF jsonb_array_length(v_seen) >= v_pool_size THEN
        UPDATE student_exercise_rotation
        SET current_rotation = current_rotation + 1,
            exercises_seen_this_rotation = '[]'::jsonb,
            last_exercise_id = p_exercise_id,
            last_exercise_type = p_exercise_type,
            total_exercises_done = total_exercises_done + 1,
            updated_at = NOW()
        WHERE id = v_rotation.id;
    ELSE
        UPDATE student_exercise_rotation
        SET exercises_seen_this_rotation = v_seen,
            last_exercise_id = p_exercise_id,
            last_exercise_type = p_exercise_type,
            total_exercises_done = total_exercises_done + 1,
            updated_at = NOW()
        WHERE id = v_rotation.id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Fonction pour mettre à jour les stats d'un exercice après utilisation
CREATE OR REPLACE FUNCTION update_exercise_stats(
    p_exercise_id UUID,
    p_was_correct BOOLEAN,
    p_time_seconds FLOAT
) RETURNS VOID AS $$
DECLARE
    v_exercise RECORD;
    v_new_count INTEGER;
    v_new_success_rate FLOAT;
    v_new_avg_time FLOAT;
BEGIN
    SELECT * INTO v_exercise FROM exercises WHERE id = p_exercise_id;
    
    IF NOT FOUND THEN RETURN; END IF;
    
    v_new_count := COALESCE(v_exercise.usage_count, 0) + 1;
    
    -- Calculer le nouveau taux de succès
    IF v_exercise.success_rate IS NULL THEN
        v_new_success_rate := CASE WHEN p_was_correct THEN 1.0 ELSE 0.0 END;
    ELSE
        v_new_success_rate := (v_exercise.success_rate * v_exercise.usage_count + (CASE WHEN p_was_correct THEN 1.0 ELSE 0.0 END)) / v_new_count;
    END IF;
    
    -- Calculer le nouveau temps moyen
    IF v_exercise.avg_time_seconds IS NULL THEN
        v_new_avg_time := p_time_seconds;
    ELSE
        v_new_avg_time := (v_exercise.avg_time_seconds * v_exercise.usage_count + p_time_seconds) / v_new_count;
    END IF;
    
    UPDATE exercises
    SET usage_count = v_new_count,
        success_rate = v_new_success_rate,
        avg_time_seconds = v_new_avg_time
    WHERE id = p_exercise_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
