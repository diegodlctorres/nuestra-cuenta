-- Finance mutation RPCs.
--
-- Pending script. Review and run in Supabase before migrating the frontend to
-- these RPCs. It assumes public.assert_active_household_member(uuid) already
-- exists from transactional_mutation_rpcs_v2.sql.
--
-- Source of truth used to draft this file:
--   supabase/live/schema_live.sql

CREATE OR REPLACE FUNCTION public.create_household_account(
  p_household_id uuid,
  p_name text,
  p_emoji text DEFAULT null
)
RETURNS public.accounts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_member_id uuid;
  v_account public.accounts;
BEGIN
  v_member_id := public.assert_active_household_member(p_household_id);

  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'No active household member found.';
  END IF;

  IF nullif(trim(p_name), '') IS NULL THEN
    RAISE EXCEPTION 'Account name is required.';
  END IF;

  INSERT INTO public.accounts (household_id, name, emoji)
  VALUES (p_household_id, trim(p_name), nullif(trim(coalesce(p_emoji, '')), ''))
  RETURNING * INTO v_account;

  RETURN v_account;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_household_account(
  p_household_id uuid,
  p_account_id uuid,
  p_name text,
  p_emoji text DEFAULT null
)
RETURNS public.accounts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_member_id uuid;
  v_account public.accounts;
BEGIN
  v_member_id := public.assert_active_household_member(p_household_id);

  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'No active household member found.';
  END IF;

  IF nullif(trim(p_name), '') IS NULL THEN
    RAISE EXCEPTION 'Account name is required.';
  END IF;

  UPDATE public.accounts a
  SET name = trim(p_name),
      emoji = nullif(trim(coalesce(p_emoji, '')), '')
  WHERE a.id = p_account_id
    AND a.household_id = p_household_id
  RETURNING * INTO v_account;

  IF v_account.id IS NULL THEN
    RAISE EXCEPTION 'Account was not found for this household.';
  END IF;

  RETURN v_account;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_household_account(
  p_household_id uuid,
  p_account_id uuid
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

  DELETE FROM public.accounts a
  WHERE a.id = p_account_id
    AND a.household_id = p_household_id;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  IF v_deleted_count = 0 THEN
    RAISE EXCEPTION 'Account was not found for this household.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_household_category(
  p_household_id uuid,
  p_name text,
  p_kind public.category_kind
)
RETURNS public.categories
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_member_id uuid;
  v_category public.categories;
BEGIN
  v_member_id := public.assert_active_household_member(p_household_id);

  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'No active household member found.';
  END IF;

  IF nullif(trim(p_name), '') IS NULL THEN
    RAISE EXCEPTION 'Category name is required.';
  END IF;

  INSERT INTO public.categories (household_id, name, kind)
  VALUES (p_household_id, trim(p_name), p_kind)
  RETURNING * INTO v_category;

  RETURN v_category;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_household_category(
  p_household_id uuid,
  p_category_id uuid
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

  DELETE FROM public.categories c
  WHERE c.id = p_category_id
    AND c.household_id = p_household_id;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  IF v_deleted_count = 0 THEN
    RAISE EXCEPTION 'Category was not found for this household.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_household_transaction(
  p_household_id uuid,
  p_account_id uuid,
  p_category_id uuid,
  p_amount numeric,
  p_description text,
  p_date date,
  p_type public.transaction_type,
  p_is_pet_related boolean DEFAULT false
)
RETURNS public.transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_member_id uuid;
  v_category_kind public.category_kind;
  v_transaction public.transactions;
BEGIN
  v_member_id := public.assert_active_household_member(p_household_id);

  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'No active household member found.';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Transaction amount must be greater than zero.';
  END IF;

  IF nullif(trim(p_description), '') IS NULL THEN
    RAISE EXCEPTION 'Transaction description is required.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.accounts a
    WHERE a.id = p_account_id
      AND a.household_id = p_household_id
  ) THEN
    RAISE EXCEPTION 'Account was not found for this household.';
  END IF;

  IF p_category_id IS NOT NULL THEN
    SELECT c.kind INTO v_category_kind
    FROM public.categories c
    WHERE c.id = p_category_id
      AND c.household_id = p_household_id;

    IF v_category_kind IS NULL THEN
      RAISE EXCEPTION 'Category was not found for this household.';
    END IF;

    IF p_type IN ('income'::public.transaction_type, 'expense'::public.transaction_type)
      AND v_category_kind::text <> p_type::text THEN
      RAISE EXCEPTION 'Category kind does not match transaction type.';
    END IF;
  END IF;

  INSERT INTO public.transactions (
    household_id,
    created_by,
    account_id,
    category_id,
    amount,
    description,
    date,
    type,
    is_pet_related
  )
  VALUES (
    p_household_id,
    v_member_id,
    p_account_id,
    p_category_id,
    p_amount,
    trim(p_description),
    p_date,
    p_type,
    coalesce(p_is_pet_related, false)
  )
  RETURNING * INTO v_transaction;

  RETURN v_transaction;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_household_transaction(
  p_household_id uuid,
  p_transaction_id uuid
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

  DELETE FROM public.transactions t
  WHERE t.id = p_transaction_id
    AND t.household_id = p_household_id;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  IF v_deleted_count = 0 THEN
    RAISE EXCEPTION 'Transaction was not found for this household.';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.create_household_account(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_household_account(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_household_account(uuid, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.update_household_account(uuid, uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_household_account(uuid, uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_household_account(uuid, uuid, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.delete_household_account(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_household_account(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_household_account(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.create_household_category(uuid, text, public.category_kind) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_household_category(uuid, text, public.category_kind) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_household_category(uuid, text, public.category_kind) TO authenticated;

REVOKE ALL ON FUNCTION public.delete_household_category(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_household_category(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_household_category(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.create_household_transaction(uuid, uuid, uuid, numeric, text, date, public.transaction_type, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_household_transaction(uuid, uuid, uuid, numeric, text, date, public.transaction_type, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_household_transaction(uuid, uuid, uuid, numeric, text, date, public.transaction_type, boolean) TO authenticated;

REVOKE ALL ON FUNCTION public.delete_household_transaction(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_household_transaction(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_household_transaction(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.create_household_account(uuid, text, text)
  IS 'Creates a household account after validating active membership.';

COMMENT ON FUNCTION public.update_household_account(uuid, uuid, text, text)
  IS 'Updates a household account after validating active membership and household ownership.';

COMMENT ON FUNCTION public.delete_household_account(uuid, uuid)
  IS 'Deletes a household account after validating active membership and household ownership. Related transactions cascade by FK.';

COMMENT ON FUNCTION public.create_household_category(uuid, text, public.category_kind)
  IS 'Creates a household category after validating active membership.';

COMMENT ON FUNCTION public.delete_household_category(uuid, uuid)
  IS 'Deletes a household category after validating active membership and household ownership. Related transaction category ids are set null by FK.';

COMMENT ON FUNCTION public.create_household_transaction(uuid, uuid, uuid, numeric, text, date, public.transaction_type, boolean)
  IS 'Creates a transaction after validating active membership, account ownership, and category ownership/type.';

COMMENT ON FUNCTION public.delete_household_transaction(uuid, uuid)
  IS 'Deletes a household transaction after validating active membership and household ownership.';
