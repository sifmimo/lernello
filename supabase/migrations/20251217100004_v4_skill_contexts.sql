-- =============================================
-- V4 PHASE 2: TABLE SKILL_CONTEXTS
-- Contextes d'application des compétences
-- =============================================

CREATE TABLE IF NOT EXISTS public.skill_contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
    context_type TEXT NOT NULL,
    context_name TEXT NOT NULL,
    description TEXT NOT NULL,
    example_situation TEXT,
    exercise_templates JSONB DEFAULT '[]',
    interest_tags TEXT[] DEFAULT '{}',
    age_min INTEGER DEFAULT 6,
    age_max INTEGER DEFAULT 18,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skill_contexts_skill ON public.skill_contexts(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_contexts_type ON public.skill_contexts(context_type);
CREATE INDEX IF NOT EXISTS idx_skill_contexts_tags ON public.skill_contexts USING GIN(interest_tags);

ALTER TABLE public.skill_contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS skill_contexts_read_policy ON public.skill_contexts FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS skill_contexts_write_policy ON public.skill_contexts FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
