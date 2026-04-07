DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'groups_invite_code_key'
      AND conrelid = 'public.groups'::regclass
  ) THEN
    ALTER TABLE public.groups
    ADD CONSTRAINT groups_invite_code_key UNIQUE (invite_code);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'group_members_group_id_user_id_key'
      AND conrelid = 'public.group_members'::regclass
  ) THEN
    ALTER TABLE public.group_members
    ADD CONSTRAINT group_members_group_id_user_id_key UNIQUE (group_id, user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_id = _group_id
      AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_creator(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.groups
    WHERE id = _group_id
      AND created_by = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.create_group_with_code(_name text, _is_public boolean DEFAULT false)
RETURNS public.groups
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_group public.groups%ROWTYPE;
  _chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  _code text;
  _attempts integer := 0;
  _group_count integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  _name := btrim(_name);

  IF _name IS NULL OR char_length(_name) = 0 THEN
    RAISE EXCEPTION 'Group name is required';
  END IF;

  IF char_length(_name) > 30 THEN
    RAISE EXCEPTION 'Group name is too long';
  END IF;

  SELECT count(*)
  INTO _group_count
  FROM public.group_members
  WHERE user_id = auth.uid();

  IF _group_count >= 3 THEN
    RAISE EXCEPTION 'Maximum 3 groups allowed';
  END IF;

  LOOP
    _attempts := _attempts + 1;
    _code := 'AURA-';

    FOR i IN 1..4 LOOP
      _code := _code || substr(_chars, 1 + floor(random() * length(_chars))::int, 1);
    END LOOP;

    BEGIN
      INSERT INTO public.groups (name, invite_code, created_by, is_public)
      VALUES (_name, _code, auth.uid(), COALESCE(_is_public, false))
      RETURNING * INTO _new_group;

      INSERT INTO public.group_members (group_id, user_id, role)
      VALUES (_new_group.id, auth.uid(), 'creator');

      RETURN _new_group;
    EXCEPTION
      WHEN unique_violation THEN
        IF _attempts >= 10 THEN
          RAISE EXCEPTION 'Could not generate a unique invite code';
        END IF;
    END;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_group_with_code(_invite_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _group_id uuid;
  _group_count integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT count(*)
  INTO _group_count
  FROM public.group_members
  WHERE user_id = auth.uid();

  IF _group_count >= 3 THEN
    RAISE EXCEPTION 'Maximum 3 groups allowed';
  END IF;

  SELECT id
  INTO _group_id
  FROM public.groups
  WHERE invite_code = upper(btrim(_invite_code));

  IF _group_id IS NULL THEN
    RAISE EXCEPTION 'Invite code not found';
  END IF;

  IF public.is_group_member(_group_id, auth.uid()) THEN
    RAISE EXCEPTION 'Already a member';
  END IF;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (_group_id, auth.uid(), 'member');

  RETURN _group_id;
END;
$$;

REVOKE ALL ON FUNCTION public.is_group_member(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_group_creator(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_group_with_code(text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.join_group_with_code(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_creator(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_group_with_code(text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_group_with_code(text) TO authenticated;

DROP POLICY IF EXISTS "Members can view their groups" ON public.groups;
DROP POLICY IF EXISTS "Members and creators can view groups" ON public.groups;
CREATE POLICY "Members and creators can view groups"
ON public.groups
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR is_public = true
  OR public.is_group_member(id, auth.uid())
);

DROP POLICY IF EXISTS "Members can view group members" ON public.group_members;
CREATE POLICY "Members and creators can view group members"
ON public.group_members
FOR SELECT
TO authenticated
USING (
  public.is_group_member(group_id, auth.uid())
  OR public.is_group_creator(group_id, auth.uid())
);

DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
CREATE POLICY "Users can join groups"
ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Creator can remove members" ON public.group_members;
CREATE POLICY "Creator can remove members"
ON public.group_members
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_group_creator(group_id, auth.uid())
);