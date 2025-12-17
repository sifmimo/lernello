-- =============================================
-- V4 PHASE 3: TABLE EXERCISE_TEMPLATES
-- Templates d'exercices universels
-- =============================================

CREATE TABLE IF NOT EXISTS public.exercise_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    exercise_type TEXT NOT NULL,
    bloom_level INTEGER CHECK (bloom_level BETWEEN 1 AND 6) DEFAULT 3,
    modality TEXT NOT NULL DEFAULT 'textual',
    compatible_subjects TEXT[] DEFAULT '{}',
    compatible_skill_types TEXT[] DEFAULT '{}',
    content_schema JSONB NOT NULL DEFAULT '{}',
    renderer_component TEXT NOT NULL,
    evaluation_type TEXT NOT NULL DEFAULT 'auto',
    evaluation_config JSONB DEFAULT '{}',
    supports_hints BOOLEAN DEFAULT TRUE,
    supports_partial_credit BOOLEAN DEFAULT FALSE,
    estimated_time_seconds INTEGER DEFAULT 60,
    icon TEXT,
    color TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercise_templates_code ON public.exercise_templates(code);
CREATE INDEX IF NOT EXISTS idx_exercise_templates_type ON public.exercise_templates(exercise_type);
CREATE INDEX IF NOT EXISTS idx_exercise_templates_bloom ON public.exercise_templates(bloom_level);
CREATE INDEX IF NOT EXISTS idx_exercise_templates_subjects ON public.exercise_templates USING GIN(compatible_subjects);

ALTER TABLE public.exercise_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS exercise_templates_read_policy ON public.exercise_templates FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS exercise_templates_admin_policy ON public.exercise_templates FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
