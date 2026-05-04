-- Optional time for "Por hacer" items.

alter table public.tasks
add column if not exists due_time time without time zone;
