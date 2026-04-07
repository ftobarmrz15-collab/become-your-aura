
-- Allow group members to view other members' profiles, avatar state, avatar config, activities, and uploads

-- Users: allow viewing profiles of fellow group members
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view profiles"
  ON public.users FOR SELECT TO public
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.group_members gm1
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid() AND gm2.user_id = users.user_id
    )
  );

-- Avatar state: allow viewing fellow group members
DROP POLICY IF EXISTS "Users can view own avatar" ON public.avatar_state;
CREATE POLICY "Users can view avatars"
  ON public.avatar_state FOR SELECT TO public
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.group_members gm1
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid() AND gm2.user_id = avatar_state.user_id
    )
  );

-- Avatar config: allow viewing fellow group members
DROP POLICY IF EXISTS "Users can view own avatar config" ON public.avatar_config;
CREATE POLICY "Users can view avatar configs"
  ON public.avatar_config FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.group_members gm1
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid() AND gm2.user_id = avatar_config.user_id
    )
  );

-- Activities: allow viewing fellow group members' activities
DROP POLICY IF EXISTS "Users can view own activities" ON public.activities;
CREATE POLICY "Users can view activities"
  ON public.activities FOR SELECT TO public
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.group_members gm1
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid() AND gm2.user_id = activities.user_id
    )
  );

-- Uploads: allow viewing fellow group members' uploads
DROP POLICY IF EXISTS "Users can view own uploads" ON public.uploads;
CREATE POLICY "Users can view uploads"
  ON public.uploads FOR SELECT TO public
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.group_members gm1
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid() AND gm2.user_id = uploads.user_id
    )
  );

-- Add gender and eyebrows columns to avatar_config
ALTER TABLE public.avatar_config 
  ADD COLUMN IF NOT EXISTS gender text NOT NULL DEFAULT 'neutral',
  ADD COLUMN IF NOT EXISTS eyebrows text NOT NULL DEFAULT 'normal';
