
-- Groups table
CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  invite_code text NOT NULL UNIQUE,
  created_by uuid NOT NULL,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Group members table
CREATE TABLE public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Groups policies: members can view their groups
CREATE POLICY "Members can view their groups"
  ON public.groups FOR SELECT TO authenticated
  USING (
    id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
    OR is_public = true
  );

CREATE POLICY "Authenticated users can create groups"
  ON public.groups FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator can update group"
  ON public.groups FOR UPDATE TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Creator can delete group"
  ON public.groups FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

-- Group members policies
CREATE POLICY "Members can view group members"
  ON public.group_members FOR SELECT TO authenticated
  USING (
    group_id IN (SELECT group_id FROM public.group_members gm WHERE gm.user_id = auth.uid())
  );

CREATE POLICY "Users can join groups"
  ON public.group_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Creator can remove members"
  ON public.group_members FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR group_id IN (SELECT id FROM public.groups WHERE created_by = auth.uid())
  );
