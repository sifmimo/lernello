-- Tables pour les nouvelles fonctionnalités

-- Table pour les incidents d'abus
CREATE TABLE IF NOT EXISTS abuse_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abuse_incidents_user ON abuse_incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_abuse_incidents_created ON abuse_incidents(created_at);

-- Table pour les paramètres système
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter colonnes manquantes à user_ai_settings
ALTER TABLE user_ai_settings 
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS daily_limit INTEGER DEFAULT 50000,
ADD COLUMN IF NOT EXISTS monthly_limit INTEGER DEFAULT 500000,
ADD COLUMN IF NOT EXISTS disclaimer_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS disclaimer_accepted_at TIMESTAMPTZ;

-- Ajouter colonnes manquantes à ai_usage_logs
ALTER TABLE ai_usage_logs
ADD COLUMN IF NOT EXISTS action TEXT,
ADD COLUMN IF NOT EXISTS cost DECIMAL(10, 6) DEFAULT 0;

-- Ajouter colonnes manquantes à achievement_rules
ALTER TABLE achievement_rules
ADD COLUMN IF NOT EXISTS trigger_type TEXT DEFAULT 'skill_mastery',
ADD COLUMN IF NOT EXISTS trigger_conditions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Table pour les prérequis de compétences
CREATE TABLE IF NOT EXISTS skill_prerequisites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  prerequisite_skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(skill_id, prerequisite_skill_id)
);

CREATE INDEX IF NOT EXISTS idx_skill_prerequisites_skill ON skill_prerequisites(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_prerequisites_prereq ON skill_prerequisites(prerequisite_skill_id);

-- Table pour les traductions
CREATE TABLE IF NOT EXISTS translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('fr', 'ar', 'en')),
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(key, language)
);

CREATE INDEX IF NOT EXISTS idx_translations_key ON translations(key);
CREATE INDEX IF NOT EXISTS idx_translations_language ON translations(language);

-- Fonction pour incrémenter XP
CREATE OR REPLACE FUNCTION increment_xp(p_student_id UUID, p_xp INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE student_profiles
  SET total_xp = COALESCE(total_xp, 0) + p_xp
  WHERE id = p_student_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE abuse_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

-- Policies pour abuse_incidents (admin only)
CREATE POLICY "Admin can view abuse incidents" ON abuse_incidents
  FOR SELECT USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));

-- Policies pour system_settings (read all, write admin)
CREATE POLICY "Anyone can read system settings" ON system_settings
  FOR SELECT USING (true);

-- Policies pour skill_prerequisites (read all)
CREATE POLICY "Anyone can read skill prerequisites" ON skill_prerequisites
  FOR SELECT USING (true);

-- Policies pour translations (read all)
CREATE POLICY "Anyone can read translations" ON translations
  FOR SELECT USING (true);
