-- =============================================
-- PHASE 5: ADMIN, PROGRAMMES PAYS ET TRADUCTIONS (V2)
-- Migration: country_programs, ai_model_config, content_translations
-- Colonnes manquantes sur subjects, domains, skills
-- =============================================

-- Table des programmes par pays
CREATE TABLE IF NOT EXISTS public.country_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT UNIQUE NOT NULL,
    country_name TEXT NOT NULL,
    country_flag TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuration des modèles IA pour l'admin
CREATE TABLE IF NOT EXISTS public.ai_model_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'platform')),
    model_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    max_tokens INTEGER DEFAULT 4000,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Traductions de contenu générées
CREATE TABLE IF NOT EXISTS public.content_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL,
    language TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(key, language)
);

-- Colonnes manquantes sur subjects
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS description_key TEXT;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS country_program_id UUID REFERENCES public.country_programs(id) ON DELETE SET NULL;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT TRUE;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('draft', 'published')) DEFAULT 'published';
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'fr';
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS method_code TEXT DEFAULT 'standard';
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Colonnes manquantes sur domains
ALTER TABLE public.domains ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('draft', 'published')) DEFAULT 'published';
ALTER TABLE public.domains ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Colonnes manquantes sur skills
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('draft', 'published')) DEFAULT 'published';
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Index
CREATE INDEX IF NOT EXISTS idx_country_programs_code ON public.country_programs(country_code);
CREATE INDEX IF NOT EXISTS idx_ai_model_config_provider ON public.ai_model_config(provider);
CREATE INDEX IF NOT EXISTS idx_content_translations_key ON public.content_translations(key);
CREATE INDEX IF NOT EXISTS idx_content_translations_language ON public.content_translations(language);
CREATE INDEX IF NOT EXISTS idx_subjects_status ON public.subjects(status);
CREATE INDEX IF NOT EXISTS idx_subjects_country ON public.subjects(country_program_id);

-- RLS pour country_programs
ALTER TABLE public.country_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY country_programs_read_policy ON public.country_programs
    FOR SELECT USING (true);

CREATE POLICY country_programs_admin_policy ON public.country_programs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS pour ai_model_config
ALTER TABLE public.ai_model_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_model_config_read_policy ON public.ai_model_config
    FOR SELECT USING (true);

CREATE POLICY ai_model_config_admin_policy ON public.ai_model_config
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS pour content_translations
ALTER TABLE public.content_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_translations_read_policy ON public.content_translations
    FOR SELECT USING (true);

CREATE POLICY content_translations_admin_policy ON public.content_translations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Policies admin pour subjects, domains, skills
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'subjects_admin_write_policy' AND tablename = 'subjects') THEN
        CREATE POLICY subjects_admin_write_policy ON public.subjects
            FOR ALL USING (
                EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
            );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'domains_admin_write_policy' AND tablename = 'domains') THEN
        CREATE POLICY domains_admin_write_policy ON public.domains
            FOR ALL USING (
                EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
            );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'skills_admin_write_policy' AND tablename = 'skills') THEN
        CREATE POLICY skills_admin_write_policy ON public.skills
            FOR ALL USING (
                EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
            );
    END IF;
END
$$;

-- Seed des modèles IA par défaut
INSERT INTO public.ai_model_config (provider, model_name, display_name, is_default, is_active) VALUES
('openai', 'gpt-4o', 'GPT-4o', TRUE, TRUE),
('openai', 'gpt-4o-mini', 'GPT-4o Mini', FALSE, TRUE),
('openai', 'gpt-4-turbo', 'GPT-4 Turbo', FALSE, TRUE),
('anthropic', 'claude-3-5-sonnet-20241022', 'Claude 3.5 Sonnet', FALSE, TRUE),
('anthropic', 'claude-3-haiku-20240307', 'Claude 3 Haiku', FALSE, TRUE)
ON CONFLICT DO NOTHING;

-- Triggers updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_country_programs_updated_at') THEN
        CREATE TRIGGER trigger_country_programs_updated_at
            BEFORE UPDATE ON public.country_programs
            FOR EACH ROW
            EXECUTE FUNCTION update_timestamp();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_content_translations_updated_at') THEN
        CREATE TRIGGER trigger_content_translations_updated_at
            BEFORE UPDATE ON public.content_translations
            FOR EACH ROW
            EXECUTE FUNCTION update_timestamp();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_subjects_updated_at') THEN
        CREATE TRIGGER trigger_subjects_updated_at
            BEFORE UPDATE ON public.subjects
            FOR EACH ROW
            EXECUTE FUNCTION update_timestamp();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_domains_updated_at') THEN
        CREATE TRIGGER trigger_domains_updated_at
            BEFORE UPDATE ON public.domains
            FOR EACH ROW
            EXECUTE FUNCTION update_timestamp();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_skills_updated_at') THEN
        CREATE TRIGGER trigger_skills_updated_at
            BEFORE UPDATE ON public.skills
            FOR EACH ROW
            EXECUTE FUNCTION update_timestamp();
    END IF;
END
$$;
