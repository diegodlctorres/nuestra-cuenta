-- Ensure deleting a pet removes only that pet's pending tasks and history.
-- This keeps database behavior aligned with the app-level delete flow.

alter table public.pet_tasks
drop constraint if exists pet_tasks_pet_id_fkey;

alter table public.pet_tasks
add constraint pet_tasks_pet_id_fkey
foreign key (pet_id)
references public.pets(id)
on delete cascade;
