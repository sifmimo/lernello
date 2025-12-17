-- Migration V6: Améliorations du système d'apprentissage
-- 1. Ajouter colonne ai_model_id à subjects pour persister le modèle IA choisi
-- 2. Créer les prérequis automatiques entre compétences

-- Ajouter la colonne ai_model_id à subjects
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS ai_model_id uuid REFERENCES ai_model_config(id);

-- Créer une fonction pour générer automatiquement les prérequis séquentiels
CREATE OR REPLACE FUNCTION generate_sequential_prerequisites(p_subject_id uuid)
RETURNS void AS $$
DECLARE
    prev_skill_id uuid := NULL;
    curr_skill record;
BEGIN
    -- Supprimer les prérequis existants pour cette matière
    DELETE FROM skill_prerequisites 
    WHERE skill_id IN (
        SELECT s.id FROM skills s
        JOIN domains d ON s.domain_id = d.id
        WHERE d.subject_id = p_subject_id
    );
    
    -- Parcourir les compétences dans l'ordre et créer les prérequis
    FOR curr_skill IN 
        SELECT s.id, s.sort_order, d.sort_order as domain_order
        FROM skills s
        JOIN domains d ON s.domain_id = d.id
        WHERE d.subject_id = p_subject_id
        ORDER BY d.sort_order, s.sort_order
    LOOP
        IF prev_skill_id IS NOT NULL THEN
            INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id)
            VALUES (curr_skill.id, prev_skill_id)
            ON CONFLICT DO NOTHING;
        END IF;
        prev_skill_id := curr_skill.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Créer un trigger pour générer les prérequis après publication d'une matière
CREATE OR REPLACE FUNCTION on_subject_published()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
        PERFORM generate_sequential_prerequisites(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_subject_published ON subjects;
CREATE TRIGGER trigger_subject_published
    AFTER UPDATE ON subjects
    FOR EACH ROW
    EXECUTE FUNCTION on_subject_published();

-- Générer les prérequis pour les matières déjà publiées
DO $$
DECLARE
    subj record;
BEGIN
    FOR subj IN SELECT id FROM subjects WHERE status = 'published' LOOP
        PERFORM generate_sequential_prerequisites(subj.id);
    END LOOP;
END $$;
