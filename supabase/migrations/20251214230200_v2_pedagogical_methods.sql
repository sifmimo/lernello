-- =============================================
-- PHASE 3: MÉTHODES PÉDAGOGIQUES (V2)
-- Migration: pedagogical_methods, default_method sur subjects
-- =============================================

-- Table des méthodes pédagogiques
CREATE TABLE IF NOT EXISTS public.pedagogical_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name_key TEXT NOT NULL,
    description_key TEXT,
    prompt_instructions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Méthode par défaut par matière
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS default_method TEXT DEFAULT 'standard';

-- Index
CREATE INDEX IF NOT EXISTS idx_pedagogical_methods_code ON public.pedagogical_methods(code);
CREATE INDEX IF NOT EXISTS idx_pedagogical_methods_active ON public.pedagogical_methods(is_active) WHERE is_active = TRUE;

-- RLS pour pedagogical_methods (lecture publique)
ALTER TABLE public.pedagogical_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY pedagogical_methods_read_policy ON public.pedagogical_methods
    FOR SELECT USING (true);

CREATE POLICY pedagogical_methods_admin_policy ON public.pedagogical_methods
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Seed des méthodes pédagogiques
INSERT INTO public.pedagogical_methods (code, name_key, description_key, prompt_instructions, sort_order) VALUES
('standard', 'methods.standard', 'methods.standard_desc', 
 'Utilise une approche classique et structurée. Présente les concepts de manière claire et progressive. Utilise des exemples concrets et des exercices variés.', 
 1),
('montessori', 'methods.montessori', 'methods.montessori_desc', 
 'Favorise l''apprentissage par la découverte autonome et la manipulation. Propose des activités sensorielles et concrètes. Encourage l''auto-correction et l''exploration libre.', 
 2),
('singapore', 'methods.singapore', 'methods.singapore_desc', 
 'Applique la progression Concret → Imagé → Abstrait (CPA). Commence par des manipulations physiques, puis des représentations visuelles, enfin les symboles abstraits.', 
 3),
('gamified', 'methods.gamified', 'methods.gamified_desc', 
 'Intègre des éléments ludiques : défis, récompenses, narration. Utilise des scénarios engageants et des mécaniques de jeu pour motiver l''apprenant.', 
 4)
ON CONFLICT (code) DO UPDATE SET
    name_key = EXCLUDED.name_key,
    description_key = EXCLUDED.description_key,
    prompt_instructions = EXCLUDED.prompt_instructions,
    sort_order = EXCLUDED.sort_order;
