-- Allow active household members to read each other's profiles within the same household.
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Members can read household profiles" ON profiles;

CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Members can read household profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM household_members self_member
      JOIN household_members other_member
        ON other_member.household_id = self_member.household_id
      WHERE self_member.profile_id = auth.uid()
        AND self_member.status = 'active'
        AND other_member.profile_id = profiles.id
        AND other_member.status = 'active'
    )
  );
