-- ==============================================================================
-- FOCUSIE PHASE 5: COMPANION PROGRESSION, COSMETICS & NOTIFICATION CENTER
-- Spec Requirements: FR-09 (Companion & Progression), FR-10 (Notifications & Controls)
-- ==============================================================================

-- 1. COMPANION PROFILES & PROGRESSION
CREATE TABLE IF NOT EXISTS public.companion_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level INT NOT NULL DEFAULT 1 CHECK (level >= 1),
  xp INT NOT NULL DEFAULT 0 CHECK (xp >= 0),
  current_stage TEXT NOT NULL DEFAULT 'sprout' CHECK (current_stage IN ('sprout', 'seedling', 'bloom', 'evergreen', 'celestial')),
  equipped_cosmetic TEXT DEFAULT 'default' CHECK (equipped_cosmetic IN ('default', 'headphones', 'quill', 'tea_cup', 'sakura_crown', 'royal_crown', 'wizard_hat')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_companion UNIQUE (user_id)
);

-- 2. UNLOCKED COSMETICS CATALOG & INVENTORY
CREATE TABLE IF NOT EXISTS public.user_cosmetics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cosmetic_id TEXT NOT NULL,
  unlocked_via TEXT NOT NULL DEFAULT 'milestone', -- 'milestone' | 'gift' | 'default'
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_cosmetic UNIQUE (user_id, cosmetic_id)
);

-- 3. IN-APP NOTIFICATIONS SYSTEM
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('gift_received', 'friend_request', 'friend_accepted', 'milestone_unlocked', 'room_invite', 'level_up')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. USER SETTINGS & PRIVACY CONTROLS (FR-10)
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sound_effects BOOLEAN NOT NULL DEFAULT true,
  activity_visibility TEXT NOT NULL DEFAULT 'friends' CHECK (activity_visibility IN ('public', 'friends', 'private')),
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start TEXT NOT NULL DEFAULT '22:00:00',
  quiet_hours_end TEXT NOT NULL DEFAULT '07:00:00',
  reduced_motion BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_settings UNIQUE (user_id)
);

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_companion_profiles_user ON public.companion_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cosmetics_user ON public.user_cosmetics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON public.user_settings(user_id);

-- 6. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.companion_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cosmetics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES

-- Companion Profiles: Users can view their own, friends can see companion state
CREATE POLICY "Users can manage own companion profile"
  ON public.companion_profiles FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Friends can view companion stage and cosmetic"
  ON public.companion_profiles FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.status = 'accepted'
        AND ((f.requester_id = auth.uid() AND f.recipient_id = companion_profiles.user_id)
         OR  (f.recipient_id = auth.uid() AND f.requester_id = companion_profiles.user_id))
    )
  );

-- User Cosmetics: Strict user ownership
CREATE POLICY "Users can manage own cosmetics"
  ON public.user_cosmetics FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Notifications: Strict private recipient ownership
CREATE POLICY "Users can read and update own notifications"
  ON public.notifications FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User Settings: Strict private ownership
CREATE POLICY "Users can manage own privacy and alert settings"
  ON public.user_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

