-- =============================================
-- PHASE 2: CONTENU UTILISATEUR ET PARTAGE (V2)
-- Migration: user_modules, user_skills, content_shares, content_ratings
-- =============================================

-- Ajout colonnes source sur tables existantes
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT TRUE;
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT TRUE;

-- Modules créés par les utilisateurs (dans matières officielles)
CREATE TABLE IF NOT EXISTS public.user_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    rating_average NUMERIC(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(subject_id, created_by, code)
);

-- Compétences créées par les utilisateurs
CREATE TABLE IF NOT EXISTS public.user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID,
    module_type TEXT CHECK (module_type IN ('official', 'user')) NOT NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 10) DEFAULT 1,
    is_public BOOLEAN DEFAULT FALSE,
    rating_average NUMERIC(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partage de contenu
CREATE TABLE IF NOT EXISTS public.content_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT CHECK (content_type IN ('module', 'skill', 'exercise')) NOT NULL,
    content_id UUID NOT NULL,
    shared_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    shared_with UUID REFERENCES public.users(id) ON DELETE CASCADE,
    share_level TEXT CHECK (share_level IN ('view', 'use', 'edit')) DEFAULT 'view',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(content_type, content_id, shared_by, shared_with)
);

-- Notations du contenu par la communauté
CREATE TABLE IF NOT EXISTS public.content_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT CHECK (content_type IN ('module', 'skill', 'exercise')) NOT NULL,
    content_id UUID NOT NULL,
    rated_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(content_type, content_id, rated_by)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_modules_subject ON public.user_modules(subject_id);
CREATE INDEX IF NOT EXISTS idx_user_modules_creator ON public.user_modules(created_by);
CREATE INDEX IF NOT EXISTS idx_user_modules_public ON public.user_modules(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_skills_module ON public.user_skills(module_id, module_type);
CREATE INDEX IF NOT EXISTS idx_user_skills_creator ON public.user_skills(created_by);
CREATE INDEX IF NOT EXISTS idx_user_skills_public ON public.user_skills(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_content_shares_content ON public.content_shares(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_shares_shared_with ON public.content_shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_content_ratings_content ON public.content_ratings(content_type, content_id);

-- RLS pour user_modules
ALTER TABLE public.user_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_modules_read_policy ON public.user_modules
    FOR SELECT USING (
        is_public = TRUE 
        OR created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.content_shares cs
            WHERE cs.content_type = 'module'
            AND cs.content_id = user_modules.id
            AND cs.shared_with = auth.uid()
        )
    );

CREATE POLICY user_modules_insert_policy ON public.user_modules
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY user_modules_update_policy ON public.user_modules
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY user_modules_delete_policy ON public.user_modules
    FOR DELETE USING (created_by = auth.uid());

-- RLS pour user_skills
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_skills_read_policy ON public.user_skills
    FOR SELECT USING (
        is_public = TRUE 
        OR created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.content_shares cs
            WHERE cs.content_type = 'skill'
            AND cs.content_id = user_skills.id
            AND cs.shared_with = auth.uid()
        )
    );

CREATE POLICY user_skills_insert_policy ON public.user_skills
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY user_skills_update_policy ON public.user_skills
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY user_skills_delete_policy ON public.user_skills
    FOR DELETE USING (created_by = auth.uid());

-- RLS pour content_shares
ALTER TABLE public.content_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_shares_read_policy ON public.content_shares
    FOR SELECT USING (shared_by = auth.uid() OR shared_with = auth.uid());

CREATE POLICY content_shares_insert_policy ON public.content_shares
    FOR INSERT WITH CHECK (shared_by = auth.uid());

CREATE POLICY content_shares_delete_policy ON public.content_shares
    FOR DELETE USING (shared_by = auth.uid());

-- RLS pour content_ratings
ALTER TABLE public.content_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_ratings_read_policy ON public.content_ratings
    FOR SELECT USING (true);

CREATE POLICY content_ratings_insert_policy ON public.content_ratings
    FOR INSERT WITH CHECK (rated_by = auth.uid());

CREATE POLICY content_ratings_update_policy ON public.content_ratings
    FOR UPDATE USING (rated_by = auth.uid());

CREATE POLICY content_ratings_delete_policy ON public.content_ratings
    FOR DELETE USING (rated_by = auth.uid());

-- Fonction pour mettre à jour les moyennes de notation
CREATE OR REPLACE FUNCTION update_content_rating_average()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating NUMERIC(3,2);
    count_ratings INTEGER;
BEGIN
    SELECT AVG(rating)::NUMERIC(3,2), COUNT(*)
    INTO avg_rating, count_ratings
    FROM public.content_ratings
    WHERE content_type = NEW.content_type AND content_id = NEW.content_id;
    
    IF NEW.content_type = 'module' THEN
        UPDATE public.user_modules
        SET rating_average = COALESCE(avg_rating, 0), rating_count = count_ratings
        WHERE id = NEW.content_id;
    ELSIF NEW.content_type = 'skill' THEN
        UPDATE public.user_skills
        SET rating_average = COALESCE(avg_rating, 0), rating_count = count_ratings
        WHERE id = NEW.content_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rating_average
    AFTER INSERT OR UPDATE OR DELETE ON public.content_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_content_rating_average();

-- Triggers updated_at
CREATE OR REPLACE FUNCTION update_user_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_modules_updated_at
    BEFORE UPDATE ON public.user_modules
    FOR EACH ROW
    EXECUTE FUNCTION update_user_content_updated_at();

CREATE TRIGGER trigger_user_skills_updated_at
    BEFORE UPDATE ON public.user_skills
    FOR EACH ROW
    EXECUTE FUNCTION update_user_content_updated_at();
