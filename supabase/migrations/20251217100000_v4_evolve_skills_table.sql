-- =============================================
-- V4 PHASE 1: ÉVOLUTION TABLE SKILLS
-- Ajout des champs pour la compétence universelle
-- =============================================

ALTER TABLE public.skills 
ADD COLUMN IF NOT EXISTS skill_type TEXT DEFAULT 'cognitive',
ADD COLUMN IF NOT EXISTS domain_type TEXT DEFAULT 'academic',
ADD COLUMN IF NOT EXISTS bloom_level INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS transferability TEXT DEFAULT 'specific',
ADD COLUMN IF NOT EXISTS learning_styles TEXT[] DEFAULT '{visual,auditory}',
ADD COLUMN IF NOT EXISTS age_adaptations JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.skills.skill_type IS 'Type de compétence: cognitive, procedural, metacognitive, socio_emotional, psychomotor';
COMMENT ON COLUMN public.skills.domain_type IS 'Type de domaine: academic, life_skill, creative, physical, social';
COMMENT ON COLUMN public.skills.bloom_level IS 'Niveau taxonomie Bloom: 1:Mémoriser, 2:Comprendre, 3:Appliquer, 4:Analyser, 5:Évaluer, 6:Créer';
COMMENT ON COLUMN public.skills.transferability IS 'Transférabilité: specific, transferable, universal';
COMMENT ON COLUMN public.skills.learning_styles IS 'Styles apprentissage: visual, auditory, kinesthetic, reading_writing';
COMMENT ON COLUMN public.skills.age_adaptations IS 'Adaptations par tranche âge en JSON';
COMMENT ON COLUMN public.skills.tags IS 'Tags libres pour recherche et recommandation';

CREATE INDEX IF NOT EXISTS idx_skills_skill_type ON public.skills(skill_type);
CREATE INDEX IF NOT EXISTS idx_skills_bloom_level ON public.skills(bloom_level);
CREATE INDEX IF NOT EXISTS idx_skills_tags ON public.skills USING GIN(tags);
