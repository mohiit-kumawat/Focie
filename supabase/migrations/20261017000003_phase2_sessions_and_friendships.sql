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

