-- V5: Mode Famille
-- Défis parent-enfant et objectifs familiaux

CREATE TABLE IF NOT EXISTS family_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    child_profile_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    challenge_type TEXT NOT NULL, -- 'quiz_duel', 'weekly_goal', 'explain_to_me'
    title TEXT NOT NULL,
    description TEXT,
    target_value INTEGER DEFAULT 10,
    current_value INTEGER DEFAULT 0,
    parent_score INTEGER DEFAULT 0,
    child_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active', -- 'active', 'completed', 'expired'
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    reward_xp INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions de défi en temps réel
CREATE TABLE IF NOT EXISTS family_challenge_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES family_challenges(id) ON DELETE CASCADE,
    session_code TEXT UNIQUE,
    status TEXT DEFAULT 'waiting', -- 'waiting', 'in_progress', 'completed'
    current_question INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 10,
    parent_answers JSONB DEFAULT '[]',
    child_answers JSONB DEFAULT '[]',
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Objectifs familiaux hebdomadaires
CREATE TABLE IF NOT EXISTS family_weekly_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    goal_type TEXT NOT NULL, -- 'stars', 'exercises', 'streak', 'skills'
    target_value INTEGER NOT NULL,
    current_value INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_user_id, week_start, goal_type)
);

-- Notifications de célébration partagée
CREATE TABLE IF NOT EXISTS family_celebrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    child_profile_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    celebration_type TEXT NOT NULL, -- 'skill_mastered', 'streak_milestone', 'badge_earned', 'challenge_won'
    title TEXT NOT NULL,
    message TEXT,
    is_read_by_parent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_family_challenges_parent ON family_challenges(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_family_challenges_child ON family_challenges(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_family_challenges_status ON family_challenges(status);
CREATE INDEX IF NOT EXISTS idx_family_celebrations_parent ON family_celebrations(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_family_celebrations_unread ON family_celebrations(parent_user_id, is_read_by_parent) WHERE NOT is_read_by_parent;
