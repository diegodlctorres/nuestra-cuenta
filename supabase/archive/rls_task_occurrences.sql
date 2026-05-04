-- RLS policies for resolved reminder occurrences by active household membership.
-- Apply this after creating public.task_occurrences.

alter table public.task_occurrences enable row level security;

drop policy if exists "task_occurrences_select_by_household_member" on public.task_occurrences;
drop policy if exists "task_occurrences_insert_by_household_member" on public.task_occurrences;
drop policy if exists "task_occurrences_update_by_household_member" on public.task_occurrences;
drop policy if exists "task_occurrences_delete_by_household_member" on public.task_occurrences;

create policy "task_occurrences_select_by_household_member"
on public.task_occurrences
for select
to authenticated
using (
  exists (
    select 1
    from public.tasks t
    join public.household_members hm on hm.household_id = t.household_id
    where t.id = task_occurrences.task_id
      and hm.profile_id = auth.uid()
      and hm.status = 'active'
  )
);

create policy "task_occurrences_insert_by_household_member"
on public.task_occurrences
for insert
to authenticated
with check (
  exists (
    select 1
    from public.tasks t
    join public.household_members hm on hm.household_id = t.household_id
    where t.id = task_occurrences.task_id
      and hm.profile_id = auth.uid()
      and hm.status = 'active'
  )
);

create policy "task_occurrences_update_by_household_member"
on public.task_occurrences
for update
to authenticated
using (
  exists (
    select 1
    from public.tasks t
    join public.household_members hm on hm.household_id = t.household_id
    where t.id = task_occurrences.task_id
      and hm.profile_id = auth.uid()
      and hm.status = 'active'
  )
)
with check (
  exists (
    select 1
    from public.tasks t
    join public.household_members hm on hm.household_id = t.household_id
    where t.id = task_occurrences.task_id
      and hm.profile_id = auth.uid()
      and hm.status = 'active'
  )
);

create policy "task_occurrences_delete_by_household_member"
on public.task_occurrences
for delete
to authenticated
using (
  exists (
    select 1
    from public.tasks t
    join public.household_members hm on hm.household_id = t.household_id
    where t.id = task_occurrences.task_id
      and hm.profile_id = auth.uid()
      and hm.status = 'active'
  )
);
