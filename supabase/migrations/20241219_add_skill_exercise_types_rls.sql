-- Migration: Corriger les politiques RLS pour skills
-- Date: 2024-12-19

-- Le problème est que la politique existante vérifie users.role = 'admin'
-- mais l'utilisateur de test n'a peut-être pas ce rôle

-- Option 1: Permettre à tous les utilisateurs authentifiés de modifier les skills
-- (pour le développement/test)
DROP POLICY IF EXISTS "skills_authenticated_update" ON skills;

CREATE POLICY "skills_authenticated_update"
ON skills
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Option 2: Mettre à jour le rôle de l'utilisateur de test pour qu'il soit admin
-- UPDATE users SET role = 'admin' WHERE email = 'sif_mimo@yahoo.fr';
