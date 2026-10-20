-- ==============================================================================
-- FOCUSIE: MIGRATION SCRIPT FOR REMAINING PHASES (PHASE 3, 4, AND 5)
-- Run this in Supabase SQL Editor to upgrade from Phase 2 to Phase 5.
-- Completely idempotent: safe to run multiple times without errors.
-- ==============================================================================

-- ==============================================================================
-- PHASE 3: FAIR LEADERBOARDS & STUDY DAY ACCESS POLICIES
-- ==============================================================================

-- 1. Leaderboard Friend Access on study_session_segments
DROP POLICY IF EXISTS "Friends can view session segments for leaderboards" ON public.study_session_segments;
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

-- 2. Study Day Settings Friend Access (for 24h timezone window calculations)
DROP POLICY IF EXISTS "Friends can view study day settings for personal day windows" ON public.study_day_settings;
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

-- 3. Performance Indexes for Window Aggregations
CREATE INDEX IF NOT EXISTS idx_session_segments_user_started 
  ON public.study_session_segments(user_id, started_at);

CREATE INDEX IF NOT EXISTS idx_session_segments_ended_at 
  ON public.study_session_segments(ended_at);


-- ==============================================================================
-- PHASE 4: VIRTUAL COINS, AUDITABLE WALLETS, GIFTS & STUDY ROOMS (FR-07, FR-08)
-- ==============================================================================

-- 1. User Wallets
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 50 CHECK (balance >= 0), -- 50 welcome focus coins!
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_wallet UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON public.user_wallets(user_id);

-- 2. Auditable Wallet Transactions Ledger
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earned_focus', 'gift_sent', 'gift_received', 'bonus', 'welcome')),
  reference_id TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON public.wallet_transactions(type);

-- 3. Cozy Gift Catalog
CREATE TABLE IF NOT EXISTS public.gift_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT NOT NULL,
  coin_price INT NOT NULL CHECK (coin_price > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed Initial Cozy Items (idempotent)
INSERT INTO public.gift_catalog (id, name, emoji, description, coin_price)
VALUES
  ('matcha_latte', 'Cozy Matcha Latte', '🍵', 'A warm cup of calming ceremonial green tea.', 15),
  ('kawaii_dango', 'Sweet Tri-Color Dango', '🍡', 'Chewy mochi skewers to fuel late night focus.', 20),
  ('boba_milk_tea', 'Brown Sugar Boba', '🧋', 'Sweet treat with tapioca pearls for good study vibes.', 25),
  ('golden_origami', 'Lucky Paper Crane', '🦢', 'A folded origami crane wishing calm & concentration.', 30),
  ('focus_crystal', 'Amethyst Focus Crystal', '💎', 'Radiates relaxing purple energy and clear mind.', 40),
  ('sakura_bento', 'Spring Sakura Bento', '🍱', 'A comforting homemade lunch box made with care.', 50)
ON CONFLICT (id) DO NOTHING;

-- 4. Gift Transfers Log
CREATE TABLE IF NOT EXISTS public.gift_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gift_id TEXT NOT NULL REFERENCES public.gift_catalog(id) ON DELETE RESTRICT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gift_transfers_recipient ON public.gift_transfers(recipient_id);
CREATE INDEX IF NOT EXISTS idx_gift_transfers_sender ON public.gift_transfers(sender_id);

-- 5. Private Study Rooms
CREATE TABLE IF NOT EXISTS public.study_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 3 AND char_length(name) <= 50),
  description TEXT,
  is_private BOOLEAN NOT NULL DEFAULT true,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_rooms_invite_code ON public.study_rooms(invite_code);
CREATE INDEX IF NOT EXISTS idx_study_rooms_owner ON public.study_rooms(owner_id);

-- 6. Room Members
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

-- 7. Room Live Messages
CREATE TABLE IF NOT EXISTS public.room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_room_messages_room_created ON public.room_messages(room_id, created_at ASC);

-- 8. Enable RLS on Phase 4 Tables
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

-- 9. Phase 4 RLS Policies
DROP POLICY IF EXISTS "Users can view own wallet" ON public.user_wallets;
CREATE POLICY "Users can view own wallet"
  ON public.user_wallets FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own transactions" ON public.wallet_transactions;
CREATE POLICY "Users can view own transactions"
  ON public.wallet_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Gift catalog is viewable by authenticated users" ON public.gift_catalog;
CREATE POLICY "Gift catalog is viewable by authenticated users"
  ON public.gift_catalog FOR SELECT TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Users can view gifts sent or received" ON public.gift_transfers;
CREATE POLICY "Users can view gifts sent or received"
  ON public.gift_transfers FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Public or member rooms are viewable" ON public.study_rooms;
CREATE POLICY "Public or member rooms are viewable"
  ON public.study_rooms FOR SELECT TO authenticated
  USING (
    is_private = false
    OR auth.uid() = owner_id
    OR EXISTS (SELECT 1 FROM public.room_members rm WHERE rm.room_id = study_rooms.id AND rm.user_id = auth.uid())
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

DROP POLICY IF EXISTS "Members can view room participants" ON public.room_members;
CREATE POLICY "Members can view room participants"
  ON public.room_members FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.study_rooms sr WHERE sr.id = room_members.room_id AND sr.is_private = false)
    OR auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.room_members rm2 WHERE rm2.room_id = room_members.room_id AND rm2.user_id = auth.uid())
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
    OR EXISTS (SELECT 1 FROM public.study_rooms sr WHERE sr.id = room_members.room_id AND sr.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Members can view room messages" ON public.room_messages;
CREATE POLICY "Members can view room messages"
  ON public.room_messages FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.room_members rm WHERE rm.room_id = room_messages.room_id AND rm.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.study_rooms sr WHERE sr.id = room_messages.room_id AND sr.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Members can send messages" ON public.room_messages;
CREATE POLICY "Members can send messages"
  ON public.room_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      EXISTS (SELECT 1 FROM public.room_members rm WHERE rm.room_id = room_messages.room_id AND rm.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.study_rooms sr WHERE sr.id = room_messages.room_id AND sr.owner_id = auth.uid())
    )
  );

-- 10. Auto-Provision User Wallet for New Users
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_wallets (user_id, balance)
  VALUES (NEW.id, 50)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_user_wallet_provisioning ON auth.users;
CREATE TRIGGER trigger_user_wallet_provisioning
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_wallet();

-- Backfill any existing users who don't have a wallet yet
INSERT INTO public.user_wallets (user_id, balance)
SELECT id, 50 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;


-- ==============================================================================
-- PHASE 5: COMPANION PROGRESSION, COSMETICS & NOTIFICATION CENTER (FR-09, FR-10)
-- ==============================================================================

-- 1. Companion Profiles
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

-- 2. User Cosmetic Inventory
CREATE TABLE IF NOT EXISTS public.user_cosmetics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cosmetic_id TEXT NOT NULL,
  unlocked_via TEXT NOT NULL DEFAULT 'milestone',
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_cosmetic UNIQUE (user_id, cosmetic_id)
);

-- 3. In-App Notifications
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

-- 4. User Settings & Privacy Controls
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

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_companion_profiles_user ON public.companion_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cosmetics_user ON public.user_cosmetics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON public.user_settings(user_id);

-- 6. Enable RLS on Phase 5 Tables
ALTER TABLE public.companion_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cosmetics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 7. Phase 5 RLS Policies
DROP POLICY IF EXISTS "Users can manage own companion profile" ON public.companion_profiles;
CREATE POLICY "Users can manage own companion profile"
  ON public.companion_profiles FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Friends can view companion stage and cosmetic" ON public.companion_profiles;
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

DROP POLICY IF EXISTS "Users can manage own cosmetics" ON public.user_cosmetics;
CREATE POLICY "Users can manage own cosmetics"
  ON public.user_cosmetics FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read and update own notifications" ON public.notifications;
CREATE POLICY "Users can read and update own notifications"
  ON public.notifications FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own privacy and alert settings" ON public.user_settings;
CREATE POLICY "Users can manage own privacy and alert settings"
  ON public.user_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8. Auto-Provision Companion Profile & Settings for Users
CREATE OR REPLACE FUNCTION public.handle_new_user_companion_and_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.companion_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_cosmetics (user_id, cosmetic_id, unlocked_via)
  VALUES (NEW.id, 'default', 'default')
  ON CONFLICT (user_id, cosmetic_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_user_companion_provisioning ON auth.users;
CREATE TRIGGER trigger_user_companion_provisioning
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_companion_and_settings();

-- Backfill existing users with companion profiles & settings
INSERT INTO public.companion_profiles (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_settings (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_cosmetics (user_id, cosmetic_id, unlocked_via)
SELECT id, 'default', 'default' FROM auth.users
ON CONFLICT (user_id, cosmetic_id) DO NOTHING;


-- ==============================================================================
-- REALTIME SUBSCRIPTIONS ENABLER (For Gifts, Rooms & Notifications)
-- ==============================================================================

DO $$
BEGIN
  -- Gift Transfers
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'gift_transfers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.gift_transfers;
  END IF;

  -- Room Messages
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'room_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
  END IF;

  -- User Wallets
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_wallets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_wallets;
  END IF;

  -- Notifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;

  -- Companion Profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'companion_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.companion_profiles;
  END IF;
END $$;
