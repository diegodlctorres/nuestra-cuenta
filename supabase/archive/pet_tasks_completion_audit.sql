-- Track which household member marked a pet task as completed.
-- Apply this before relying on the "completed by" UI.

alter table public.pet_tasks
add column if not exists completed_by uuid null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'pet_tasks_completed_by_fkey'
  ) then
    alter table public.pet_tasks
    add constraint pet_tasks_completed_by_fkey
    foreign key (completed_by)
    references public.household_members(id)
    on delete set null;
  end if;
end $$;

create index if not exists idx_pet_tasks_completed_by
on public.pet_tasks(completed_by);

drop policy if exists "pet_tasks_insert_by_household_member" on public.pet_tasks;
drop policy if exists "pet_tasks_update_by_household_member" on public.pet_tasks;

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
  and (
    completed_by is null
    or exists (
      select 1
      from public.pets p
      join public.household_members completed_member on completed_member.household_id = p.household_id
      where p.id = pet_tasks.pet_id
        and completed_member.id = pet_tasks.completed_by
        and completed_member.status = 'active'
    )
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
  and (
    completed_by is null
    or exists (
      select 1
      from public.pets p
      join public.household_members completed_member on completed_member.household_id = p.household_id
      where p.id = pet_tasks.pet_id
        and completed_member.id = pet_tasks.completed_by
        and completed_member.status = 'active'
    )
  )
);
