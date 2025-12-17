-- V5: A/B Testing Intégré
-- Système d'expérimentation pour tester des variations

CREATE TABLE IF NOT EXISTS ab_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    hypothesis TEXT,
    status TEXT DEFAULT 'draft', -- 'draft', 'running', 'paused', 'completed', 'archived'
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    target_sample_size INTEGER DEFAULT 1000,
    current_sample_size INTEGER DEFAULT 0,
    target_audience TEXT DEFAULT 'all', -- 'all', 'new_users', 'premium', 'specific_cohort'
    primary_metric TEXT NOT NULL, -- 'retention_d7', 'conversion', 'engagement', 'completion_rate'
    secondary_metrics TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Variantes d'une expérience
CREATE TABLE IF NOT EXISTS ab_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID REFERENCES ab_experiments(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_control BOOLEAN DEFAULT FALSE,
    traffic_percentage INTEGER DEFAULT 50 CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100),
    config JSONB DEFAULT '{}', -- Configuration spécifique de la variante
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(experiment_id, code)
);

-- Attribution des utilisateurs aux variantes
CREATE TABLE IF NOT EXISTS ab_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID REFERENCES ab_experiments(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES ab_variants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(experiment_id, user_id)
);

-- Événements trackés pour les expériences
CREATE TABLE IF NOT EXISTS ab_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID REFERENCES ab_experiments(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES ab_variants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'conversion', 'engagement', 'completion', 'retention'
    event_value FLOAT DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Résultats agrégés par variante
CREATE TABLE IF NOT EXISTS ab_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID REFERENCES ab_experiments(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES ab_variants(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    sample_size INTEGER DEFAULT 0,
    metric_value FLOAT DEFAULT 0,
    confidence_interval_low FLOAT,
    confidence_interval_high FLOAT,
    statistical_significance FLOAT, -- p-value
    is_winner BOOLEAN DEFAULT FALSE,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(experiment_id, variant_id, metric_name)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_ab_experiments_status ON ab_experiments(status);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_user ON ab_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_experiment ON ab_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_events_experiment ON ab_events(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_events_created ON ab_events(created_at);
