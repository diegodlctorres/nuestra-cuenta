-- RLS policies for pet task access by active household membership.
-- Apply this in the Supabase SQL editor or through your migration flow.

alter table public.pet_tasks enable row level security;

drop policy if exists "pet_tasks_select_by_household_member" on public.pet_tasks;
drop policy if exists "pet_tasks_insert_by_household_member" on public.pet_tasks;
drop policy if exists "pet_tasks_update_by_household_member" on public.pet_tasks;
drop policy if exists "pet_tasks_delete_by_household_member" on public.pet_tasks;

create policy "pet_tasks_select_by_household_member"
on public.pet_tasks
for select
to authenticated
using (
  exists (
    select 1
    from public.pets p
    join public.household_members hm on hm.household_id = p.household_id
    where p.id = pet_tasks.pet_id
      and hm.profile_id = auth.uid()
      and hm.status = 'active'
  )
);

create policy "pet_tasks_insert_by_household_member"
on public.pet_tasks
for insert
to authenticated
with check (
  exists (
    select 1
    from public.pets p
    join public.household_members hm on hm.household_id = p.household_id
    where p.id = pet_tasks.pet_id
      and hm.profile_id = auth.uid()
      and hm.status = 'active'
  )
);

create policy "pet_tasks_update_by_household_member"
on public.pet_tasks
for update
to authenticated
using (
  exists (
    select 1
    from public.pets p
    join public.household_members hm on hm.household_id = p.household_id
    where p.id = pet_tasks.pet_id
      and hm.profile_id = auth.uid()
      and hm.status = 'active'
  )
)
with check (
  exists (
    select 1
    from public.pets p
    join public.household_members hm on hm.household_id = p.household_id
    where p.id = pet_tasks.pet_id
      and hm.profile_id = auth.uid()
      and hm.status = 'active'
  )
);

create policy "pet_tasks_delete_by_household_member"
on public.pet_tasks
for delete
to authenticated
using (
  exists (
    select 1
    from public.pets p
    join public.household_members hm on hm.household_id = p.household_id
    where p.id = pet_tasks.pet_id
      and hm.profile_id = auth.uid()
      and hm.status = 'active'
  )
);
