-- =============================================
-- V4 PHASE 2: TABLE SUBJECT_PROFILES
-- Configuration spécifique par matière
-- =============================================

CREATE TABLE IF NOT EXISTS public.subject_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE UNIQUE,
    knowledge_type TEXT NOT NULL DEFAULT 'procedural',
    primary_modality TEXT NOT NULL DEFAULT 'logical',
    skill_structure JSONB NOT NULL DEFAULT '{}',
    default_presentation_templates JSONB DEFAULT '[]',
    preferred_exercise_types TEXT[] DEFAULT '{}',
    progression_model TEXT DEFAULT 'linear',
    assessment_approach JSONB DEFAULT '{}',
    icon TEXT,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subject_profiles_subject ON public.subject_profiles(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_profiles_knowledge_type ON public.subject_profiles(knowledge_type);

ALTER TABLE public.subject_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS subject_profiles_read_policy ON public.subject_profiles FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS subject_profiles_admin_policy ON public.subject_profiles FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
