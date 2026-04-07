
DROP POLICY "Members can view their groups" ON public.groups;
CREATE POLICY "Members and creators can view groups"
  ON public.groups FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
    OR is_public = true
  );
