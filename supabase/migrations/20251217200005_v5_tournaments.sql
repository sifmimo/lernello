-- V5: Tournois Saisonniers
-- Événements limités dans le temps avec thème et récompenses exclusives

CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    theme TEXT NOT NULL, -- 'halloween', 'christmas', 'summer', 'back_to_school', 'easter', 'valentines'
    theme_color TEXT DEFAULT '#6366f1',
    theme_emoji TEXT DEFAULT '🏆',
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    goal_type TEXT NOT NULL, -- 'exercises', 'xp', 'skills', 'streak'
    goal_target INTEGER NOT NULL,
    reward_badge_code TEXT,
    reward_decoration_code TEXT,
    reward_xp INTEGER DEFAULT 500,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participation aux tournois
CREATE TABLE IF NOT EXISTS tournament_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    current_progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    rank INTEGER,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tournament_id, profile_id)
);

-- Classement par école (optionnel, anonymisé)
CREATE TABLE IF NOT EXISTS tournament_school_rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    school_name TEXT NOT NULL, -- Nom générique ou code
    total_participants INTEGER DEFAULT 0,
    total_progress INTEGER DEFAULT 0,
    average_progress FLOAT DEFAULT 0,
    rank INTEGER,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tournament_id, school_name)
);

-- Seed des tournois
INSERT INTO tournaments (code, name, description, theme, theme_color, theme_emoji, start_date, end_date, goal_type, goal_target, reward_xp) VALUES
    ('winter_2024', 'Le Village de Noël', 'Collecte des flocons de neige en résolvant des exercices !', 'christmas', '#dc2626', '❄️', '2024-12-01', '2024-12-25', 'exercises', 100, 500),
    ('spring_2025', 'Chasse aux Œufs', 'Trouve tous les œufs cachés dans les exercices !', 'easter', '#84cc16', '🥚', '2025-04-01', '2025-04-15', 'exercises', 50, 300),
    ('summer_2025', 'L''Été des Records', 'Bats tes propres records cet été !', 'summer', '#f59e0b', '☀️', '2025-07-01', '2025-08-31', 'xp', 1000, 750)
ON CONFLICT (code) DO NOTHING;

-- Index
CREATE INDEX IF NOT EXISTS idx_tournaments_active ON tournaments(is_active);
CREATE INDEX IF NOT EXISTS idx_tournaments_dates ON tournaments(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_profile ON tournament_participants(profile_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON tournament_participants(tournament_id);
