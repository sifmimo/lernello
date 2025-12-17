-- V5: Feature Flags System
-- Permet d'activer/désactiver des fonctionnalités sans déploiement

CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT FALSE,
    rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    target_audience TEXT DEFAULT 'all', -- 'all', 'staff', 'beta', 'premium'
    conditions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_feature_flags_code ON feature_flags(code);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(is_enabled);

-- Feature flags initiaux
INSERT INTO feature_flags (code, name, description, is_enabled, rollout_percentage, target_audience) VALUES
    ('micro_sessions', 'Micro-sessions 3 minutes', 'Sessions ultra-courtes de 3 minutes', true, 100, 'all'),
    ('offline_mode', 'Mode hors-ligne', 'Permet l''utilisation sans connexion', false, 0, 'beta'),
    ('voice_mode', 'Mode vocal complet', 'Interface vocale pour les non-lecteurs', false, 10, 'beta'),
    ('family_mode', 'Mode Famille', 'Défis parent-enfant', false, 50, 'all'),
    ('learning_world', 'Mon Univers', 'Monde virtuel de progression', false, 20, 'beta'),
    ('adventures', 'Aventures narratives', 'Histoires interactives d''apprentissage', false, 0, 'beta'),
    ('virtual_classes', 'Classes virtuelles', 'Apprentissage entre amis', false, 0, 'beta'),
    ('tournaments', 'Tournois saisonniers', 'Événements compétitifs', false, 0, 'beta'),
    ('emotion_detection', 'Détection émotionnelle', 'Adaptation selon l''état émotionnel', false, 0, 'staff'),
    ('ab_testing', 'A/B Testing', 'Tests de variations', true, 100, 'staff'),
    ('parent_notifications', 'Notifications parent', 'Alertes intelligentes aux parents', true, 100, 'all'),
    ('accessibility', 'Accessibilité WCAG', 'Mode accessibilité avancé', true, 100, 'all')
ON CONFLICT (code) DO NOTHING;

-- Table pour tracker les utilisateurs dans les feature flags
CREATE TABLE IF NOT EXISTS feature_flag_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_flag_id UUID REFERENCES feature_flags(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(feature_flag_id, user_id)
);
