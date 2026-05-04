-- RLS policies for "Por hacer" items by active household membership.
-- Apply this in the Supabase SQL editor or through your migration flow.

alter table public.tasks enable row level security;

drop policy if exists "tasks_select_by_household_member" on public.tasks;
drop policy if exists "tasks_insert_by_household_member" on public.tasks;
drop policy if exists "tasks_update_by_household_member" on public.tasks;
drop policy if exists "tasks_delete_by_household_member" on public.tasks;

create policy "tasks_select_by_household_member"
on public.tasks
for select
to authenticated
using (
  exists (
    select 1
    from public.household_members hm
    where hm.household_id = tasks.household_id
      and hm.profile_id = auth.uid()
      and hm.status = 'active'
  )
);

create policy "tasks_insert_by_household_member"
on public.tasks
for insert
to authenticated
with check (
  exists (
    select 1
    from public.household_members hm
    where hm.household_id = tasks.household_id
      and hm.profile_id = auth.uid()
      and hm.status = 'active'
  )
);

create policy "tasks_update_by_household_member"
on public.tasks
for update
to authenticated
using (
  exists (
    select 1
    from public.household_members hm
    where hm.household_id = tasks.household_id
      and hm.profile_id = auth.uid()
      and hm.status = 'active'
  )
)
with check (
  exists (
    select 1
    from public.household_members hm
    where hm.household_id = tasks.household_id
      and hm.profile_id = auth.uid()
      and hm.status = 'active'
  )
);

create policy "tasks_delete_by_household_member"
on public.tasks
for delete
to authenticated
using (
  exists (
    select 1
    from public.household_members hm
    where hm.household_id = tasks.household_id
      and hm.profile_id = auth.uid()
      and hm.status = 'active'
  )
);
