-- Returns the active profiles that belong to the caller's current household.
-- This keeps partner profile reads explicit without weakening the base RLS policies.
CREATE OR REPLACE FUNCTION public.get_household_profiles()
RETURNS TABLE (
  id UUID,
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
    p.id,
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

GRANT EXECUTE ON FUNCTION public.get_household_profiles() TO authenticated;
