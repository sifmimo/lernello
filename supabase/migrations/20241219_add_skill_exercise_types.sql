-- Migration: Ajouter la configuration des types d'exercices par compétence
-- Date: 2024-12-19

-- Ajouter une colonne pour configurer les types d'exercices autorisés par compétence
ALTER TABLE skills ADD COLUMN IF NOT EXISTS allowed_exercise_types TEXT[] DEFAULT ARRAY['qcm', 'fill_blank', 'free_input', 'drag_drop', 'match_pairs', 'sorting', 'image_qcm'];

-- Ajouter une colonne pour les types préférés (prioritaires pour la génération)
ALTER TABLE skills ADD COLUMN IF NOT EXISTS preferred_exercise_types TEXT[] DEFAULT NULL;

-- Créer un index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_skills_allowed_exercise_types ON skills USING GIN (allowed_exercise_types);

-- Commentaires
COMMENT ON COLUMN skills.allowed_exercise_types IS 'Types d''exercices autorisés pour cette compétence';
COMMENT ON COLUMN skills.preferred_exercise_types IS 'Types d''exercices préférés (prioritaires pour la génération IA)';
