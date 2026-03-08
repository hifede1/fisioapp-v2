-- ============================================================
-- Funciones para buscar y vincular pacientes al fisioterapeuta
-- ============================================================

-- ------------------------------------------------------------
-- buscar_paciente_por_email
-- Permite a un fisioterapeuta buscar un paciente por email
-- aunque todavía no esté vinculado (bypassa RLS).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION buscar_paciente_por_email(p_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fisio_id    UUID;
  v_profile     profiles%ROWTYPE;
  v_paciente    pacientes%ROWTYPE;
  v_ya_vinculado BOOLEAN := FALSE;
BEGIN
  IF get_user_role() != 'fisioterapeuta' THEN
    RAISE EXCEPTION 'Acceso denegado';
  END IF;

  SELECT id INTO v_fisio_id FROM fisioterapeutas WHERE profile_id = auth.uid();

  -- Buscar perfil exacto por email con rol paciente
  SELECT * INTO v_profile
  FROM profiles
  WHERE email = lower(trim(p_email)) AND role = 'paciente';

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Obtener registro en pacientes (puede que no exista si nunca se completó el onboarding)
  SELECT * INTO v_paciente FROM pacientes WHERE profile_id = v_profile.id;

  IF v_paciente.id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM fisioterapeuta_paciente
      WHERE fisioterapeuta_id = v_fisio_id AND paciente_id = v_paciente.id
    ) INTO v_ya_vinculado;
  END IF;

  RETURN json_build_object(
    'profile_id',      v_profile.id,
    'nombre',          v_profile.nombre,
    'apellidos',       v_profile.apellidos,
    'email',           v_profile.email,
    'telefono',        v_profile.telefono,
    'paciente_id',     v_paciente.id,
    'fecha_nacimiento', to_char(v_paciente.fecha_nacimiento, 'YYYY-MM-DD'),
    'historial_medico', v_paciente.historial_medico,
    'alergias',        v_paciente.alergias,
    'medicacion_actual', v_paciente.medicacion_actual,
    'ya_vinculado',    v_ya_vinculado
  );
END;
$$;

-- ------------------------------------------------------------
-- vincular_paciente
-- Crea el registro en `pacientes` si falta, guarda datos médicos
-- y crea (o reactiva) el vínculo fisioterapeuta_paciente.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION vincular_paciente(
  p_profile_id       UUID,
  p_fecha_nacimiento DATE    DEFAULT NULL,
  p_historial_medico TEXT    DEFAULT NULL,
  p_alergias         TEXT    DEFAULT NULL,
  p_medicacion_actual TEXT   DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fisio_id     UUID;
  v_paciente_id  UUID;
  v_ya_vinculado BOOLEAN;
BEGIN
  IF get_user_role() != 'fisioterapeuta' THEN
    RAISE EXCEPTION 'Acceso denegado';
  END IF;

  SELECT id INTO v_fisio_id FROM fisioterapeutas WHERE profile_id = auth.uid();
  IF v_fisio_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró el perfil de fisioterapeuta';
  END IF;

  -- Validar que el profile exista y sea paciente
  IF NOT EXISTS(SELECT 1 FROM profiles WHERE id = p_profile_id AND role = 'paciente') THEN
    RAISE EXCEPTION 'Perfil no encontrado o no es un paciente';
  END IF;

  -- Obtener o crear registro en pacientes
  SELECT id INTO v_paciente_id FROM pacientes WHERE profile_id = p_profile_id;

  IF v_paciente_id IS NULL THEN
    INSERT INTO pacientes (profile_id, fecha_nacimiento, historial_medico, alergias, medicacion_actual)
    VALUES (p_profile_id, p_fecha_nacimiento, p_historial_medico, p_alergias, p_medicacion_actual)
    RETURNING id INTO v_paciente_id;
  ELSE
    UPDATE pacientes SET
      fecha_nacimiento  = p_fecha_nacimiento,
      historial_medico  = p_historial_medico,
      alergias          = p_alergias,
      medicacion_actual = p_medicacion_actual,
      updated_at        = NOW()
    WHERE id = v_paciente_id;
  END IF;

  -- Crear o reactivar vínculo
  SELECT EXISTS(
    SELECT 1 FROM fisioterapeuta_paciente
    WHERE fisioterapeuta_id = v_fisio_id AND paciente_id = v_paciente_id
  ) INTO v_ya_vinculado;

  IF v_ya_vinculado THEN
    UPDATE fisioterapeuta_paciente
    SET activo = TRUE, fecha_fin = NULL
    WHERE fisioterapeuta_id = v_fisio_id AND paciente_id = v_paciente_id;
  ELSE
    INSERT INTO fisioterapeuta_paciente (fisioterapeuta_id, paciente_id)
    VALUES (v_fisio_id, v_paciente_id);
  END IF;

  RETURN json_build_object(
    'paciente_id',  v_paciente_id,
    'ya_vinculado', v_ya_vinculado
  );
END;
$$;
