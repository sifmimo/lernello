-- V5: Notifications Parent Intelligentes
-- Alertes personnalisées et actionnables pour les parents

CREATE TABLE IF NOT EXISTS parent_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    child_profile_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL, -- 'achievement', 'streak', 'struggle', 'milestone', 'weekly_report', 'suggestion'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    action_label TEXT,
    priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high'
    is_read BOOLEAN DEFAULT FALSE,
    is_sent_push BOOLEAN DEFAULT FALSE,
    is_sent_email BOOLEAN DEFAULT FALSE,
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Préférences de notification par parent
CREATE TABLE IF NOT EXISTS parent_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    enable_push BOOLEAN DEFAULT TRUE,
    enable_email BOOLEAN DEFAULT TRUE,
    enable_in_app BOOLEAN DEFAULT TRUE,
    quiet_hours_start TIME DEFAULT '21:00',
    quiet_hours_end TIME DEFAULT '08:00',
    notify_achievements BOOLEAN DEFAULT TRUE,
    notify_streaks BOOLEAN DEFAULT TRUE,
    notify_struggles BOOLEAN DEFAULT TRUE,
    notify_milestones BOOLEAN DEFAULT TRUE,
    notify_weekly_report BOOLEAN DEFAULT TRUE,
    notify_suggestions BOOLEAN DEFAULT TRUE,
    preferred_time TEXT DEFAULT 'evening', -- 'morning', 'afternoon', 'evening'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates de notifications
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    notification_type TEXT NOT NULL,
    title_template TEXT NOT NULL,
    message_template TEXT NOT NULL,
    action_url_template TEXT,
    action_label TEXT,
    priority TEXT DEFAULT 'normal',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed des templates
INSERT INTO notification_templates (code, notification_type, title_template, message_template, action_url_template, action_label, priority) VALUES
    ('skill_mastered', 'achievement', '🎉 {{child_name}} a maîtrisé une compétence !', '{{child_name}} vient de maîtriser "{{skill_name}}". Félicitez-le !', '/parent/{{profile_id}}/progress', 'Voir les progrès', 'normal'),
    ('streak_milestone', 'streak', '🔥 Streak de {{streak_days}} jours !', '{{child_name}} a maintenu son streak pendant {{streak_days}} jours consécutifs !', '/parent/{{profile_id}}/progress', 'Voir les progrès', 'normal'),
    ('struggling_skill', 'struggle', '💡 {{child_name}} a besoin d''aide', '{{child_name}} semble avoir des difficultés avec "{{skill_name}}". Voici comment l''aider.', '/parent/{{profile_id}}/skills/{{skill_id}}', 'Voir les conseils', 'high'),
    ('weekly_report', 'weekly_report', '📊 Rapport hebdomadaire de {{child_name}}', 'Découvrez les progrès de {{child_name}} cette semaine : {{summary}}', '/parent/{{profile_id}}/reports', 'Voir le rapport', 'normal'),
    ('suggestion_5min', 'suggestion', '⏰ 5 minutes avec {{child_name}}', 'Suggestion : passez 5 minutes avec {{child_name}} sur "{{skill_name}}" pour renforcer ses acquis.', '/parent/{{profile_id}}/skills/{{skill_id}}', 'Commencer', 'low'),
    ('first_session', 'milestone', '🚀 Première session !', '{{child_name}} vient de terminer sa première session d''apprentissage !', '/parent/{{profile_id}}/progress', 'Voir les progrès', 'high'),
    ('badge_earned', 'achievement', '🏆 Nouveau badge débloqué !', '{{child_name}} a obtenu le badge "{{badge_name}}" !', '/parent/{{profile_id}}/achievements', 'Voir les badges', 'normal')
ON CONFLICT (code) DO NOTHING;

-- Index
CREATE INDEX IF NOT EXISTS idx_parent_notifications_user ON parent_notifications(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_unread ON parent_notifications(parent_user_id, is_read) WHERE NOT is_read;
CREATE INDEX IF NOT EXISTS idx_parent_notifications_scheduled ON parent_notifications(scheduled_for) WHERE scheduled_for IS NOT NULL AND sent_at IS NULL;
