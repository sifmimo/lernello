-- V5: Aventures Narratives
-- Histoires interactives où résoudre des problèmes fait avancer l'intrigue

CREATE TABLE IF NOT EXISTS adventures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    story_intro TEXT,
    theme TEXT NOT NULL, -- 'mystery', 'quest', 'exploration', 'creation'
    difficulty_level INTEGER DEFAULT 1,
    target_age_min INTEGER DEFAULT 6,
    target_age_max INTEGER DEFAULT 11,
    subject_id UUID REFERENCES subjects(id),
    total_chapters INTEGER DEFAULT 5,
    estimated_duration_minutes INTEGER DEFAULT 30,
    reward_xp INTEGER DEFAULT 100,
    reward_badge_code TEXT,
    is_seasonal BOOLEAN DEFAULT FALSE,
    season_code TEXT, -- 'halloween', 'christmas', 'summer', etc.
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chapitres d'une aventure
CREATE TABLE IF NOT EXISTS adventure_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adventure_id UUID REFERENCES adventures(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    story_text TEXT NOT NULL,
    story_image_url TEXT,
    challenge_intro TEXT,
    skills_required UUID[] DEFAULT '{}',
    exercises_count INTEGER DEFAULT 3,
    success_story TEXT, -- Texte affiché après réussite
    failure_story TEXT, -- Texte affiché après échec (avec encouragement)
    reward_xp INTEGER DEFAULT 20,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(adventure_id, chapter_number)
);

-- Progression d'un élève dans une aventure
CREATE TABLE IF NOT EXISTS adventure_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    adventure_id UUID REFERENCES adventures(id) ON DELETE CASCADE,
    current_chapter INTEGER DEFAULT 1,
    status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
    chapters_completed INTEGER DEFAULT 0,
    total_xp_earned INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_played_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, adventure_id)
);

-- Seed d'aventures initiales
INSERT INTO adventures (code, title, description, story_intro, theme, difficulty_level, total_chapters, estimated_duration_minutes, reward_xp) VALUES
    ('forest_numbers', 'La Forêt des Nombres', 'Une aventure mathématique dans une forêt enchantée', 'Lumi découvre une forêt mystérieuse où les arbres parlent en chiffres. Pour avancer, il faudra résoudre leurs énigmes...', 'exploration', 1, 5, 25, 100),
    ('treasure_fractions', 'Le Trésor des Fractions', 'Trouve le trésor caché en maîtrisant les fractions', 'Une carte au trésor a été trouvée ! Mais les indices sont écrits en fractions. Sauras-tu les déchiffrer ?', 'quest', 2, 6, 35, 150),
    ('time_machine', 'La Machine à Remonter le Temps', 'Voyage dans le temps grâce aux mathématiques', 'Le professeur Calcul a inventé une machine à voyager dans le temps, mais elle ne fonctionne qu''avec des calculs précis...', 'mystery', 3, 7, 45, 200)
ON CONFLICT (code) DO NOTHING;

-- Index
CREATE INDEX IF NOT EXISTS idx_adventures_active ON adventures(is_active);
CREATE INDEX IF NOT EXISTS idx_adventures_seasonal ON adventures(is_seasonal, season_code);
CREATE INDEX IF NOT EXISTS idx_adventure_progress_profile ON adventure_progress(profile_id);
CREATE INDEX IF NOT EXISTS idx_adventure_progress_status ON adventure_progress(status);
