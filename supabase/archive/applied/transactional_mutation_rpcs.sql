-- Transactional mutation RPC candidates.
--
-- Source of truth used to draft this file:
--   supabase/live/schema_live.sql
--
-- This script is intentionally not applied automatically. Review against the
-- current live snapshot before running it in Supabase.

CREATE OR REPLACE FUNCTION public.assert_active_household_member(p_household_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT hm.id
  FROM public.household_members hm
  WHERE hm.household_id = p_household_id
    AND hm.profile_id = auth.uid()
    AND hm.status = 'active'
  ORDER BY hm.joined_at ASC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.complete_pet_task(
  p_household_id uuid,
  p_pet_task_id uuid
)
RETURNS TABLE(completed_date timestamptz, completed_by uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_member_id uuid;
BEGIN
  v_member_id := public.assert_active_household_member(p_household_id);

  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'No active household member found.';
  END IF;

  UPDATE public.pet_tasks pt
  SET completed = true,
      completed_date = now(),
      completed_by = v_member_id
  FROM public.pets p
  WHERE pt.id = p_pet_task_id
    AND pt.pet_id = p.id
    AND p.household_id = p_household_id
  RETURNING pt.completed_date, pt.completed_by
  INTO completed_date, completed_by;

  IF completed_date IS NULL THEN
    RAISE EXCEPTION 'Pet task was not found for this household.';
  END IF;

  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.reopen_pet_task(
  p_household_id uuid,
  p_pet_task_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_member_id uuid;
  v_updated_count integer;
BEGIN
  v_member_id := public.assert_active_household_member(p_household_id);

  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'No active household member found.';
  END IF;

  UPDATE public.pet_tasks pt
  SET completed = false,
      completed_date = null,
      completed_by = null
  FROM public.pets p
  WHERE pt.id = p_pet_task_id
    AND pt.pet_id = p.id
    AND p.household_id = p_household_id;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  IF v_updated_count = 0 THEN
    RAISE EXCEPTION 'Pet task was not found for this household.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_pet_task(
  p_household_id uuid,
  p_pet_task_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_member_id uuid;
  v_deleted_count integer;
BEGIN
  v_member_id := public.assert_active_household_member(p_household_id);

  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'No active household member found.';
  END IF;

  DELETE FROM public.pet_tasks pt
  USING public.pets p
  WHERE pt.id = p_pet_task_id
    AND pt.pet_id = p.id
    AND p.household_id = p_household_id;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  IF v_deleted_count = 0 THEN
    RAISE EXCEPTION 'Pet task was not found for this household.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_task_occurrence_status(
  p_household_id uuid,
  p_task_id uuid,
  p_occurrence_date date,
  p_occurrence_due_time time,
  p_status text,
  p_requires_transaction_snapshot boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_member_id uuid;
BEGIN
  v_member_id := public.assert_active_household_member(p_household_id);

  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'No active household member found.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.tasks t
    WHERE t.id = p_task_id
      AND t.household_id = p_household_id
  ) THEN
    RAISE EXCEPTION 'Task was not found for this household.';
  END IF;

  INSERT INTO public.task_occurrences (
    task_id,
    occurrence_date,
    occurrence_due_time,
    status,
    completed_at,
    requires_transaction_snapshot
  )
  VALUES (
    p_task_id,
    p_occurrence_date,
    p_occurrence_due_time,
    p_status,
    CASE WHEN p_status = 'completed' THEN now() ELSE null END,
    p_requires_transaction_snapshot
  )
  ON CONFLICT (task_id, occurrence_date, occurrence_due_time)
  DO UPDATE SET
    status = excluded.status,
    completed_at = excluded.completed_at,
    requires_transaction_snapshot = excluded.requires_transaction_snapshot;
END;
$$;
