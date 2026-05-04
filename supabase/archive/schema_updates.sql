-- 4. AUTOGENERATION TRIGGERS & FUNCTIONS

-- Create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Atomic flow to create a household and make creator an admin
CREATE OR REPLACE FUNCTION public.create_household_and_insert_admin(p_theme theme_type DEFAULT 'default')
RETURNS UUID AS $$
DECLARE
  v_household_id UUID;
BEGIN
  -- 1. Insert the new household
  INSERT INTO households (theme)
  VALUES (p_theme)
  RETURNING id INTO v_household_id;

  -- 2. Insert the calling user as the explicit admin of this new household
  INSERT INTO household_members (profile_id, household_id, role, status)
  VALUES (auth.uid(), v_household_id, 'admin', 'active');

  RETURN v_household_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
