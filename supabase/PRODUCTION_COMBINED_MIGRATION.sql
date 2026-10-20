-- ==============================================================================
-- FOCUSIE PRODUCTION DATABASE CONSOLIDATED MIGRATIONS
-- Phases 1 through 5 Complete Schema, Security Constraints, Indexes & RLS Matrix
-- ==============================================================================

-- >>> START: supabase/migrations\20261013000001_phase0_profiles.sql <<<
-- Phase 0: Profiles and Baseline Row Level Security (RLS)
-- File: supabase/migrations/20261013000001_phase0_profiles.sql

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT username_length_check CHECK (char_length(username) >= 3 AND char_length(username) <= 24),
  CONSTRAINT username_format_check CHECK (username ~ '^[a-z0-9_]+$')
);

-- Index for username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Allow authenticated users to view profiles (for friend search, leaderboard, rooms)
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to update only their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 5. Automatic Profile Provisioning on User Sign-Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  desired_username TEXT;
  final_username TEXT;
BEGIN
  desired_username := LOWER(COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || SUBSTRING(NEW.id::text, 1, 8)));
  -- Sanitize username: replace invalid characters with underscores
  desired_username := REGEXP_REPLACE(desired_username, '[^a-z0-9_]', '_', 'g');
  
  -- Ensure minimum 3 characters
  IF char_length(desired_username) < 3 THEN
    desired_username := 'user_' || SUBSTRING(NEW.id::text, 1, 8);
  END IF;

  final_username := desired_username;

  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    final_username := SUBSTRING(desired_username, 1, 18) || '_' || FLOOR(RANDOM() * 9000 + 1000)::text;
  END LOOP;

  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    avatar_url,
    timezone
  ) VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'display_name', final_username),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'Asia/Kolkata')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger firing on auth.users creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- >>> END: supabase/migrations\20261013000001_phase0_profiles.sql <<<

-- >>> START: supabase/migrations\20261016000002_phase1_study_day_settings.sql <<<
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


-- >>> END: supabase/migrations\20261016000002_phase1_study_day_settings.sql <<<

-- >>> START: supabase/migrations\20261017000003_phase2_sessions_and_friendships.sql <<<
-- Phase 2: Live Study Timer & Friend Presence Schema
-- File: supabase/migrations/20261017000003_phase2_sessions_and_friendships.sql

-- ============================================================================
-- 1. STUDY SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'paused', 'completed')),
  mode TEXT NOT NULL DEFAULT 'pomodoro' CHECK (mode IN ('pomodoro', 'stopwatch')),
  target_minutes INT NOT NULL DEFAULT 25 CHECK (target_minutes > 0 AND target_minutes <= 720),
  subject_tag TEXT NOT NULL DEFAULT 'General Study',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paused_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  accumulated_seconds INT NOT NULL DEFAULT 0 CHECK (accumulated_seconds >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crucial Concurrency Constraint: At most ONE active or paused session per user!
-- This guarantees that concurrent clicks or multi-tab opens cannot create overlapping sessions.
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_session_per_user
  ON public.study_sessions(user_id)
  WHERE state IN ('active', 'paused');

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_state ON public.study_sessions(state);
CREATE INDEX IF NOT EXISTS idx_study_sessions_started_at ON public.study_sessions(started_at);

-- Trigger to maintain updated_at
CREATE TRIGGER trigger_study_sessions_updated_at
  BEFORE UPDATE ON public.study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 2. STUDY SESSION SEGMENTS TABLE (Authoritative Timestamps for Anti-Cheat)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.study_session_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.study_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INT NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_segments_session_id ON public.study_session_segments(session_id);
CREATE INDEX IF NOT EXISTS idx_session_segments_user_id ON public.study_session_segments(user_id);

-- ============================================================================
-- 3. FRIENDSHIPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Cannot send friend request to yourself
  CONSTRAINT check_different_friends CHECK (requester_id <> recipient_id)
);

-- Prevent duplicate friend requests between the same pair of users in either direction
CREATE UNIQUE INDEX IF NOT EXISTS unique_friendship_pair
  ON public.friendships (
    LEAST(requester_id, recipient_id),
    GREATEST(requester_id, recipient_id)
  );

CREATE INDEX IF NOT EXISTS idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_recipient ON public.friendships(recipient_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- Trigger to maintain updated_at for friendships
CREATE TRIGGER trigger_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- A. study_sessions RLS
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- Owner has full control over their study sessions
CREATE POLICY "Users can manage their own study sessions"
  ON public.study_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Friends can view active study sessions (for real-time presence feed)
CREATE POLICY "Friends can view active study sessions"
  ON public.study_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.status = 'accepted'
        AND (
          (f.requester_id = auth.uid() AND f.recipient_id = study_sessions.user_id)
          OR
          (f.recipient_id = auth.uid() AND f.requester_id = study_sessions.user_id)
        )
    )
  );

-- B. study_session_segments RLS
ALTER TABLE public.study_session_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own session segments"
  ON public.study_session_segments
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- C. friendships RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Users can view friendships where they are either the requester or recipient
CREATE POLICY "Users can view their own friendships"
  ON public.friendships
  FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Users can create friend requests
CREATE POLICY "Users can create friend requests"
  ON public.friendships
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

-- Both parties can update friendship status (e.g. accept or block)
CREATE POLICY "Users can update their own friendships"
  ON public.friendships
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Users can remove/delete friendships
CREATE POLICY "Users can delete their own friendships"
  ON public.friendships
  FOR DELETE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- ============================================================================
-- 5. ENABLE SUPABASE REALTIME REPLICATION
-- ============================================================================
-- Allows friends to subscribe to active session changes and friendship updates via WebSockets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'study_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.study_sessions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'friendships'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
  END IF;
END $$;


-- >>> END: supabase/migrations\20261017000003_phase2_sessions_and_friendships.sql <<<

-- >>> START: supabase/migrations\20261020000004_phase3_leaderboards_and_day_settings.sql <<<
-- Phase 3: Personal Study Days & Fair Leaderboards Migration
-- File: supabase/migrations/20261020000004_phase3_leaderboards_and_day_settings.sql

-- ============================================================================
-- 1. ROW LEVEL SECURITY UPDATES FOR FRIENDS' STUDY DATA ACCESS
-- ============================================================================

-- A. Allow accepted friends to view study session segments for leaderboard aggregations
CREATE POLICY "Friends can view session segments for leaderboards"
  ON public.study_session_segments
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.status = 'accepted'
        AND (
          (f.requester_id = auth.uid() AND f.recipient_id = study_session_segments.user_id)
          OR
          (f.recipient_id = auth.uid() AND f.requester_id = study_session_segments.user_id)
        )
    )
  );

-- B. Allow accepted friends to view study day settings (timezone and day_start_time)
CREATE POLICY "Friends can view study day settings for personal day windows"
  ON public.study_day_settings
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.status = 'accepted'
        AND (
          (f.requester_id = auth.uid() AND f.recipient_id = study_day_settings.user_id)
          OR
          (f.recipient_id = auth.uid() AND f.requester_id = study_day_settings.user_id)
        )
    )
  );

-- ============================================================================
-- 2. PERFORMANCE INDEXES FOR WINDOWED AGGREGATION QUERIES
-- ============================================================================

-- Fast lookup of segments overlapping study day windows by user and time
CREATE INDEX IF NOT EXISTS idx_session_segments_user_started 
  ON public.study_session_segments(user_id, started_at);

CREATE INDEX IF NOT EXISTS idx_session_segments_ended_at 
  ON public.study_session_segments(ended_at);


-- >>> END: supabase/migrations\20261020000004_phase3_leaderboards_and_day_settings.sql <<<

-- >>> START: supabase/migrations\20261020000005_phase4_wallets_gifts_and_rooms.sql <<<
-- Phase 4: Virtual Coins, Auditable Wallet, Cozy Gift Catalog & Private Study Rooms
-- File: supabase/migrations/20261020000005_phase4_wallets_gifts_and_rooms.sql

-- ============================================================================
-- 1. USER WALLETS & AUDITABLE TRANSACTION LEDGER (FR-07)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 50 CHECK (balance >= 0), -- 50 welcome coins!
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_user_wallet UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON public.user_wallets(user_id);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INT NOT NULL, -- Positive for credit, negative for debit
  type TEXT NOT NULL CHECK (type IN ('earned_focus', 'gift_sent', 'gift_received', 'bonus', 'welcome')),
  reference_id TEXT, -- e.g. session_id or gift_transfer_id
  idempotency_key TEXT UNIQUE, -- Strict protection against duplicate requests
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON public.wallet_transactions(type);

-- ============================================================================
-- 2. GIFT CATALOG & GIFT TRANSFERS (FR-07)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gift_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT NOT NULL,
  coin_price INT NOT NULL CHECK (coin_price > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed Initial Cozy Gift Catalog
INSERT INTO public.gift_catalog (id, name, emoji, description, coin_price)
VALUES
  ('matcha_latte', 'Cozy Matcha Latte', '🍵', 'A warm cup of calming ceremonial green tea.', 15),
  ('blossom_sprout', 'Cherry Blossom Sprout', '🌸', 'A gentle petal blessing for steady study growth.', 25),
  ('strawberry_cake', 'Strawberry Shortcake', '🍰', 'A sweet reward after a productive focus sprint.', 40),
  ('sparkling_star', 'Sparkling Focus Star', '⭐', 'Pure luminous energy to light up study nights.', 60),
  ('royal_crown', 'Royal Fumi Crown', '👑', 'The ultimate kawaii badge for legendary focus champions.', 100)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.gift_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gift_id TEXT NOT NULL REFERENCES public.gift_catalog(id) ON DELETE RESTRICT,
  note TEXT CHECK (note IS NULL OR length(note) <= 140),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT check_different_gift_parties CHECK (sender_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_gift_transfers_recipient ON public.gift_transfers(recipient_id);
CREATE INDEX IF NOT EXISTS idx_gift_transfers_sender ON public.gift_transfers(sender_id);

-- ============================================================================
-- 3. PRIVATE STUDY ROOMS & LIVE TEXT CHAT (FR-08)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.study_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(trim(name)) >= 3 AND length(trim(name)) <= 60),
  description TEXT CHECK (description IS NULL OR length(description) <= 200),
  is_private BOOLEAN NOT NULL DEFAULT false,
  invite_code TEXT UNIQUE NOT NULL DEFAULT substring(md5(random()::text) from 1 for 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_rooms_owner ON public.study_rooms(owner_id);
CREATE INDEX IF NOT EXISTS idx_study_rooms_invite_code ON public.study_rooms(invite_code);

CREATE TABLE IF NOT EXISTS public.room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_room_member UNIQUE (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_room_members_room ON public.room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user ON public.room_members(user_id);

CREATE TABLE IF NOT EXISTS public.room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(trim(content)) > 0 AND length(content) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_room_messages_room_time ON public.room_messages(room_id, created_at);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

-- Wallets: Only owner can view
CREATE POLICY "Users can view their own wallet"
  ON public.user_wallets FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Transactions: Only owner can view their transactions
CREATE POLICY "Users can view their own transactions"
  ON public.wallet_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Catalog: Everyone authenticated can view catalog
CREATE POLICY "Anyone authenticated can view gift catalog"
  ON public.gift_catalog FOR SELECT TO authenticated
  USING (is_active = true);

-- Gifts: Sender and recipient can view transfer
CREATE POLICY "Parties can view their gift transfers"
  ON public.gift_transfers FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Helper functions to avoid infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.is_room_member(check_room_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_members
    WHERE room_id = check_room_id AND user_id = check_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_room_owner_or_public(check_room_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.study_rooms
    WHERE id = check_room_id AND (is_private = false OR owner_id = check_user_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_room_owner(check_room_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.study_rooms
    WHERE id = check_room_id AND owner_id = check_user_id
  );
$$;

-- Rooms: Public rooms or rooms user is a member of
DROP POLICY IF EXISTS "Users can view public rooms or joined rooms" ON public.study_rooms;
CREATE POLICY "Users can view public rooms or joined rooms"
  ON public.study_rooms FOR SELECT TO authenticated
  USING (
    is_private = false
    OR auth.uid() = owner_id
    OR public.is_room_member(id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can create rooms" ON public.study_rooms;
CREATE POLICY "Users can create rooms"
  ON public.study_rooms FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update their rooms" ON public.study_rooms;
CREATE POLICY "Owners can update their rooms"
  ON public.study_rooms FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Room Members: Members can view fellow members
DROP POLICY IF EXISTS "Members can view room participants" ON public.room_members;
CREATE POLICY "Members can view room participants"
  ON public.room_members FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_room_owner_or_public(room_id, auth.uid())
    OR public.is_room_member(room_id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can join rooms" ON public.room_members;
CREATE POLICY "Users can join rooms"
  ON public.room_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Members can leave or owners can remove" ON public.room_members;
CREATE POLICY "Members can leave or owners can remove"
  ON public.room_members FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_room_owner(room_id, auth.uid())
  );

-- Room Messages: Only room members can view and post
DROP POLICY IF EXISTS "Members can view room messages" ON public.room_messages;
CREATE POLICY "Members can view room messages"
  ON public.room_messages FOR SELECT TO authenticated
  USING (
    public.is_room_owner_or_public(room_id, auth.uid())
    OR public.is_room_member(room_id, auth.uid())
  );

DROP POLICY IF EXISTS "Members can send messages" ON public.room_messages;
CREATE POLICY "Members can send messages"
  ON public.room_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      public.is_room_owner(room_id, auth.uid())
      OR public.is_room_member(room_id, auth.uid())
    )
  );

-- ============================================================================
-- 5. REALTIME REPLICATION FOR GIFTS & CHAT
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'gift_transfers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.gift_transfers;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'room_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_wallets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_wallets;
  END IF;
END $$;


-- >>> END: supabase/migrations\20261020000005_phase4_wallets_gifts_and_rooms.sql <<<

-- >>> START: supabase/migrations\20261020000006_phase5_companion_progression_and_notifications.sql <<<
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


-- >>> END: supabase/migrations\20261020000006_phase5_companion_progression_and_notifications.sql <<<

