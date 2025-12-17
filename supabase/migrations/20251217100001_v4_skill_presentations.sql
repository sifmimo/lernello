-- =============================================
-- V4 PHASE 1: TABLE SKILL_PRESENTATIONS
-- Présentations adaptatives de compétences
-- =============================================

CREATE TABLE IF NOT EXISTS public.skill_presentations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
    presentation_type TEXT NOT NULL DEFAULT 'direct',
    target_profile JSONB NOT NULL DEFAULT '{}',
    content_blocks JSONB NOT NULL DEFAULT '[]',
    language TEXT NOT NULL DEFAULT 'fr',
    pedagogical_approach TEXT DEFAULT 'traditional',
    estimated_duration_minutes INTEGER DEFAULT 15,
    engagement_score FLOAT DEFAULT 0,
    effectiveness_score FLOAT DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skill_presentations_skill ON public.skill_presentations(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_presentations_type ON public.skill_presentations(presentation_type);
CREATE INDEX IF NOT EXISTS idx_skill_presentations_approach ON public.skill_presentations(pedagogical_approach);
CREATE INDEX IF NOT EXISTS idx_skill_presentations_language ON public.skill_presentations(language);
CREATE INDEX IF NOT EXISTS idx_skill_presentations_default ON public.skill_presentations(is_default) WHERE is_default = TRUE;

ALTER TABLE public.skill_presentations ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS skill_presentations_read_policy ON public.skill_presentations FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS skill_presentations_insert_policy ON public.skill_presentations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS skill_presentations_update_policy ON public.skill_presentations FOR UPDATE USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE OR REPLACE FUNCTION update_skill_presentations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_skill_presentations_updated_at ON public.skill_presentations;
CREATE TRIGGER trigger_skill_presentations_updated_at
    BEFORE UPDATE ON public.skill_presentations
    FOR EACH ROW
    EXECUTE FUNCTION update_skill_presentations_updated_at();
