-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL,
  name character varying NOT NULL,
  emoji text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT accounts_pkey PRIMARY KEY (id),
  CONSTRAINT accounts_household_id_fkey FOREIGN KEY (household_id) REFERENCES public.households(id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL,
  name character varying NOT NULL,
  kind USER-DEFINED NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_household_id_fkey FOREIGN KEY (household_id) REFERENCES public.households(id)
);
CREATE TABLE public.household_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL,
  email character varying NOT NULL,
  token character varying NOT NULL UNIQUE,
  invited_by uuid NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::invitation_status,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT household_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT household_invitations_household_id_fkey FOREIGN KEY (household_id) REFERENCES public.households(id),
  CONSTRAINT household_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.household_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  household_id uuid NOT NULL,
  role USER-DEFINED NOT NULL DEFAULT 'member'::member_role,
  status USER-DEFINED NOT NULL DEFAULT 'active'::member_status,
  joined_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT household_members_pkey PRIMARY KEY (id),
  CONSTRAINT household_members_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT household_members_household_id_fkey FOREIGN KEY (household_id) REFERENCES public.households(id)
);
CREATE TABLE public.households (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  theme USER-DEFINED DEFAULT 'default'::theme_type,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT households_pkey PRIMARY KEY (id)
);
CREATE TABLE public.pet_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL,
  title character varying NOT NULL,
  scheduled_date date NOT NULL,
  scheduled_time time without time zone,
  completed_date timestamp with time zone,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_by uuid,
  CONSTRAINT pet_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT pet_tasks_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE CASCADE,
  CONSTRAINT pet_tasks_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public.household_members(id)
);
CREATE TABLE public.pets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL,
  name character varying NOT NULL,
  species character varying NOT NULL,
  breed character varying,
  birth_date date,
  photo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT pets_pkey PRIMARY KEY (id),
  CONSTRAINT pets_household_id_fkey FOREIGN KEY (household_id) REFERENCES public.households(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  name character varying NOT NULL,
  nickname character varying,
  gender character varying,
  birth_date date,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL,
  title character varying NOT NULL,
  deadline date NOT NULL,
  due_time time without time zone,
  completed boolean NOT NULL DEFAULT false,
  requires_transaction boolean NOT NULL DEFAULT false,
  is_recurring boolean NOT NULL DEFAULT false,
  recurrence_unit text,
  recurrence_interval integer,
  recurrence_end_type text,
  recurrence_until date,
  series_anchor_date date NOT NULL,
  archived_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_household_id_fkey FOREIGN KEY (household_id) REFERENCES public.households(id),
  CONSTRAINT tasks_recurrence_unit_check CHECK ((recurrence_unit = ANY (ARRAY['day'::text, 'week'::text, 'month'::text, 'year'::text]))),
  CONSTRAINT tasks_recurrence_interval_check CHECK ((recurrence_interval IS NULL) OR (recurrence_interval > 0)),
  CONSTRAINT tasks_recurrence_end_type_check CHECK ((recurrence_end_type = ANY (ARRAY['never'::text, 'until'::text]))),
  CONSTRAINT tasks_recurring_consistency_check CHECK (((NOT is_recurring) AND recurrence_unit IS NULL AND recurrence_interval IS NULL AND recurrence_end_type IS NULL AND recurrence_until IS NULL) OR (is_recurring AND recurrence_unit IS NOT NULL AND recurrence_interval IS NOT NULL AND recurrence_end_type IS NOT NULL)),
  CONSTRAINT tasks_recurrence_until_check CHECK ((recurrence_end_type IS DISTINCT FROM 'until'::text) OR (recurrence_until IS NOT NULL AND recurrence_until >= series_anchor_date))
);
CREATE TABLE public.task_occurrences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  occurrence_date date NOT NULL,
  occurrence_due_time time without time zone NOT NULL,
  status text NOT NULL,
  completed_at timestamp with time zone,
  requires_transaction_snapshot boolean,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT task_occurrences_pkey PRIMARY KEY (id),
  CONSTRAINT task_occurrences_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE,
  CONSTRAINT task_occurrences_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'skipped'::text, 'deleted'::text]))),
  CONSTRAINT task_occurrences_unique_key UNIQUE (task_id, occurrence_date, occurrence_due_time)
);
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL,
  created_by uuid NOT NULL,
  account_id uuid NOT NULL,
  category_id uuid,
  amount numeric NOT NULL,
  description text NOT NULL,
  date date NOT NULL,
  type USER-DEFINED NOT NULL,
  is_pet_related boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_household_id_fkey FOREIGN KEY (household_id) REFERENCES public.households(id),
  CONSTRAINT transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.household_members(id),
  CONSTRAINT transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE,
  CONSTRAINT transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
