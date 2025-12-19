-- Migration: Corriger les politiques RLS pour skills et skill_content
-- Date: 2024-12-19

-- Supprimer les anciennes politiques restrictives sur skills
DROP POLICY IF EXISTS "Admins can manage skills" ON skills;
DROP POLICY IF EXISTS "skills_authenticated_update" ON skills;

-- Créer une politique permissive pour skills
CREATE POLICY "skills_authenticated_all" ON skills
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Supprimer les anciennes politiques restrictives sur skill_content
DROP POLICY IF EXISTS "skill_content_insert_policy" ON skill_content;
DROP POLICY IF EXISTS "skill_content_update_policy" ON skill_content;

-- Créer des politiques permissives pour skill_content
CREATE POLICY "skill_content_insert_all" ON skill_content
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "skill_content_update_all" ON skill_content
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
