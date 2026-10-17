-- Phase 1: Study Day Settings & Onboarding Schema
-- File: supabase/migrations/20261016000002_phase1_study_day_settings.sql

-- 1. Create study_day_settings table
CREATE TABLE IF NOT EXISTS public.study_day_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  day_start_time TIME NOT NULL DEFAULT '06:00:00', -- e.g. 06:00 AM
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_user_study_day_settings UNIQUE (user_id)
);

-- Index for quick lookup by user
CREATE INDEX IF NOT EXISTS idx_study_day_settings_user_id ON public.study_day_settings(user_id);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.study_day_settings ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Users can view only their own study day settings (or friends if permitted)
CREATE POLICY "Users can view their own study day settings"
  ON public.study_day_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own study day settings during onboarding
CREATE POLICY "Users can insert their own study day settings"
  ON public.study_day_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own study day settings
CREATE POLICY "Users can update their own study day settings"
  ON public.study_day_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Trigger to automatically update updated_at
CREATE TRIGGER trigger_study_day_settings_updated_at
  BEFORE UPDATE ON public.study_day_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 5. Auto-provision default study day settings on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_study_day()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.study_day_settings (
    user_id,
    timezone,
    day_start_time
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'Asia/Kolkata'),
    '06:00:00'::TIME
  ) ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger firing alongside profiles creation
CREATE OR REPLACE TRIGGER on_auth_user_created_study_day
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_study_day();

