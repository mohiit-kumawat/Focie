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

-- Rooms: Public rooms or rooms user is a member of
CREATE POLICY "Users can view public rooms or joined rooms"
  ON public.study_rooms FOR SELECT TO authenticated
  USING (
    is_private = false
    OR auth.uid() = owner_id
    OR EXISTS (SELECT 1 FROM public.room_members rm WHERE rm.room_id = study_rooms.id AND rm.user_id = auth.uid())
  );

CREATE POLICY "Users can create rooms"
  ON public.study_rooms FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their rooms"
  ON public.study_rooms FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Room Members: Members can view fellow members
CREATE POLICY "Members can view room participants"
  ON public.room_members FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.study_rooms sr WHERE sr.id = room_members.room_id AND sr.is_private = false)
    OR auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.room_members rm2 WHERE rm2.room_id = room_members.room_id AND rm2.user_id = auth.uid())
  );

CREATE POLICY "Users can join rooms"
  ON public.room_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can leave or owners can remove"
  ON public.room_members FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.study_rooms sr WHERE sr.id = room_members.room_id AND sr.owner_id = auth.uid())
  );

-- Room Messages: Only room members can view and post
CREATE POLICY "Members can view room messages"
  ON public.room_messages FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.room_members rm WHERE rm.room_id = room_messages.room_id AND rm.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.study_rooms sr WHERE sr.id = room_messages.room_id AND sr.owner_id = auth.uid())
  );

CREATE POLICY "Members can send messages"
  ON public.room_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      EXISTS (SELECT 1 FROM public.room_members rm WHERE rm.room_id = room_messages.room_id AND rm.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.study_rooms sr WHERE sr.id = room_messages.room_id AND sr.owner_id = auth.uid())
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

