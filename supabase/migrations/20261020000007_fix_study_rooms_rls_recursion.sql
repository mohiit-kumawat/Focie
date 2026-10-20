-- ==============================================================================
-- FIX: BREAK INFINITE RECURSION IN STUDY_ROOMS & ROOM_MEMBERS RLS POLICIES
-- ==============================================================================

-- 1. Helper function to check if a user is a member of a room without triggering RLS recursion
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

-- 2. Helper function to check if a room is public or owned by user without triggering RLS recursion
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

-- 3. Helper function to check if user is room owner without triggering RLS recursion
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

-- 4. Re-create study_rooms SELECT policy
DROP POLICY IF EXISTS "Users can view public rooms or joined rooms" ON public.study_rooms;
DROP POLICY IF EXISTS "Public or member rooms are viewable" ON public.study_rooms;

CREATE POLICY "Users can view public rooms or joined rooms"
  ON public.study_rooms FOR SELECT TO authenticated
  USING (
    is_private = false
    OR auth.uid() = owner_id
    OR public.is_room_member(id, auth.uid())
  );

-- 5. Re-create room_members policies
DROP POLICY IF EXISTS "Members can view room participants" ON public.room_members;
CREATE POLICY "Members can view room participants"
  ON public.room_members FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_room_owner_or_public(room_id, auth.uid())
    OR public.is_room_member(room_id, auth.uid())
  );

DROP POLICY IF EXISTS "Members can leave or owners can remove" ON public.room_members;
CREATE POLICY "Members can leave or owners can remove"
  ON public.room_members FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_room_owner(room_id, auth.uid())
  );

-- 6. Re-create room_messages policies
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

