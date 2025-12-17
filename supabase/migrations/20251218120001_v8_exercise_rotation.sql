-- V8 Migration: Exercise Rotation and Spaced Repetition
-- Table pour tracker l'historique des exercices par élève avec rotation garantie

CREATE TABLE IF NOT EXISTS student_exercise_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  
  -- Rotation tracking (V8: garantir que tous les exercices sont vus avant répétition)
  rotation_number INTEGER DEFAULT 1,
  seen_in_current_rotation BOOLEAN DEFAULT FALSE,
  
  -- Spaced repetition (Half-Life Regression)
  half_life_hours FLOAT DEFAULT 24,
  next_review_at TIMESTAMPTZ DEFAULT NOW(),
  strength FLOAT DEFAULT 0.5 CHECK (strength >= 0 AND strength <= 1),
  
  -- Performance tracking
  attempts_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  last_correct BOOLEAN,
  consecutive_correct INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(student_id, exercise_id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_seh_student_skill ON student_exercise_history(student_id, skill_id);
CREATE INDEX IF NOT EXISTS idx_seh_rotation ON student_exercise_history(student_id, skill_id, seen_in_current_rotation);
CREATE INDEX IF NOT EXISTS idx_seh_next_review ON student_exercise_history(student_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_seh_strength ON student_exercise_history(student_id, strength);

-- RLS
ALTER TABLE student_exercise_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY seh_student_read ON student_exercise_history 
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM student_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY seh_student_write ON student_exercise_history 
  FOR ALL USING (
    student_id IN (
      SELECT id FROM student_profiles WHERE user_id = auth.uid()
    )
  );

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_seh_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_seh_updated_at ON student_exercise_history;
CREATE TRIGGER trigger_seh_updated_at
  BEFORE UPDATE ON student_exercise_history
  FOR EACH ROW
  EXECUTE FUNCTION update_seh_updated_at();

-- Table pour tracker le dernier type d'exercice (pour interleaving)
CREATE TABLE IF NOT EXISTS student_exercise_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  last_exercise_type TEXT,
  current_rotation INTEGER DEFAULT 1,
  exercises_seen_count INTEGER DEFAULT 0,
  session_started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(student_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_ses_student_skill ON student_exercise_session(student_id, skill_id);

ALTER TABLE student_exercise_session ENABLE ROW LEVEL SECURITY;

CREATE POLICY ses_student_read ON student_exercise_session 
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM student_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY ses_student_write ON student_exercise_session 
  FOR ALL USING (
    student_id IN (
      SELECT id FROM student_profiles WHERE user_id = auth.uid()
    )
  );
