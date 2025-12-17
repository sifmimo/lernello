-- Migration: Ajouter colonnes dashboard
-- Version: 20251217000000

-- Ajouter les colonnes manquantes à student_skill_progress
ALTER TABLE public.student_skill_progress 
ADD COLUMN IF NOT EXISTS total_time_seconds INTEGER DEFAULT 0;

ALTER TABLE public.student_skill_progress 
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;

ALTER TABLE public.student_skill_progress 
ADD COLUMN IF NOT EXISTS skill_level INTEGER DEFAULT 1;
