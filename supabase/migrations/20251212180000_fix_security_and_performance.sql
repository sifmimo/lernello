-- Migration: fix_security_and_performance_issues
-- Version: 20251212180000
-- Fixes: function_search_path_mutable, RLS performance, missing indexes

-- Fix function search_path mutable
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, email, role)
    VALUES (NEW.id, NEW.email, 'parent');
    RETURN NEW;
END;
$$;

-- Add missing indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_exercise ON public.exercise_attempts(exercise_id);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_student ON public.parent_notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_student ON public.parent_student_links(student_id);
CREATE INDEX IF NOT EXISTS idx_student_achievements_rule ON public.student_achievements(rule_id);
CREATE INDEX IF NOT EXISTS idx_student_milestone_progress_milestone ON public.student_milestone_progress(milestone_id);

-- Fix RLS policies to use (select auth.uid()) for better performance
-- Drop and recreate policies for users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (id = (select auth.uid()));

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (id = (select auth.uid()));

-- Fix student_profiles policies
DROP POLICY IF EXISTS "Users can view own student profiles" ON public.student_profiles;
DROP POLICY IF EXISTS "Users can create student profiles" ON public.student_profiles;
DROP POLICY IF EXISTS "Users can update own student profiles" ON public.student_profiles;
DROP POLICY IF EXISTS "Users can delete own student profiles" ON public.student_profiles;

CREATE POLICY "Users can view own student profiles" ON public.student_profiles
    FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create student profiles" ON public.student_profiles
    FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own student profiles" ON public.student_profiles
    FOR UPDATE USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own student profiles" ON public.student_profiles
    FOR DELETE USING (user_id = (select auth.uid()));

-- Fix parent_student_links policies
DROP POLICY IF EXISTS "Parents can view their links" ON public.parent_student_links;
DROP POLICY IF EXISTS "Parents can create links" ON public.parent_student_links;
DROP POLICY IF EXISTS "Parents can delete links" ON public.parent_student_links;

CREATE POLICY "Parents can view their links" ON public.parent_student_links
    FOR SELECT USING (parent_id = (select auth.uid()));

CREATE POLICY "Parents can create links" ON public.parent_student_links
    FOR INSERT WITH CHECK (parent_id = (select auth.uid()));

CREATE POLICY "Parents can delete links" ON public.parent_student_links
    FOR DELETE USING (parent_id = (select auth.uid()));

-- Fix user_ai_settings policies
DROP POLICY IF EXISTS "Users can view own AI settings" ON public.user_ai_settings;
DROP POLICY IF EXISTS "Users can create own AI settings" ON public.user_ai_settings;
DROP POLICY IF EXISTS "Users can update own AI settings" ON public.user_ai_settings;

CREATE POLICY "Users can view own AI settings" ON public.user_ai_settings
    FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own AI settings" ON public.user_ai_settings
    FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own AI settings" ON public.user_ai_settings
    FOR UPDATE USING (user_id = (select auth.uid()));

-- Fix parent_notifications policies
DROP POLICY IF EXISTS "Parents can view own notifications" ON public.parent_notifications;
DROP POLICY IF EXISTS "Parents can update own notifications" ON public.parent_notifications;

CREATE POLICY "Parents can view own notifications" ON public.parent_notifications
    FOR SELECT USING (parent_id = (select auth.uid()));

CREATE POLICY "Parents can update own notifications" ON public.parent_notifications
    FOR UPDATE USING (parent_id = (select auth.uid()));

-- Fix student_skill_progress - consolidate into single policy
DROP POLICY IF EXISTS "Students can update own progress" ON public.student_skill_progress;
DROP POLICY IF EXISTS "Students can view own progress" ON public.student_skill_progress;

CREATE POLICY "Students can manage own progress" ON public.student_skill_progress
    FOR ALL USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = (select auth.uid())));

-- Fix exercise_attempts policies
DROP POLICY IF EXISTS "Students can view own attempts" ON public.exercise_attempts;
DROP POLICY IF EXISTS "Students can create attempts" ON public.exercise_attempts;

CREATE POLICY "Students can view own attempts" ON public.exercise_attempts
    FOR SELECT USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = (select auth.uid())));

CREATE POLICY "Students can create attempts" ON public.exercise_attempts
    FOR INSERT WITH CHECK (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = (select auth.uid())));

-- Fix learning_sessions policies
DROP POLICY IF EXISTS "Students can view own sessions" ON public.learning_sessions;

CREATE POLICY "Students can manage own sessions" ON public.learning_sessions
    FOR ALL USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = (select auth.uid())));

-- Fix student_achievements policies
DROP POLICY IF EXISTS "Students can view own achievements" ON public.student_achievements;

CREATE POLICY "Students can view own achievements" ON public.student_achievements
    FOR SELECT USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = (select auth.uid())));

-- Fix student_milestone_progress policies
DROP POLICY IF EXISTS "Students can view own milestone progress" ON public.student_milestone_progress;

CREATE POLICY "Students can manage own milestone progress" ON public.student_milestone_progress
    FOR ALL USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = (select auth.uid())));
