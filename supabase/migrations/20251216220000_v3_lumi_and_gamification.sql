-- Migration: V3 Lumi and Enhanced Gamification
-- Version: 20251216220000

-- Table pour stocker les préférences et état de Lumi par utilisateur
CREATE TABLE IF NOT EXISTS public.lumi_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE UNIQUE,
    lumi_mood TEXT DEFAULT 'neutral',
    last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
    interaction_count INTEGER DEFAULT 0,
    preferred_encouragement_style TEXT DEFAULT 'playful',
    avatar_style TEXT DEFAULT 'explorer',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les streaks quotidiens
CREATE TABLE IF NOT EXISTS public.daily_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    streak_freeze_available BOOLEAN DEFAULT TRUE,
    streak_freeze_used_at DATE,
    total_days_active INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id)
);

-- Table pour l'XP et les niveaux
CREATE TABLE IF NOT EXISTS public.student_xp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE UNIQUE,
    total_xp INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    xp_to_next_level INTEGER DEFAULT 100,
    xp_earned_today INTEGER DEFAULT 0,
    xp_earned_this_week INTEGER DEFAULT 0,
    last_xp_reset_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les sessions rapides (3 minutes chrono)
CREATE TABLE IF NOT EXISTS public.quick_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    exercises_completed INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE
);

-- Table pour les logs de génération IA (pour le centre de contrôle)
CREATE TABLE IF NOT EXISTS public.ai_generation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature TEXT NOT NULL,
    model TEXT,
    tokens_used INTEGER DEFAULT 0,
    cost NUMERIC(10, 6) DEFAULT 0,
    request_data JSONB,
    response_data JSONB,
    duration_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour le cache de contenu IA
CREATE TABLE IF NOT EXISTS public.ai_cached_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key TEXT UNIQUE NOT NULL,
    content_type TEXT NOT NULL,
    content JSONB NOT NULL,
    hit_count INTEGER DEFAULT 0,
    last_hit_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes pour les performances
CREATE INDEX IF NOT EXISTS idx_lumi_preferences_student ON public.lumi_preferences(student_id);
CREATE INDEX IF NOT EXISTS idx_daily_streaks_student ON public.daily_streaks(student_id);
CREATE INDEX IF NOT EXISTS idx_daily_streaks_date ON public.daily_streaks(last_activity_date);
CREATE INDEX IF NOT EXISTS idx_student_xp_student ON public.student_xp(student_id);
CREATE INDEX IF NOT EXISTS idx_student_xp_level ON public.student_xp(current_level);
CREATE INDEX IF NOT EXISTS idx_quick_sessions_student ON public.quick_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_quick_sessions_date ON public.quick_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_ai_logs_feature ON public.ai_generation_logs(feature);
CREATE INDEX IF NOT EXISTS idx_ai_logs_date ON public.ai_generation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON public.ai_cached_content(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON public.ai_cached_content(expires_at);

-- Enable RLS
ALTER TABLE public.lumi_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_cached_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour lumi_preferences
CREATE POLICY "Students can view own lumi preferences" ON public.lumi_preferences
    FOR SELECT USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Students can update own lumi preferences" ON public.lumi_preferences
    FOR ALL USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

-- RLS Policies pour daily_streaks
CREATE POLICY "Students can view own streaks" ON public.daily_streaks
    FOR SELECT USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Students can update own streaks" ON public.daily_streaks
    FOR ALL USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

-- RLS Policies pour student_xp
CREATE POLICY "Students can view own xp" ON public.student_xp
    FOR SELECT USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Students can update own xp" ON public.student_xp
    FOR ALL USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

-- RLS Policies pour quick_sessions
CREATE POLICY "Students can view own quick sessions" ON public.quick_sessions
    FOR SELECT USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Students can create quick sessions" ON public.quick_sessions
    FOR INSERT WITH CHECK (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Students can update own quick sessions" ON public.quick_sessions
    FOR UPDATE USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

-- RLS Policies pour ai_generation_logs (admin only)
CREATE POLICY "Admins can view ai logs" ON public.ai_generation_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS Policies pour ai_cached_content (admin only)
CREATE POLICY "Admins can manage ai cache" ON public.ai_cached_content
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Fonction pour mettre à jour le streak quotidien
CREATE OR REPLACE FUNCTION update_daily_streak(p_student_id UUID)
RETURNS void AS $$
DECLARE
    v_last_date DATE;
    v_today DATE := CURRENT_DATE;
    v_current_streak INTEGER;
BEGIN
    SELECT last_activity_date, current_streak INTO v_last_date, v_current_streak
    FROM public.daily_streaks
    WHERE student_id = p_student_id;

    IF NOT FOUND THEN
        INSERT INTO public.daily_streaks (student_id, current_streak, longest_streak, last_activity_date, total_days_active)
        VALUES (p_student_id, 1, 1, v_today, 1);
    ELSIF v_last_date = v_today THEN
        NULL;
    ELSIF v_last_date = v_today - 1 THEN
        UPDATE public.daily_streaks
        SET current_streak = current_streak + 1,
            longest_streak = GREATEST(longest_streak, current_streak + 1),
            last_activity_date = v_today,
            total_days_active = total_days_active + 1,
            updated_at = NOW()
        WHERE student_id = p_student_id;
    ELSE
        UPDATE public.daily_streaks
        SET current_streak = 1,
            last_activity_date = v_today,
            total_days_active = total_days_active + 1,
            updated_at = NOW()
        WHERE student_id = p_student_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour ajouter de l'XP
CREATE OR REPLACE FUNCTION add_student_xp(p_student_id UUID, p_xp_amount INTEGER)
RETURNS TABLE(new_total_xp INTEGER, new_level INTEGER, level_up BOOLEAN) AS $$
DECLARE
    v_current_xp INTEGER;
    v_current_level INTEGER;
    v_xp_to_next INTEGER;
    v_new_level INTEGER;
    v_level_up BOOLEAN := FALSE;
BEGIN
    SELECT total_xp, current_level, xp_to_next_level INTO v_current_xp, v_current_level, v_xp_to_next
    FROM public.student_xp
    WHERE student_id = p_student_id;

    IF NOT FOUND THEN
        INSERT INTO public.student_xp (student_id, total_xp, current_level, xp_to_next_level, xp_earned_today)
        VALUES (p_student_id, p_xp_amount, 1, 100, p_xp_amount)
        RETURNING total_xp, current_level INTO v_current_xp, v_current_level;
        v_xp_to_next := 100;
    ELSE
        v_current_xp := v_current_xp + p_xp_amount;
        
        UPDATE public.student_xp
        SET total_xp = v_current_xp,
            xp_earned_today = xp_earned_today + p_xp_amount,
            xp_earned_this_week = xp_earned_this_week + p_xp_amount,
            updated_at = NOW()
        WHERE student_id = p_student_id;
    END IF;

    v_new_level := v_current_level;
    WHILE v_current_xp >= v_xp_to_next LOOP
        v_new_level := v_new_level + 1;
        v_xp_to_next := v_xp_to_next + (v_new_level * 50);
        v_level_up := TRUE;
    END LOOP;

    IF v_new_level > v_current_level THEN
        UPDATE public.student_xp
        SET current_level = v_new_level,
            xp_to_next_level = v_xp_to_next
        WHERE student_id = p_student_id;
    END IF;

    RETURN QUERY SELECT v_current_xp, v_new_level, v_level_up;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Nouveaux achievements pour V3
INSERT INTO public.achievement_rules (code, version, name_key, description_key, icon, category, trigger_conditions, is_active)
VALUES 
    ('quick_session_first', 1, 'Premier sprint', 'Complète ta première session de 3 minutes', '⚡', 'special', '{"type": "quick_session", "count": 1}', true),
    ('quick_session_5', 1, 'Sprinter régulier', 'Complète 5 sessions de 3 minutes', '🏃', 'milestone', '{"type": "quick_session", "count": 5}', true),
    ('streak_7', 1, 'Une semaine !', 'Maintiens un streak de 7 jours', '🔥', 'streak', '{"type": "streak", "days": 7}', true),
    ('streak_30', 1, 'Un mois entier !', 'Maintiens un streak de 30 jours', '🌟', 'streak', '{"type": "streak", "days": 30}', true),
    ('level_5', 1, 'Apprenti', 'Atteins le niveau 5', '📚', 'milestone', '{"type": "level", "level": 5}', true),
    ('level_10', 1, 'Expert', 'Atteins le niveau 10', '🎓', 'milestone', '{"type": "level", "level": 10}', true),
    ('xp_1000', 1, 'Millénaire', 'Gagne 1000 XP au total', '💎', 'milestone', '{"type": "xp", "amount": 1000}', true),
    ('perfect_quick_session', 1, 'Sprint parfait', 'Réussis tous les exercices d\'une session rapide', '✨', 'special', '{"type": "perfect_quick_session"}', true)
ON CONFLICT (code, version) DO NOTHING;
