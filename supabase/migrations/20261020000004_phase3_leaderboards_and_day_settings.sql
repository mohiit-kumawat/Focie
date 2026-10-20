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

