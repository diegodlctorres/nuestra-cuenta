-- Remove the unused debt marker from "Por hacer" items if it was created.

alter table public.tasks
drop column if exists is_debt;
