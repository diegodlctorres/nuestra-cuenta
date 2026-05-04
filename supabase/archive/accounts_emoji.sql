-- Add emoji support to accounts while keeping legacy "type" for compatibility.

alter table public.accounts
add column if not exists emoji text;

update public.accounts
set emoji = case
  when type = 'savings' then '🐷'
  else '💳'
end
where emoji is null or length(trim(emoji)) = 0;
