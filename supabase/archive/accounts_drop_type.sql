-- Remove legacy account type semantics and make account deletion cascade to transactions.

update public.accounts
set emoji = '💳'
where emoji is null or length(trim(emoji)) = 0;

alter table public.transactions
drop constraint if exists transactions_account_id_fkey;

alter table public.transactions
add constraint transactions_account_id_fkey
foreign key (account_id)
references public.accounts(id)
on delete cascade;

alter table public.accounts
drop column if exists type;

drop type if exists public.account_type;
