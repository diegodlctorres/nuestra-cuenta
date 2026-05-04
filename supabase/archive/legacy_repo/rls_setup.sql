-- Fuente mantenible de políticas RLS esperadas para `public`.
-- Este archivo fue reconciliado contra `supabase/rls_live.md` y cubre
-- las tablas activas que usa el frontend.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_occurrences ENABLE ROW LEVEL SECURITY;

-- ====== PROFILES ======
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Members can read household profiles" ON public.profiles;
CREATE POLICY "Members can read household profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.household_members self_member
      JOIN public.household_members other_member
        ON other_member.household_id = self_member.household_id
      WHERE self_member.profile_id = auth.uid()
        AND self_member.status = 'active'
        AND other_member.profile_id = profiles.id
        AND other_member.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Profiles are visible to household members" ON public.profiles;
CREATE POLICY "Profiles are visible to household members" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.household_members m1
      JOIN public.household_members m2
        ON m1.household_id = m2.household_id
      WHERE m1.profile_id = auth.uid()
        AND m2.profile_id = profiles.id
    )
    OR id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ====== HOUSEHOLDS ======
DROP POLICY IF EXISTS "Users can view their household" ON public.households;
CREATE POLICY "Users can view their household" ON public.households
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.household_members
      WHERE household_members.household_id = households.id
        AND household_members.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can update their household" ON public.households;
CREATE POLICY "Members can update their household" ON public.households
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM public.household_members
      WHERE household_members.household_id = households.id
        AND household_members.profile_id = auth.uid()
        AND household_members.status = 'active'
    )
  );

-- ====== HOUSEHOLD_MEMBERS ======
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.household_members;
CREATE POLICY "Users can view their own memberships" ON public.household_members
  FOR SELECT USING (profile_id = auth.uid());

-- ====== HOUSEHOLD_INVITATIONS ======
DROP POLICY IF EXISTS "Admins can manage invitations" ON public.household_invitations;
CREATE POLICY "Admins can manage invitations" ON public.household_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.household_members
      WHERE household_members.household_id = household_invitations.household_id
        AND household_members.profile_id = auth.uid()
        AND household_members.role = 'admin'
    )
  );

-- ====== ACCOUNTS ======
DROP POLICY IF EXISTS "Members can view household accounts" ON public.accounts;
CREATE POLICY "Members can view household accounts" ON public.accounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.household_members
      WHERE household_members.household_id = accounts.household_id
        AND household_members.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can insert household accounts" ON public.accounts;
CREATE POLICY "Members can insert household accounts" ON public.accounts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.household_members
      WHERE household_members.household_id = accounts.household_id
        AND household_members.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can update household accounts" ON public.accounts;
CREATE POLICY "Members can update household accounts" ON public.accounts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM public.household_members
      WHERE household_members.household_id = accounts.household_id
        AND household_members.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can delete household accounts" ON public.accounts;
CREATE POLICY "Members can delete household accounts" ON public.accounts
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.household_members
      WHERE household_members.household_id = accounts.household_id
        AND household_members.profile_id = auth.uid()
    )
  );

-- ====== CATEGORIES ======
DROP POLICY IF EXISTS "Users can see categories in their household" ON public.categories;
DROP POLICY IF EXISTS "Members can view household categories" ON public.categories;
CREATE POLICY "Members can view household categories" ON public.categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.household_members
      WHERE household_members.household_id = categories.household_id
        AND household_members.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can insert household categories" ON public.categories;
CREATE POLICY "Members can insert household categories" ON public.categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.household_members
      WHERE household_members.household_id = categories.household_id
        AND household_members.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can delete household categories" ON public.categories;
CREATE POLICY "Members can delete household categories" ON public.categories
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.household_members
      WHERE household_members.household_id = categories.household_id
        AND household_members.profile_id = auth.uid()
    )
  );

-- ====== TRANSACTIONS ======
DROP POLICY IF EXISTS "Members can view household transactions" ON public.transactions;
CREATE POLICY "Members can view household transactions" ON public.transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.household_members
      WHERE household_members.household_id = transactions.household_id
        AND household_members.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can insert household transactions" ON public.transactions;
CREATE POLICY "Members can insert household transactions" ON public.transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.household_members
      WHERE household_members.household_id = transactions.household_id
        AND household_members.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can delete household transactions" ON public.transactions;
CREATE POLICY "Members can delete household transactions" ON public.transactions
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.household_members
      WHERE household_members.household_id = transactions.household_id
        AND household_members.profile_id = auth.uid()
    )
  );

-- ====== PETS ======
DROP POLICY IF EXISTS "Members can manage household pets" ON public.pets;
CREATE POLICY "Members can manage household pets" ON public.pets
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.household_members
      WHERE household_members.household_id = pets.household_id
        AND household_members.profile_id = auth.uid()
    )
  );

-- ====== PET_TASKS ======
DROP POLICY IF EXISTS "pet_tasks_select_by_household_member" ON public.pet_tasks;
CREATE POLICY "pet_tasks_select_by_household_member" ON public.pet_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.pets p
      JOIN public.household_members hm
        ON hm.household_id = p.household_id
      WHERE p.id = pet_tasks.pet_id
        AND hm.profile_id = auth.uid()
        AND hm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "pet_tasks_insert_by_household_member" ON public.pet_tasks;
CREATE POLICY "pet_tasks_insert_by_household_member" ON public.pet_tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.pets p
      JOIN public.household_members hm
        ON hm.household_id = p.household_id
      WHERE p.id = pet_tasks.pet_id
        AND hm.profile_id = auth.uid()
        AND hm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "pet_tasks_update_by_household_member" ON public.pet_tasks;
CREATE POLICY "pet_tasks_update_by_household_member" ON public.pet_tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM public.pets p
      JOIN public.household_members hm
        ON hm.household_id = p.household_id
      WHERE p.id = pet_tasks.pet_id
        AND hm.profile_id = auth.uid()
        AND hm.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.pets p
      JOIN public.household_members hm
        ON hm.household_id = p.household_id
      WHERE p.id = pet_tasks.pet_id
        AND hm.profile_id = auth.uid()
        AND hm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "pet_tasks_delete_by_household_member" ON public.pet_tasks;
CREATE POLICY "pet_tasks_delete_by_household_member" ON public.pet_tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.pets p
      JOIN public.household_members hm
        ON hm.household_id = p.household_id
      WHERE p.id = pet_tasks.pet_id
        AND hm.profile_id = auth.uid()
        AND hm.status = 'active'
    )
  );

-- ====== TASKS ======
DROP POLICY IF EXISTS "tasks_select_by_household_member" ON public.tasks;
CREATE POLICY "tasks_select_by_household_member" ON public.tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.household_members hm
      WHERE hm.household_id = tasks.household_id
        AND hm.profile_id = auth.uid()
        AND hm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "tasks_insert_by_household_member" ON public.tasks;
CREATE POLICY "tasks_insert_by_household_member" ON public.tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.household_members hm
      WHERE hm.household_id = tasks.household_id
        AND hm.profile_id = auth.uid()
        AND hm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "tasks_update_by_household_member" ON public.tasks;
CREATE POLICY "tasks_update_by_household_member" ON public.tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM public.household_members hm
      WHERE hm.household_id = tasks.household_id
        AND hm.profile_id = auth.uid()
        AND hm.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.household_members hm
      WHERE hm.household_id = tasks.household_id
        AND hm.profile_id = auth.uid()
        AND hm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "tasks_delete_by_household_member" ON public.tasks;
CREATE POLICY "tasks_delete_by_household_member" ON public.tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.household_members hm
      WHERE hm.household_id = tasks.household_id
        AND hm.profile_id = auth.uid()
        AND hm.status = 'active'
    )
  );

-- ====== TASK_OCCURRENCES ======
DROP POLICY IF EXISTS "task_occurrences_select_by_household_member" ON public.task_occurrences;
CREATE POLICY "task_occurrences_select_by_household_member" ON public.task_occurrences
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.tasks t
      JOIN public.household_members hm
        ON hm.household_id = t.household_id
      WHERE t.id = task_occurrences.task_id
        AND hm.profile_id = auth.uid()
        AND hm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "task_occurrences_insert_by_household_member" ON public.task_occurrences;
CREATE POLICY "task_occurrences_insert_by_household_member" ON public.task_occurrences
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.tasks t
      JOIN public.household_members hm
        ON hm.household_id = t.household_id
      WHERE t.id = task_occurrences.task_id
        AND hm.profile_id = auth.uid()
        AND hm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "task_occurrences_update_by_household_member" ON public.task_occurrences;
CREATE POLICY "task_occurrences_update_by_household_member" ON public.task_occurrences
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM public.tasks t
      JOIN public.household_members hm
        ON hm.household_id = t.household_id
      WHERE t.id = task_occurrences.task_id
        AND hm.profile_id = auth.uid()
        AND hm.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.tasks t
      JOIN public.household_members hm
        ON hm.household_id = t.household_id
      WHERE t.id = task_occurrences.task_id
        AND hm.profile_id = auth.uid()
        AND hm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "task_occurrences_delete_by_household_member" ON public.task_occurrences;
CREATE POLICY "task_occurrences_delete_by_household_member" ON public.task_occurrences
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.tasks t
      JOIN public.household_members hm
        ON hm.household_id = t.household_id
      WHERE t.id = task_occurrences.task_id
        AND hm.profile_id = auth.uid()
        AND hm.status = 'active'
    )
  );
