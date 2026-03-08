-- ============================================================
-- Función para que un fisioterapeuta registre un paciente nuevo
-- Crea el usuario en auth.users (el trigger handle_new_user
-- genera el profile automáticamente), el registro en pacientes
-- y el vínculo fisioterapeuta_paciente.
-- ============================================================

CREATE OR REPLACE FUNCTION crear_paciente_nuevo(
  p_nombre           TEXT,
  p_apellidos        TEXT,
  p_email            TEXT,
  p_telefono         TEXT    DEFAULT NULL,
  p_fecha_nacimiento DATE    DEFAULT NULL,
  p_historial_medico TEXT    DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fisio_id    UUID;
  v_user_id     UUID;
  v_paciente_id UUID;
  v_email_norm  TEXT;
  v_instance_id UUID;
BEGIN
  -- Solo fisioterapeutas pueden registrar pacientes
  IF get_user_role() != 'fisioterapeuta' THEN
    RAISE EXCEPTION 'Acceso denegado';
  END IF;

  SELECT id INTO v_fisio_id FROM fisioterapeutas WHERE profile_id = auth.uid();
  IF v_fisio_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró el perfil de fisioterapeuta';
  END IF;

  v_email_norm := lower(trim(p_email));

  -- Verificar que el email no esté ya en uso
  IF EXISTS(SELECT 1 FROM auth.users WHERE email = v_email_norm) THEN
    RAISE EXCEPTION 'Ya existe un usuario registrado con el email %', v_email_norm;
  END IF;

  -- Obtener instance_id del proyecto (herencia de usuarios existentes)
  SELECT instance_id INTO v_instance_id FROM auth.users LIMIT 1;
  IF v_instance_id IS NULL THEN
    v_instance_id := '00000000-0000-0000-0000-000000000000';
  END IF;

  -- Crear usuario en auth.users
  -- encrypted_password NULL → el paciente deberá usar "Olvidé mi contraseña"
  -- email_confirmed_at NOW() → la cuenta queda activa inmediatamente
  v_user_id := gen_random_uuid();

  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    raw_user_meta_data,
    raw_app_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    is_sso_user
  ) VALUES (
    v_user_id,
    v_instance_id,
    'authenticated',
    'authenticated',
    v_email_norm,
    NULL,
    NOW(),          -- confirmado: puede acceder con "Olvidé mi contraseña"
    NOW(),
    jsonb_build_object(
      'nombre',    p_nombre,
      'apellidos', p_apellidos,
      'role',      'paciente'
    ),
    '{"provider":"email","providers":["email"]}'::jsonb,
    FALSE,
    NOW(),
    NOW(),
    FALSE
  );
  -- El trigger handle_new_user crea public.profiles automáticamente

  -- Actualizar teléfono en el profile si se proporcionó
  IF p_telefono IS NOT NULL AND trim(p_telefono) != '' THEN
    UPDATE public.profiles SET telefono = trim(p_telefono) WHERE id = v_user_id;
  END IF;

  -- Crear registro en pacientes con los datos médicos iniciales
  INSERT INTO public.pacientes (profile_id, fecha_nacimiento, historial_medico)
  VALUES (v_user_id, p_fecha_nacimiento, NULLIF(trim(p_historial_medico), ''))
  RETURNING id INTO v_paciente_id;

  -- Crear vínculo fisioterapeuta_paciente
  INSERT INTO public.fisioterapeuta_paciente (fisioterapeuta_id, paciente_id)
  VALUES (v_fisio_id, v_paciente_id);

  RETURN json_build_object(
    'user_id',     v_user_id,
    'paciente_id', v_paciente_id,
    'nombre',      p_nombre,
    'apellidos',   p_apellidos,
    'email',       v_email_norm
  );
END;
$$;
