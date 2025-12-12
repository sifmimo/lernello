-- Migration: create_subjects_and_skills
-- Version: 20251212172528

-- Subjects (Mathématiques, etc.)
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name_key TEXT NOT NULL,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Domains (Nombres, Calcul, Géométrie, etc.)
CREATE TABLE public.domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name_key TEXT NOT NULL,
    description_key TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(subject_id, code)
);

-- Skills (Compétences atomiques)
CREATE TABLE public.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID REFERENCES public.domains(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name_key TEXT NOT NULL,
    description_key TEXT,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 10) DEFAULT 1,
    prerequisites UUID[] DEFAULT '{}',
    estimated_duration_minutes INTEGER DEFAULT 15,
    country_programs TEXT[] DEFAULT '{FR}',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(domain_id, code)
);

-- Exercises
CREATE TABLE public.exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('qcm', 'fill_blank', 'drag_drop', 'free_input', 'interactive')) NOT NULL,
    difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5) DEFAULT 3,
    content JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_ai_generated BOOLEAN DEFAULT FALSE,
    is_validated BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercise translations
CREATE TABLE public.exercise_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
    language TEXT NOT NULL,
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exercise_id, language)
);

-- Indexes
CREATE INDEX idx_domains_subject ON public.domains(subject_id);
CREATE INDEX idx_skills_domain ON public.skills(domain_id);
CREATE INDEX idx_exercises_skill ON public.exercises(skill_id);
CREATE INDEX idx_exercises_content ON public.exercises USING GIN(content);
CREATE INDEX idx_exercise_translations_exercise ON public.exercise_translations(exercise_id);

-- Enable RLS (public read for content)
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_translations ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Anyone can view subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Anyone can view domains" ON public.domains FOR SELECT USING (true);
CREATE POLICY "Anyone can view skills" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Anyone can view exercises" ON public.exercises FOR SELECT USING (true);
CREATE POLICY "Anyone can view translations" ON public.exercise_translations FOR SELECT USING (true);
