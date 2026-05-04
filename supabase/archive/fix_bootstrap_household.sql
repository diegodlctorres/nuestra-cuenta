-- Reconciliacion del snapshot vivo:
-- `schema_live.sql` confirma que `public.accounts` no tiene columna `type`,
-- pero la funcion viva `bootstrap_household` todavia la referencia.

CREATE OR REPLACE FUNCTION public.bootstrap_household(h_id UUID)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE household_id = h_id) THEN
    INSERT INTO public.accounts (household_id, name, emoji)
    VALUES
      (h_id, 'Gasto Común', '💳'),
      (h_id, 'Ahorros Compartidos', '🐷');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE household_id = h_id) THEN
    INSERT INTO public.categories (household_id, name, kind)
    VALUES
      (h_id, 'General', 'expense'),
      (h_id, 'Comida', 'expense'),
      (h_id, 'Transporte', 'expense'),
      (h_id, 'Hogar', 'expense'),
      (h_id, 'Salud', 'expense'),
      (h_id, 'Entretenimiento', 'expense'),
      (h_id, 'Compras', 'expense'),
      (h_id, 'Mascotas', 'expense'),
      (h_id, 'Sueldo', 'income'),
      (h_id, 'Inversión', 'income'),
      (h_id, 'Freelance', 'income'),
      (h_id, 'Regalo', 'income');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.bootstrap_household(UUID) TO authenticated;
