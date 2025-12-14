-- =============================================
-- PHASE 1: STRUCTURE COMPÉTENCE COMPLÈTE (V2)
-- Migration: skill_content, skill_examples, skill_self_assessments
-- =============================================

-- Contenu structuré d'une compétence (13 points de la vision V2)
CREATE TABLE IF NOT EXISTS public.skill_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE UNIQUE,
    objective TEXT NOT NULL,
    context TEXT,
    theory TEXT NOT NULL,
    synthesis TEXT,
    enrichments JSONB DEFAULT '{}',
    pedagogical_method TEXT DEFAULT 'standard',
    source TEXT CHECK (source IN ('official', 'user', 'ai')) DEFAULT 'official',
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    is_validated BOOLEAN DEFAULT FALSE,
    language TEXT NOT NULL DEFAULT 'fr',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exemples guidés par compétence
CREATE TABLE IF NOT EXISTS public.skill_examples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    problem TEXT NOT NULL,
    solution TEXT NOT NULL,
    explanation TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    language TEXT NOT NULL DEFAULT 'fr',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-évaluation par compétence
CREATE TABLE IF NOT EXISTS public.skill_self_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    type TEXT CHECK (type IN ('yes_no', 'scale', 'open')) DEFAULT 'yes_no',
    language TEXT NOT NULL DEFAULT 'fr',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les nouvelles tables
CREATE INDEX IF NOT EXISTS idx_skill_content_skill ON public.skill_content(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_content_method ON public.skill_content(pedagogical_method);
CREATE INDEX IF NOT EXISTS idx_skill_content_source ON public.skill_content(source);
CREATE INDEX IF NOT EXISTS idx_skill_examples_skill ON public.skill_examples(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_examples_language ON public.skill_examples(language);
CREATE INDEX IF NOT EXISTS idx_skill_self_assessments_skill ON public.skill_self_assessments(skill_id);

-- RLS pour skill_content
ALTER TABLE public.skill_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY skill_content_read_policy ON public.skill_content
    FOR SELECT USING (true);

CREATE POLICY skill_content_insert_policy ON public.skill_content
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND (
            source = 'official' AND EXISTS (
                SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
            )
            OR source IN ('user', 'ai')
        )
    );

CREATE POLICY skill_content_update_policy ON public.skill_content
    FOR UPDATE USING (
        created_by = auth.uid() OR EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS pour skill_examples
ALTER TABLE public.skill_examples ENABLE ROW LEVEL SECURITY;

CREATE POLICY skill_examples_read_policy ON public.skill_examples
    FOR SELECT USING (true);

CREATE POLICY skill_examples_write_policy ON public.skill_examples
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.skill_content sc
            WHERE sc.skill_id = skill_examples.skill_id
            AND (sc.created_by = auth.uid() OR sc.source = 'official')
        )
    );

-- RLS pour skill_self_assessments
ALTER TABLE public.skill_self_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY skill_self_assessments_read_policy ON public.skill_self_assessments
    FOR SELECT USING (true);

CREATE POLICY skill_self_assessments_write_policy ON public.skill_self_assessments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.skill_content sc
            WHERE sc.skill_id = skill_self_assessments.skill_id
            AND (sc.created_by = auth.uid() OR sc.source = 'official')
        )
    );

-- Trigger pour updated_at sur skill_content
CREATE OR REPLACE FUNCTION update_skill_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_skill_content_updated_at
    BEFORE UPDATE ON public.skill_content
    FOR EACH ROW
    EXECUTE FUNCTION update_skill_content_updated_at();
