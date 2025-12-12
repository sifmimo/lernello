-- Migration: ai_content_system
-- Version: 20251212230000
-- Description: Système auto-alimenté de génération IA avec notation et gestion admin

-- Ajouter les colonnes manquantes à exercises si elles n'existent pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'ai_model_used') THEN
        ALTER TABLE public.exercises ADD COLUMN ai_model_used TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'generation_prompt') THEN
        ALTER TABLE public.exercises ADD COLUMN generation_prompt TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'language') THEN
        ALTER TABLE public.exercises ADD COLUMN language TEXT DEFAULT 'fr';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'pedagogical_method') THEN
        ALTER TABLE public.exercises ADD COLUMN pedagogical_method TEXT DEFAULT 'standard';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'target_age_min') THEN
        ALTER TABLE public.exercises ADD COLUMN target_age_min INTEGER DEFAULT 6;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'target_age_max') THEN
        ALTER TABLE public.exercises ADD COLUMN target_age_max INTEGER DEFAULT 12;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'average_rating') THEN
        ALTER TABLE public.exercises ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'rating_count') THEN
        ALTER TABLE public.exercises ADD COLUMN rating_count INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'flagged_for_review') THEN
        ALTER TABLE public.exercises ADD COLUMN flagged_for_review BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Table des notations d'exercices
CREATE TABLE IF NOT EXISTS public.exercise_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
    feedback TEXT,
    rated_by TEXT CHECK (rated_by IN ('student', 'parent')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exercise_id, student_id)
);

-- Table de suivi du niveau de l'élève par compétence
CREATE TABLE IF NOT EXISTS public.student_level_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
    current_level DECIMAL(3,2) DEFAULT 1.0 CHECK (current_level BETWEEN 0 AND 5),
    exercises_completed INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    average_time_seconds INTEGER DEFAULT 0,
    hints_used INTEGER DEFAULT 0,
    last_exercise_at TIMESTAMPTZ,
    recommended_difficulty INTEGER DEFAULT 1 CHECK (recommended_difficulty BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, skill_id)
);

-- Table de logs de génération IA
CREATE TABLE IF NOT EXISTS public.ai_generation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
    model_used TEXT NOT NULL,
    tokens_input INTEGER DEFAULT 0,
    tokens_output INTEGER DEFAULT 0,
    cost_estimate DECIMAL(10,6) DEFAULT 0,
    generation_time_ms INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table de configuration des modèles IA par tâche
CREATE TABLE IF NOT EXISTS public.ai_model_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_type TEXT UNIQUE NOT NULL CHECK (task_type IN ('exercise_generation', 'hint', 'encouragement', 'explanation', 'evaluation')),
    model_name TEXT NOT NULL,
    max_tokens INTEGER DEFAULT 1000,
    temperature DECIMAL(2,1) DEFAULT 0.7,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer la configuration par défaut des modèles
INSERT INTO public.ai_model_config (task_type, model_name, max_tokens, temperature) VALUES
    ('exercise_generation', 'gpt-4o', 2000, 0.7),
    ('hint', 'gpt-4o-mini', 200, 0.5),
    ('encouragement', 'gpt-4o-mini', 100, 0.8),
    ('explanation', 'gpt-4o-mini', 500, 0.6),
    ('evaluation', 'gpt-4o-mini', 100, 0.3)
ON CONFLICT (task_type) DO NOTHING;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_exercise_ratings_exercise ON public.exercise_ratings(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_ratings_student ON public.exercise_ratings(student_id);
CREATE INDEX IF NOT EXISTS idx_student_level_tracking_student ON public.student_level_tracking(student_id);
CREATE INDEX IF NOT EXISTS idx_student_level_tracking_skill ON public.student_level_tracking(skill_id);
CREATE INDEX IF NOT EXISTS idx_ai_generation_logs_skill ON public.ai_generation_logs(skill_id);
CREATE INDEX IF NOT EXISTS idx_exercises_ai_generated ON public.exercises(is_ai_generated) WHERE is_ai_generated = TRUE;
CREATE INDEX IF NOT EXISTS idx_exercises_flagged ON public.exercises(flagged_for_review) WHERE flagged_for_review = TRUE;

-- Enable RLS
ALTER TABLE public.exercise_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_level_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_config ENABLE ROW LEVEL SECURITY;

-- Policies pour exercise_ratings
CREATE POLICY "Users can view their own ratings" ON public.exercise_ratings 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own ratings" ON public.exercise_ratings 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ratings" ON public.exercise_ratings 
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies pour student_level_tracking
CREATE POLICY "Users can view their students level" ON public.student_level_tracking 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.student_profiles sp 
            WHERE sp.id = student_id AND sp.user_id = auth.uid()
        )
    );

-- Policy pour ai_model_config (lecture publique)
CREATE POLICY "Anyone can view model config" ON public.ai_model_config FOR SELECT USING (true);

-- Policy pour permettre l'insertion d'exercices générés par IA
DROP POLICY IF EXISTS "Authenticated users can insert exercises" ON public.exercises;
CREATE POLICY "Authenticated users can insert exercises" ON public.exercises 
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy pour permettre la mise à jour des exercices (rating)
DROP POLICY IF EXISTS "Authenticated users can update exercises" ON public.exercises;
CREATE POLICY "Authenticated users can update exercises" ON public.exercises 
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Fonction pour mettre à jour la moyenne des notes
CREATE OR REPLACE FUNCTION update_exercise_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.exercises
    SET 
        average_rating = (
            SELECT COALESCE(AVG(rating), 0) 
            FROM public.exercise_ratings 
            WHERE exercise_id = NEW.exercise_id
        ),
        rating_count = (
            SELECT COUNT(*) 
            FROM public.exercise_ratings 
            WHERE exercise_id = NEW.exercise_id
        ),
        flagged_for_review = (
            SELECT COALESCE(AVG(rating), 5) < 2.5
            FROM public.exercise_ratings 
            WHERE exercise_id = NEW.exercise_id
        )
    WHERE id = NEW.exercise_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour automatiquement la moyenne
DROP TRIGGER IF EXISTS trigger_update_exercise_rating ON public.exercise_ratings;
CREATE TRIGGER trigger_update_exercise_rating
    AFTER INSERT OR UPDATE ON public.exercise_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_exercise_rating();

-- Fonction pour mettre à jour le niveau de l'élève
CREATE OR REPLACE FUNCTION update_student_level()
RETURNS TRIGGER AS $$
DECLARE
    v_skill_id UUID;
    v_student_id UUID;
BEGIN
    -- Récupérer skill_id depuis l'exercice
    SELECT skill_id INTO v_skill_id FROM public.exercises WHERE id = NEW.exercise_id;
    v_student_id := NEW.student_id;
    
    -- Mettre à jour ou créer le tracking
    INSERT INTO public.student_level_tracking (student_id, skill_id, exercises_completed, correct_answers, last_exercise_at)
    VALUES (v_student_id, v_skill_id, 1, CASE WHEN NEW.is_correct THEN 1 ELSE 0 END, NOW())
    ON CONFLICT (student_id, skill_id) DO UPDATE SET
        exercises_completed = student_level_tracking.exercises_completed + 1,
        correct_answers = student_level_tracking.correct_answers + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
        last_exercise_at = NOW(),
        current_level = LEAST(5, GREATEST(0, 
            (student_level_tracking.correct_answers + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END)::DECIMAL / 
            GREATEST(1, student_level_tracking.exercises_completed + 1) * 5
        )),
        recommended_difficulty = LEAST(5, GREATEST(1, 
            ROUND((student_level_tracking.correct_answers + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END)::DECIMAL / 
            GREATEST(1, student_level_tracking.exercises_completed + 1) * 5)
        )),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour le niveau après chaque tentative
DROP TRIGGER IF EXISTS trigger_update_student_level ON public.exercise_attempts;
CREATE TRIGGER trigger_update_student_level
    AFTER INSERT ON public.exercise_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_student_level();
