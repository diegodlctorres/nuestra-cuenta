-- Marks "Por hacer" items that require a transaction before completion.

alter table public.tasks
add column if not exists requires_transaction boolean not null default false;
