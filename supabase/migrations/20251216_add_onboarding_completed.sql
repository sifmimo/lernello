-- Add onboarding_completed column to student_profiles
ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Set existing profiles as having completed onboarding (to avoid forcing existing users through it)
UPDATE student_profiles SET onboarding_completed = TRUE WHERE onboarding_completed IS NULL;
