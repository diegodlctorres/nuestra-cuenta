-- Allow any active household member to update their household row.
-- Current frontend uses this to persist `households.theme`.
DROP POLICY IF EXISTS "Admins can update their household" ON households;

CREATE POLICY "Members can update their household" ON households
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = households.id
      AND household_members.profile_id = auth.uid()
      AND household_members.status = 'active'
    )
  );
