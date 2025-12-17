-- V5: Mode Hors-ligne
-- Support pour l'utilisation sans connexion

CREATE TABLE IF NOT EXISTS offline_content_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL, -- 'skill', 'exercise', 'presentation'
    content_id UUID NOT NULL,
    content_data JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    cached_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    UNIQUE(profile_id, content_type, content_id)
);

-- Sync queue pour les actions hors-ligne
CREATE TABLE IF NOT EXISTS offline_sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'exercise_attempt', 'session_complete', 'progress_update'
    action_data JSONB NOT NULL,
    created_offline_at TIMESTAMPTZ NOT NULL,
    synced_at TIMESTAMPTZ,
    sync_status TEXT DEFAULT 'pending', -- 'pending', 'synced', 'failed'
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_offline_cache_profile ON offline_content_cache(profile_id);
CREATE INDEX IF NOT EXISTS idx_offline_cache_expires ON offline_content_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_offline_sync_pending ON offline_sync_queue(profile_id, sync_status) WHERE sync_status = 'pending';
