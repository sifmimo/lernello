/**
 * Script de migration pour le système auto-alimenté IA
 * 
 * Pour appliquer cette migration, exécutez le SQL suivant dans le SQL Editor de Supabase:
 * https://supabase.com/dashboard/project/nhyjlrzlnmihitxlupgq/sql
 * 
 * Copiez le contenu du fichier:
 * /supabase/migrations/20251212230000_ai_content_system.sql
 */

console.log(`
=== MIGRATION MANUELLE REQUISE ===

Pour activer le système auto-alimenté complet, exécutez le SQL suivant 
dans le SQL Editor de Supabase:

1. Allez sur: https://supabase.com/dashboard/project/nhyjlrzlnmihitxlupgq/sql

2. Exécutez ce SQL pour permettre l'insertion d'exercices générés par l'IA:

-- Permettre aux utilisateurs authentifiés d'insérer des exercices
DROP POLICY IF EXISTS "Authenticated users can insert exercises" ON public.exercises;
CREATE POLICY "Authenticated users can insert exercises" ON public.exercises 
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Permettre aux utilisateurs authentifiés de mettre à jour les exercices
DROP POLICY IF EXISTS "Authenticated users can update exercises" ON public.exercises;
CREATE POLICY "Authenticated users can update exercises" ON public.exercises 
    FOR UPDATE TO authenticated
    USING (true);

-- Créer la table de notation des exercices
CREATE TABLE IF NOT EXISTS public.exercise_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
    feedback TEXT,
    rated_by TEXT CHECK (rated_by IN ('student', 'parent')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exercise_id, student_id)
);

ALTER TABLE public.exercise_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their ratings" ON public.exercise_ratings 
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

=================================
`);
