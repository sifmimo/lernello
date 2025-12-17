-- Système de streaks intelligents avec gel de streak
CREATE TABLE IF NOT EXISTS daily_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    streak_freeze_available BOOLEAN DEFAULT TRUE,
    streak_freeze_used_at DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id)
);

-- Table pour les XP des étudiants
CREATE TABLE IF NOT EXISTS student_xp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    total_xp INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    xp_to_next_level INTEGER DEFAULT 100,
    xp_earned_today INTEGER DEFAULT 0,
    last_xp_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id)
);

-- Table pour les décorations/accessoires débloqués
CREATE TABLE IF NOT EXISTS student_decorations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    decoration_type VARCHAR(50) NOT NULL, -- 'avatar_accessory', 'world_decoration', 'badge_frame'
    decoration_code VARCHAR(100) NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    is_equipped BOOLEAN DEFAULT FALSE,
    UNIQUE(student_id, decoration_code)
);

-- Table pour l'avatar personnalisable
CREATE TABLE IF NOT EXISTS student_avatars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    avatar_style VARCHAR(50) DEFAULT 'explorer', -- explorer, scientist, artist
    skin_color VARCHAR(20) DEFAULT 'default',
    hair_style VARCHAR(50) DEFAULT 'default',
    hair_color VARCHAR(20) DEFAULT 'brown',
    outfit VARCHAR(50) DEFAULT 'default',
    accessories JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id)
);

-- Table pour Mon Univers d'Apprentissage
CREATE TABLE IF NOT EXISTS student_worlds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    world_level INTEGER DEFAULT 1,
    unlocked_zones JSONB DEFAULT '["starter_island"]',
    placed_decorations JSONB DEFAULT '[]',
    world_theme VARCHAR(50) DEFAULT 'island',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id)
);

-- Table pour les défis famille
CREATE TABLE IF NOT EXISTS family_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    challenge_type VARCHAR(50) NOT NULL, -- 'quiz_duel', 'weekly_goal', 'explain_to_parent'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_value INTEGER DEFAULT 10,
    current_value INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active', -- active, completed, expired
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les notifications
CREATE TABLE IF NOT EXISTS student_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'streak_reminder', 'achievement', 'challenge', 'lumi_message'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    icon VARCHAR(50),
    action_url VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les rapports hebdomadaires parents
CREATE TABLE IF NOT EXISTS parent_weekly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    total_time_minutes INTEGER DEFAULT 0,
    exercises_completed INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    skills_practiced INTEGER DEFAULT 0,
    skills_mastered INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    highlights JSONB DEFAULT '[]',
    areas_to_improve JSONB DEFAULT '[]',
    suggestions JSONB DEFAULT '[]',
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, week_start)
);

-- RLS Policies
ALTER TABLE daily_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_decorations ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_weekly_reports ENABLE ROW LEVEL SECURITY;

-- Policies pour daily_streaks
CREATE POLICY "Users can view their children streaks" ON daily_streaks
    FOR SELECT USING (
        student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
    );
CREATE POLICY "Users can update their children streaks" ON daily_streaks
    FOR ALL USING (
        student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
    );

-- Policies pour student_xp
CREATE POLICY "Users can view their children xp" ON student_xp
    FOR SELECT USING (
        student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
    );
CREATE POLICY "Users can update their children xp" ON student_xp
    FOR ALL USING (
        student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
    );

-- Policies pour student_decorations
CREATE POLICY "Users can manage their children decorations" ON student_decorations
    FOR ALL USING (
        student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
    );

-- Policies pour student_avatars
CREATE POLICY "Users can manage their children avatars" ON student_avatars
    FOR ALL USING (
        student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
    );

-- Policies pour student_worlds
CREATE POLICY "Users can manage their children worlds" ON student_worlds
    FOR ALL USING (
        student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
    );

-- Policies pour family_challenges
CREATE POLICY "Users can manage their family challenges" ON family_challenges
    FOR ALL USING (parent_user_id = auth.uid());

-- Policies pour student_notifications
CREATE POLICY "Users can manage their children notifications" ON student_notifications
    FOR ALL USING (
        student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
    );

-- Policies pour parent_weekly_reports
CREATE POLICY "Users can view their weekly reports" ON parent_weekly_reports
    FOR SELECT USING (parent_user_id = auth.uid());
