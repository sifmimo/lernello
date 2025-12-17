-- V5: API Partenaires
-- Infrastructure pour l'intégration avec des partenaires externes

CREATE TABLE IF NOT EXISTS api_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    contact_email TEXT,
    api_key TEXT UNIQUE NOT NULL,
    api_secret_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_day INTEGER DEFAULT 10000,
    allowed_endpoints TEXT[] DEFAULT '{}',
    ip_whitelist TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Logs des appels API partenaires
CREATE TABLE IF NOT EXISTS api_partner_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES api_partners(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    request_body_size INTEGER,
    response_body_size INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotas et usage des partenaires
CREATE TABLE IF NOT EXISTS api_partner_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES api_partners(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    requests_count INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    avg_response_time_ms FLOAT DEFAULT 0,
    UNIQUE(partner_id, date)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_api_partners_key ON api_partners(api_key);
CREATE INDEX IF NOT EXISTS idx_api_partner_logs_partner ON api_partner_logs(partner_id);
CREATE INDEX IF NOT EXISTS idx_api_partner_logs_created ON api_partner_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_partner_usage_date ON api_partner_usage(partner_id, date);
