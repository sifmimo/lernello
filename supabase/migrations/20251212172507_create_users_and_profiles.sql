-- Migration: create_users_and_profiles
-- Version: 20251212172507

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('student', 'parent', 'teacher')) NOT NULL DEFAULT 'parent',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student profiles
CREATE TABLE public.student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    birth_year INTEGER,
    preferred_language TEXT DEFAULT 'fr',
    preferred_method TEXT DEFAULT 'adaptive',
    country_program TEXT DEFAULT 'FR',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Parent-student links
CREATE TABLE public.parent_student_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);

-- User AI settings (BYOK)
CREATE TABLE public.user_ai_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    provider TEXT CHECK (provider IN ('platform', 'openai', 'anthropic')) DEFAULT 'platform',
    preferred_model TEXT,
    api_key_encrypted TEXT,
    is_key_valid BOOLEAN DEFAULT FALSE,
    last_validated_at TIMESTAMPTZ,
    usage_this_month INTEGER DEFAULT 0,
    daily_limit INTEGER DEFAULT 100,
    monthly_limit INTEGER DEFAULT 2000,
    current_daily_usage INTEGER DEFAULT 0,
    current_monthly_usage INTEGER DEFAULT 0,
    last_reset_daily TIMESTAMPTZ DEFAULT NOW(),
    last_reset_monthly TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ai_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for student_profiles
CREATE POLICY "Users can view own student profiles" ON public.student_profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create student profiles" ON public.student_profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own student profiles" ON public.student_profiles
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own student profiles" ON public.student_profiles
    FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for parent_student_links
CREATE POLICY "Parents can view their links" ON public.parent_student_links
    FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Parents can create links" ON public.parent_student_links
    FOR INSERT WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can delete links" ON public.parent_student_links
    FOR DELETE USING (parent_id = auth.uid());

-- RLS Policies for user_ai_settings
CREATE POLICY "Users can view own AI settings" ON public.user_ai_settings
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own AI settings" ON public.user_ai_settings
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own AI settings" ON public.user_ai_settings
    FOR UPDATE USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_student_profiles_user ON public.student_profiles(user_id);
CREATE INDEX idx_parent_student_links_parent ON public.parent_student_links(parent_id);
CREATE INDEX idx_user_ai_settings_user ON public.user_ai_settings(user_id);

-- Function to auto-create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role)
    VALUES (NEW.id, NEW.email, 'parent');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
