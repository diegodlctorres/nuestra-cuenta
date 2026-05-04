-- Returns active household members with their profile info for the caller's active household.
CREATE OR REPLACE FUNCTION public.get_household_member_profiles()
RETURNS TABLE (
  member_id UUID,
  profile_id UUID,
  name VARCHAR,
  nickname VARCHAR,
  gender VARCHAR,
  birth_date DATE,
  avatar_url TEXT,
  joined_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    hm.id AS member_id,
    p.id AS profile_id,
    p.name,
    p.nickname,
    p.gender,
    p.birth_date,
    p.avatar_url,
    hm.joined_at
  FROM public.household_members hm
  INNER JOIN public.profiles p ON p.id = hm.profile_id
  WHERE hm.status = 'active'
    AND hm.household_id = (
      SELECT household_id
      FROM public.household_members
      WHERE profile_id = auth.uid()
        AND status = 'active'
      ORDER BY joined_at ASC
      LIMIT 1
    )
  ORDER BY hm.joined_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_household_member_profiles() TO authenticated;
