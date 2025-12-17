-- =============================================
-- V4 PHASE 2: TABLE PRESENTATION_ANALYTICS
-- Tracking des présentations
-- =============================================

CREATE TABLE IF NOT EXISTS public.presentation_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID REFERENCES public.skill_presentations(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    time_spent_seconds INTEGER DEFAULT 0,
    blocks_viewed INTEGER DEFAULT 0,
    total_blocks INTEGER DEFAULT 0,
    interactions_count INTEGER DEFAULT 0,
    pre_assessment_score FLOAT,
    post_assessment_score FLOAT,
    retention_score_7d FLOAT,
    student_rating INTEGER CHECK (student_rating BETWEEN 1 AND 5),
    student_feedback TEXT,
    device_type TEXT,
    session_context JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presentation_analytics_presentation ON public.presentation_analytics(presentation_id);
CREATE INDEX IF NOT EXISTS idx_presentation_analytics_student ON public.presentation_analytics(student_id);
CREATE INDEX IF NOT EXISTS idx_presentation_analytics_started ON public.presentation_analytics(started_at);

ALTER TABLE public.presentation_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS presentation_analytics_own_policy ON public.presentation_analytics FOR ALL USING (
    student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
