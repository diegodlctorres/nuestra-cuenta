-- FASE 2: GESTIÓN DE INVITACIONES

-- Política RLS para que los administradores del Household puedan crear y ver invitaciones
CREATE POLICY "Admins can manage invitations" ON household_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM household_members 
      WHERE household_members.household_id = household_invitations.household_id 
      AND household_members.profile_id = auth.uid()
      AND household_members.role = 'admin'
    )
  );

-- Función Segura para Aceptar una Invitación (RPC)
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token VARCHAR)
RETURNS UUID AS $$
DECLARE
  v_invite RECORD;
  v_user_email VARCHAR;
BEGIN
  -- 1. Buscar la invitación que coincida y no esté vencida ni aceptada
  SELECT * INTO v_invite
  FROM household_invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > now()
  FOR UPDATE; -- Bloqueo transaccional para evitar doble uso

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El código de invitación es inválido, ya fue usado o ha expirado.';
  END IF;

  -- (Opcional) Podemos validar que el email invitado coincida con el email del usuario
  -- SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  -- IF v_user_email != v_invite.email THEN
  --   RAISE EXCEPTION 'Esta invitación no fue enviada a tu correo.';
  -- END IF;

  -- 2. Insertar al usuario como miembro (role: member)
  INSERT INTO household_members (profile_id, household_id, role, status)
  VALUES (auth.uid(), v_invite.household_id, 'member', 'active');

  -- 3. Marcar la invitación como aceptada
  UPDATE household_invitations
  SET status = 'accepted'
  WHERE id = v_invite.id;

  RETURN v_invite.household_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
