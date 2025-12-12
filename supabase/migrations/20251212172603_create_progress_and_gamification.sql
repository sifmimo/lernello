-- Migration: create_progress_and_gamification
-- Version: 20251212172603

-- Student skill progress
CREATE TABLE public.student_skill_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
    mastery_level NUMERIC(3,2) CHECK (mastery_level BETWEEN 0 AND 1) DEFAULT 0,
    attempts_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    mastered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, skill_id)
);

-- Exercise attempts
CREATE TABLE public.exercise_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
    is_correct BOOLEAN NOT NULL,
    answer JSONB,
    time_spent_seconds INTEGER,
    hints_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning sessions
CREATE TABLE public.learning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    exercises_completed INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    skills_practiced UUID[] DEFAULT '{}'
);

-- Achievement rules (versioned)
CREATE TABLE public.achievement_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    name_key TEXT NOT NULL,
    description_key TEXT,
    icon TEXT,
    category TEXT CHECK (category IN ('skill', 'streak', 'milestone', 'special')) NOT NULL,
    target_audience TEXT CHECK (target_audience IN ('student', 'parent', 'both')) DEFAULT 'student',
    trigger_conditions JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(code, version)
);

-- Student achievements
CREATE TABLE public.student_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES public.achievement_rules(id) ON DELETE CASCADE,
    rule_version INTEGER NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    context JSONB DEFAULT '{}',
    is_seen_by_student BOOLEAN DEFAULT FALSE,
    is_seen_by_parent BOOLEAN DEFAULT FALSE,
    UNIQUE(student_id, rule_id, rule_version)
);

-- Learning milestones
CREATE TABLE public.learning_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name_key TEXT NOT NULL,
    description_key TEXT,
    milestone_type TEXT CHECK (milestone_type IN ('domain_complete', 'level_up', 'skill_chain', 'time_goal')) NOT NULL,
    criteria JSONB NOT NULL,
    reward_type TEXT CHECK (reward_type IN ('badge', 'unlock', 'celebration')) DEFAULT 'celebration',
    reward_data JSONB DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student milestone progress
CREATE TABLE public.student_milestone_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES public.learning_milestones(id) ON DELETE CASCADE,
    progress_percent NUMERIC(5,2) CHECK (progress_percent BETWEEN 0 AND 100) DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, milestone_id)
);

-- Parent notifications
CREATE TABLE public.parent_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    notification_type TEXT CHECK (notification_type IN (
        'milestone_reached', 
        'struggle_detected', 
        'streak_broken', 
        'weekly_summary',
        'skill_mastered',
        'recommendation'
    )) NOT NULL,
    title_key TEXT NOT NULL,
    body_key TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_student_progress_student ON public.student_skill_progress(student_id);
CREATE INDEX idx_student_progress_skill ON public.student_skill_progress(skill_id);
CREATE INDEX idx_exercise_attempts_student ON public.exercise_attempts(student_id);
CREATE INDEX idx_exercise_attempts_created ON public.exercise_attempts(created_at DESC);
CREATE INDEX idx_learning_sessions_student ON public.learning_sessions(student_id);
CREATE INDEX idx_student_achievements_student ON public.student_achievements(student_id);
CREATE INDEX idx_parent_notifications_parent ON public.parent_notifications(parent_id);
CREATE INDEX idx_parent_notifications_unread ON public.parent_notifications(parent_id, is_read) WHERE is_read = FALSE;

-- Enable RLS
ALTER TABLE public.student_skill_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_milestone_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Students can view own progress" ON public.student_skill_progress
    FOR SELECT USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Students can update own progress" ON public.student_skill_progress
    FOR ALL USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Students can view own attempts" ON public.exercise_attempts
    FOR SELECT USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Students can create attempts" ON public.exercise_attempts
    FOR INSERT WITH CHECK (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Students can view own sessions" ON public.learning_sessions
    FOR ALL USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view achievement rules" ON public.achievement_rules
    FOR SELECT USING (true);

CREATE POLICY "Students can view own achievements" ON public.student_achievements
    FOR SELECT USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view milestones" ON public.learning_milestones
    FOR SELECT USING (true);

CREATE POLICY "Students can view own milestone progress" ON public.student_milestone_progress
    FOR ALL USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Parents can view own notifications" ON public.parent_notifications
    FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Parents can update own notifications" ON public.parent_notifications
    FOR UPDATE USING (parent_id = auth.uid());
