-- Recurrence support for household reminders without pre-generating future rows.
-- Apply this before using the recurring reminders UI.

alter table public.tasks
add column if not exists is_recurring boolean not null default false,
add column if not exists recurrence_unit text,
add column if not exists recurrence_interval integer,
add column if not exists recurrence_end_type text,
add column if not exists recurrence_until date,
add column if not exists series_anchor_date date,
add column if not exists archived_at timestamp with time zone;

update public.tasks
set series_anchor_date = deadline
where series_anchor_date is null;

alter table public.tasks
alter column series_anchor_date set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_recurrence_unit_check'
  ) then
    alter table public.tasks
    add constraint tasks_recurrence_unit_check
    check (recurrence_unit = any (array['day', 'week', 'month', 'year']));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_recurrence_interval_check'
  ) then
    alter table public.tasks
    add constraint tasks_recurrence_interval_check
    check (recurrence_interval is null or recurrence_interval > 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_recurrence_end_type_check'
  ) then
    alter table public.tasks
    add constraint tasks_recurrence_end_type_check
    check (recurrence_end_type = any (array['never', 'until']));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_recurring_consistency_check'
  ) then
    alter table public.tasks
    add constraint tasks_recurring_consistency_check
    check (
      ((not is_recurring) and recurrence_unit is null and recurrence_interval is null and recurrence_end_type is null and recurrence_until is null)
      or
      (is_recurring and recurrence_unit is not null and recurrence_interval is not null and recurrence_end_type is not null)
    );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_recurrence_until_check'
  ) then
    alter table public.tasks
    add constraint tasks_recurrence_until_check
    check (recurrence_end_type is distinct from 'until' or (recurrence_until is not null and recurrence_until >= series_anchor_date));
  end if;
end $$;

create table if not exists public.task_occurrences (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  occurrence_date date not null,
  occurrence_due_time time without time zone not null,
  status text not null,
  completed_at timestamp with time zone,
  requires_transaction_snapshot boolean,
  created_at timestamp with time zone not null default timezone('utc', now())
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'task_occurrences_status_check'
  ) then
    alter table public.task_occurrences
    add constraint task_occurrences_status_check
    check (status = any (array['pending', 'completed', 'skipped', 'deleted']));
  end if;
end $$;

create unique index if not exists idx_task_occurrences_unique_key
on public.task_occurrences(task_id, occurrence_date, occurrence_due_time);
