-- =============================================
-- PHASE 4: QUOTAS ET FREEMIUM (V2)
-- Migration: skill_exercise_usage, user_plans
-- =============================================

-- Compteur exercices par compétence et utilisateur
CREATE TABLE IF NOT EXISTS public.skill_exercise_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    platform_generated INTEGER DEFAULT 0,
    user_generated INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(skill_id, user_id)
);

-- Plans utilisateur (freemium)
CREATE TABLE IF NOT EXISTS public.user_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    plan_type TEXT CHECK (plan_type IN ('free', 'premium')) DEFAULT 'free',
    limits JSONB DEFAULT '{"modules_per_month": 3, "skills_per_month": 10, "exercises_per_skill": 10, "ai_requests_per_day": 20}',
    current_usage JSONB DEFAULT '{"modules": 0, "skills": 0, "ai_requests": 0}',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    last_reset TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_skill_exercise_usage_skill ON public.skill_exercise_usage(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_exercise_usage_user ON public.skill_exercise_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_user ON public.user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_type ON public.user_plans(plan_type);

-- RLS pour skill_exercise_usage
ALTER TABLE public.skill_exercise_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY skill_exercise_usage_read_policy ON public.skill_exercise_usage
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY skill_exercise_usage_insert_policy ON public.skill_exercise_usage
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY skill_exercise_usage_update_policy ON public.skill_exercise_usage
    FOR UPDATE USING (user_id = auth.uid());

-- RLS pour user_plans
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_plans_read_policy ON public.user_plans
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY user_plans_insert_policy ON public.user_plans
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY user_plans_update_policy ON public.user_plans
    FOR UPDATE USING (user_id = auth.uid());

-- Fonction pour créer un plan par défaut à l'inscription
CREATE OR REPLACE FUNCTION create_default_user_plan()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_plans (user_id, plan_type)
    VALUES (NEW.id, 'free')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_default_plan
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_user_plan();

-- Fonction pour réinitialiser les quotas mensuels
CREATE OR REPLACE FUNCTION reset_monthly_quotas()
RETURNS void AS $$
BEGIN
    UPDATE public.user_plans
    SET 
        current_usage = '{"modules": 0, "skills": 0, "ai_requests": 0}'::jsonb,
        last_reset = NOW()
    WHERE last_reset < NOW() - INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier et incrémenter l'usage d'exercices
CREATE OR REPLACE FUNCTION check_and_increment_exercise_usage(
    p_skill_id UUID,
    p_user_id UUID,
    p_is_platform BOOLEAN DEFAULT TRUE
)
RETURNS JSONB AS $$
DECLARE
    v_usage RECORD;
    v_plan RECORD;
    v_limit INTEGER;
    v_current INTEGER;
    v_can_generate BOOLEAN;
    v_use_platform BOOLEAN;
BEGIN
    SELECT * INTO v_plan FROM public.user_plans WHERE user_id = p_user_id;
    
    IF v_plan IS NULL THEN
        INSERT INTO public.user_plans (user_id, plan_type)
        VALUES (p_user_id, 'free')
        RETURNING * INTO v_plan;
    END IF;
    
    SELECT * INTO v_usage 
    FROM public.skill_exercise_usage 
    WHERE skill_id = p_skill_id AND user_id = p_user_id;
    
    IF v_usage IS NULL THEN
        INSERT INTO public.skill_exercise_usage (skill_id, user_id, platform_generated, user_generated)
        VALUES (p_skill_id, p_user_id, 0, 0)
        RETURNING * INTO v_usage;
    END IF;
    
    v_limit := COALESCE((v_plan.limits->>'exercises_per_skill')::INTEGER, 10);
    v_current := v_usage.platform_generated;
    
    IF v_plan.plan_type = 'premium' THEN
        v_can_generate := TRUE;
        v_use_platform := TRUE;
    ELSIF v_current < v_limit THEN
        v_can_generate := TRUE;
        v_use_platform := TRUE;
    ELSE
        v_can_generate := TRUE;
        v_use_platform := FALSE;
    END IF;
    
    IF v_can_generate THEN
        IF v_use_platform THEN
            UPDATE public.skill_exercise_usage
            SET platform_generated = platform_generated + 1, updated_at = NOW()
            WHERE skill_id = p_skill_id AND user_id = p_user_id;
        ELSE
            UPDATE public.skill_exercise_usage
            SET user_generated = user_generated + 1, updated_at = NOW()
            WHERE skill_id = p_skill_id AND user_id = p_user_id;
        END IF;
    END IF;
    
    RETURN jsonb_build_object(
        'can_generate', v_can_generate,
        'use_platform_tokens', v_use_platform,
        'current_usage', v_current,
        'limit', v_limit,
        'remaining', GREATEST(0, v_limit - v_current),
        'plan_type', v_plan.plan_type
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger updated_at
CREATE TRIGGER trigger_user_plans_updated_at
    BEFORE UPDATE ON public.user_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_user_content_updated_at();

CREATE TRIGGER trigger_skill_exercise_usage_updated_at
    BEFORE UPDATE ON public.skill_exercise_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_user_content_updated_at();
