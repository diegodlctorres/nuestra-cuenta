-- 1. Crear función de sembrado automático (Bypass RLS)
-- Esta función se encarga de que cada pareja tenga sus categorías y cuentas nada más empezar
CREATE OR REPLACE FUNCTION public.bootstrap_household(h_id UUID)
RETURNS void AS $$
BEGIN
  -- Insertar Cuentas si no existen para este hogar
  IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE household_id = h_id) THEN
    INSERT INTO public.accounts (household_id, name, emoji)
    VALUES 
      (h_id, 'Gasto Común', '💳'),
      (h_id, 'Ahorros Compartidos', '🐷');
  END IF;

  -- Insertar Categorías Maestras si no existen para este hogar
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE household_id = h_id) THEN
    INSERT INTO public.categories (household_id, name, kind)
    VALUES 
      (h_id, 'General', 'expense'), (h_id, 'Comida', 'expense'),
      (h_id, 'Transporte', 'expense'), (h_id, 'Hogar', 'expense'),
      (h_id, 'Salud', 'expense'), (h_id, 'Entretenimiento', 'expense'),
      (h_id, 'Compras', 'expense'), (h_id, 'Mascotas', 'expense'),
      (h_id, 'Sueldo', 'income'), (h_id, 'Inversión', 'income'),
      (h_id, 'Freelance', 'income'), (h_id, 'Regalo', 'income');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- El "security definer" permite saltarse el RLS para este paso inicial

-- 2. Corregir políticas para permitir que miembros vean perfiles de otros en el mismo hogar
-- Esto corrige el error de "Relación no encontrada" al cargar transacciones
DROP POLICY IF EXISTS "Profiles are visible to household members" ON profiles;
CREATE POLICY "Profiles are visible to household members" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.household_members m1
      JOIN public.household_members m2 ON m1.household_id = m2.household_id
      WHERE m1.profile_id = auth.uid() AND m2.profile_id = profiles.id
    )
    OR id = auth.uid()
  );

-- 3. Dar permiso a los usuarios autenticados para llamar a esta función
GRANT EXECUTE ON FUNCTION public.bootstrap_household(UUID) TO authenticated;
