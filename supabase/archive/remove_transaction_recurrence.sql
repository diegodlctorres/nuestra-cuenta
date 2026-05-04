-- Remove recurrence from transactions now that the UI no longer uses it.
ALTER TABLE public.transactions
  DROP COLUMN IF EXISTS recurrence;

DROP TYPE IF EXISTS public.recurrence_type;
