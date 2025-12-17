-- V5: Classes Virtuelles Légères
-- Apprentissage entre amis avec équipes et objectifs de groupe

CREATE TABLE IF NOT EXISTS virtual_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- Code d'invitation (6 caractères)
    name TEXT NOT NULL,
    description TEXT,
    creator_profile_id UUID REFERENCES student_profiles(id) ON DELETE SET NULL,
    max_members INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    weekly_goal_type TEXT DEFAULT 'skills', -- 'skills', 'exercises', 'xp'
    weekly_goal_target INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Membres d'une classe virtuelle
CREATE TABLE IF NOT EXISTS virtual_class_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES virtual_classes(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member', -- 'creator', 'member'
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    weekly_contribution INTEGER DEFAULT 0,
    total_contribution INTEGER DEFAULT 0,
    UNIQUE(class_id, profile_id)
);

-- Objectifs de groupe hebdomadaires
CREATE TABLE IF NOT EXISTS virtual_class_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES virtual_classes(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    goal_type TEXT NOT NULL,
    target_value INTEGER NOT NULL,
    current_value INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(class_id, week_start)
);

-- Messages prédéfinis entre membres (pas de chat libre pour sécurité enfants)
CREATE TABLE IF NOT EXISTS virtual_class_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES virtual_classes(id) ON DELETE CASCADE,
    sender_profile_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    message_type TEXT NOT NULL, -- 'encouragement', 'hint_request', 'celebration', 'greeting'
    message_code TEXT NOT NULL, -- Code du message prédéfini
    recipient_profile_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages prédéfinis disponibles
CREATE TABLE IF NOT EXISTS predefined_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    message_type TEXT NOT NULL,
    text_fr TEXT NOT NULL,
    text_en TEXT,
    text_ar TEXT,
    emoji TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed des messages prédéfinis
INSERT INTO predefined_messages (code, message_type, text_fr, text_en, emoji) VALUES
    ('encourage_1', 'encouragement', 'Tu peux le faire !', 'You can do it!', '💪'),
    ('encourage_2', 'encouragement', 'Continue comme ça !', 'Keep it up!', '🌟'),
    ('encourage_3', 'encouragement', 'Tu es sur la bonne voie !', 'You''re on the right track!', '🎯'),
    ('celebrate_1', 'celebration', 'Bravo pour ta réussite !', 'Congrats on your success!', '🎉'),
    ('celebrate_2', 'celebration', 'Incroyable !', 'Amazing!', '🏆'),
    ('celebrate_3', 'celebration', 'Tu as assuré !', 'You nailed it!', '⭐'),
    ('greeting_1', 'greeting', 'Salut !', 'Hi!', '👋'),
    ('greeting_2', 'greeting', 'Bonne journée !', 'Have a great day!', '☀️'),
    ('hint_1', 'hint_request', 'Tu as un conseil ?', 'Any tips?', '🤔'),
    ('hint_2', 'hint_request', 'Comment tu as fait ?', 'How did you do it?', '💡')
ON CONFLICT (code) DO NOTHING;

-- Index
CREATE INDEX IF NOT EXISTS idx_virtual_classes_code ON virtual_classes(code);
CREATE INDEX IF NOT EXISTS idx_virtual_class_members_profile ON virtual_class_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_virtual_class_messages_recipient ON virtual_class_messages(recipient_profile_id, is_read);
