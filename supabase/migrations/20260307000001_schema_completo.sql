-- ============================================================
-- FISIOAPP v2 - Esquema completo de base de datos
-- ============================================================

-- ============================================================
-- 1. EXTENSIONES
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 2. TIPOS ENUMERADOS
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'fisioterapeuta', 'paciente');
CREATE TYPE estado_cita AS ENUM ('pendiente', 'confirmada', 'completada', 'cancelada', 'no_asistio');
CREATE TYPE estado_tratamiento AS ENUM ('activo', 'completado', 'suspendido');
CREATE TYPE tipo_pago AS ENUM ('efectivo', 'tarjeta', 'transferencia', 'seguro');
CREATE TYPE estado_pago AS ENUM ('pendiente', 'pagado', 'parcial', 'cancelado');
CREATE TYPE dificultad_ejercicio AS ENUM ('basico', 'intermedio', 'avanzado');
CREATE TYPE tipo_nota AS ENUM ('general', 'evolucion', 'incidencia', 'alta');

-- ============================================================
-- 3. FUNCIÓN TRIGGER: updated_at automático
-- No referencia tablas → puede definirse antes que las tablas.
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 4. TABLAS, TRIGGERS E ÍNDICES
-- ============================================================

-- ------------------------------------------------------------
-- TABLA: profiles
-- Extiende auth.users. Un profile puede ser admin, fisioterapeuta o paciente.
-- ------------------------------------------------------------

CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role            user_role NOT NULL DEFAULT 'paciente',
  nombre          VARCHAR(100) NOT NULL,
  apellidos       VARCHAR(100) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  telefono        VARCHAR(20),
  foto_url        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ------------------------------------------------------------
-- TABLA: clinicas
-- ------------------------------------------------------------

CREATE TABLE public.clinicas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre          VARCHAR(200) NOT NULL,
  direccion       TEXT,
  telefono        VARCHAR(20),
  email           VARCHAR(255),
  logo_url        TEXT,
  activa          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER clinicas_updated_at
  BEFORE UPDATE ON public.clinicas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ------------------------------------------------------------
-- TABLA: fisioterapeutas
-- ------------------------------------------------------------

CREATE TABLE public.fisioterapeutas (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id          UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  clinica_id          UUID REFERENCES public.clinicas(id) ON DELETE SET NULL,
  numero_colegiado    VARCHAR(50),
  especialidades      TEXT[],
  biografia           TEXT,
  activo              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER fisioterapeutas_updated_at
  BEFORE UPDATE ON public.fisioterapeutas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_fisioterapeutas_profile ON public.fisioterapeutas(profile_id);
CREATE INDEX idx_fisioterapeutas_clinica ON public.fisioterapeutas(clinica_id);

-- ------------------------------------------------------------
-- TABLA: pacientes
-- ------------------------------------------------------------

CREATE TABLE public.pacientes (
  id                           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id                   UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  fecha_nacimiento             DATE,
  dni                          VARCHAR(20),
  direccion                    TEXT,
  contacto_emergencia_nombre   VARCHAR(200),
  contacto_emergencia_telefono VARCHAR(20),
  historial_medico             TEXT,
  alergias                     TEXT,
  medicacion_actual            TEXT,
  activo                       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER pacientes_updated_at
  BEFORE UPDATE ON public.pacientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_pacientes_profile ON public.pacientes(profile_id);

-- ------------------------------------------------------------
-- TABLA: fisioterapeuta_paciente
-- Relación muchos-a-muchos entre fisioterapeutas y pacientes.
-- ------------------------------------------------------------

CREATE TABLE public.fisioterapeuta_paciente (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fisioterapeuta_id UUID NOT NULL REFERENCES public.fisioterapeutas(id) ON DELETE CASCADE,
  paciente_id       UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  fecha_inicio      DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin         DATE,
  activo            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(fisioterapeuta_id, paciente_id)
);

CREATE INDEX idx_fp_fisioterapeuta ON public.fisioterapeuta_paciente(fisioterapeuta_id);
CREATE INDEX idx_fp_paciente       ON public.fisioterapeuta_paciente(paciente_id);

-- ------------------------------------------------------------
-- TABLA: disponibilidad
-- Horarios de disponibilidad semanal de cada fisioterapeuta.
-- ------------------------------------------------------------

CREATE TABLE public.disponibilidad (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fisioterapeuta_id UUID NOT NULL REFERENCES public.fisioterapeutas(id) ON DELETE CASCADE,
  dia_semana        SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=domingo, 6=sabado
  hora_inicio       TIME NOT NULL,
  hora_fin          TIME NOT NULL,
  activo            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT hora_valida CHECK (hora_fin > hora_inicio),
  UNIQUE(fisioterapeuta_id, dia_semana, hora_inicio)
);

CREATE INDEX idx_disponibilidad_fisioterapeuta ON public.disponibilidad(fisioterapeuta_id);

-- ------------------------------------------------------------
-- TABLA: citas
-- ------------------------------------------------------------

CREATE TABLE public.citas (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fisioterapeuta_id UUID NOT NULL REFERENCES public.fisioterapeutas(id) ON DELETE CASCADE,
  paciente_id       UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  clinica_id        UUID REFERENCES public.clinicas(id) ON DELETE SET NULL,
  fecha_hora        TIMESTAMPTZ NOT NULL,
  duracion_minutos  INTEGER NOT NULL DEFAULT 60 CHECK (duracion_minutos > 0),
  estado            estado_cita NOT NULL DEFAULT 'pendiente',
  motivo            TEXT,
  notas             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER citas_updated_at
  BEFORE UPDATE ON public.citas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_citas_fisioterapeuta ON public.citas(fisioterapeuta_id);
CREATE INDEX idx_citas_paciente       ON public.citas(paciente_id);
CREATE INDEX idx_citas_fecha          ON public.citas(fecha_hora);
CREATE INDEX idx_citas_estado         ON public.citas(estado);

-- ------------------------------------------------------------
-- TABLA: tratamientos
-- Plan de tratamiento de un paciente.
-- ------------------------------------------------------------

CREATE TABLE public.tratamientos (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id         UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  fisioterapeuta_id   UUID NOT NULL REFERENCES public.fisioterapeutas(id) ON DELETE RESTRICT,
  titulo              VARCHAR(200) NOT NULL,
  descripcion         TEXT,
  diagnostico         TEXT,
  objetivos           TEXT,
  estado              estado_tratamiento NOT NULL DEFAULT 'activo',
  fecha_inicio        DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin_estimada  DATE,
  fecha_fin_real      DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tratamientos_updated_at
  BEFORE UPDATE ON public.tratamientos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_tratamientos_paciente       ON public.tratamientos(paciente_id);
CREATE INDEX idx_tratamientos_fisioterapeuta ON public.tratamientos(fisioterapeuta_id);
CREATE INDEX idx_tratamientos_estado         ON public.tratamientos(estado);

-- ------------------------------------------------------------
-- TABLA: sesiones
-- Registro de cada sesión de terapia realizada.
-- ------------------------------------------------------------

CREATE TABLE public.sesiones (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cita_id           UUID REFERENCES public.citas(id) ON DELETE SET NULL,
  tratamiento_id    UUID REFERENCES public.tratamientos(id) ON DELETE SET NULL,
  fisioterapeuta_id UUID NOT NULL REFERENCES public.fisioterapeutas(id) ON DELETE RESTRICT,
  paciente_id       UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  fecha             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duracion_minutos  INTEGER CHECK (duracion_minutos > 0),
  notas_sesion      TEXT,
  evolucion         TEXT,
  dolor_inicio      SMALLINT CHECK (dolor_inicio BETWEEN 0 AND 10),
  dolor_fin         SMALLINT CHECK (dolor_fin BETWEEN 0 AND 10),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER sesiones_updated_at
  BEFORE UPDATE ON public.sesiones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_sesiones_fisioterapeuta ON public.sesiones(fisioterapeuta_id);
CREATE INDEX idx_sesiones_paciente       ON public.sesiones(paciente_id);
CREATE INDEX idx_sesiones_tratamiento    ON public.sesiones(tratamiento_id);
CREATE INDEX idx_sesiones_fecha          ON public.sesiones(fecha);

-- ------------------------------------------------------------
-- TABLA: ejercicios
-- Biblioteca de ejercicios (global y privada por fisioterapeuta).
-- ------------------------------------------------------------

CREATE TABLE public.ejercicios (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre            VARCHAR(200) NOT NULL,
  descripcion       TEXT,
  instrucciones     TEXT,
  categoria         VARCHAR(100),
  musculos_objetivo TEXT[],
  dificultad        dificultad_ejercicio,
  video_url         TEXT,
  imagen_url        TEXT,
  creado_por        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  publico           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER ejercicios_updated_at
  BEFORE UPDATE ON public.ejercicios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_ejercicios_categoria  ON public.ejercicios(categoria);
CREATE INDEX idx_ejercicios_creado_por ON public.ejercicios(creado_por);

-- ------------------------------------------------------------
-- TABLA: planes_ejercicios
-- Plan de ejercicios asignado a un paciente.
-- ------------------------------------------------------------

CREATE TABLE public.planes_ejercicios (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tratamiento_id    UUID REFERENCES public.tratamientos(id) ON DELETE SET NULL,
  paciente_id       UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  fisioterapeuta_id UUID NOT NULL REFERENCES public.fisioterapeutas(id) ON DELETE RESTRICT,
  nombre            VARCHAR(200) NOT NULL,
  descripcion       TEXT,
  fecha_inicio      DATE,
  fecha_fin         DATE,
  activo            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER planes_ejercicios_updated_at
  BEFORE UPDATE ON public.planes_ejercicios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_planes_paciente       ON public.planes_ejercicios(paciente_id);
CREATE INDEX idx_planes_fisioterapeuta ON public.planes_ejercicios(fisioterapeuta_id);

-- ------------------------------------------------------------
-- TABLA: plan_ejercicios_detalle
-- Ejercicios individuales dentro de un plan.
-- ------------------------------------------------------------

CREATE TABLE public.plan_ejercicios_detalle (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id           UUID NOT NULL REFERENCES public.planes_ejercicios(id) ON DELETE CASCADE,
  ejercicio_id      UUID NOT NULL REFERENCES public.ejercicios(id) ON DELETE RESTRICT,
  orden             INTEGER NOT NULL DEFAULT 1 CHECK (orden > 0),
  series            INTEGER CHECK (series > 0),
  repeticiones      INTEGER CHECK (repeticiones > 0),
  duracion_segundos INTEGER CHECK (duracion_segundos > 0),
  descanso_segundos INTEGER CHECK (descanso_segundos >= 0),
  notas             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plan_detalle_plan ON public.plan_ejercicios_detalle(plan_id);

-- ------------------------------------------------------------
-- TABLA: notas_clinicas
-- ------------------------------------------------------------

CREATE TABLE public.notas_clinicas (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id       UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  fisioterapeuta_id UUID NOT NULL REFERENCES public.fisioterapeutas(id) ON DELETE RESTRICT,
  sesion_id         UUID REFERENCES public.sesiones(id) ON DELETE SET NULL,
  tipo              tipo_nota NOT NULL DEFAULT 'general',
  contenido         TEXT NOT NULL,
  privada           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER notas_clinicas_updated_at
  BEFORE UPDATE ON public.notas_clinicas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_notas_paciente       ON public.notas_clinicas(paciente_id);
CREATE INDEX idx_notas_fisioterapeuta ON public.notas_clinicas(fisioterapeuta_id);

-- ------------------------------------------------------------
-- TABLA: pagos
-- ------------------------------------------------------------

CREATE TABLE public.pagos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  cita_id     UUID REFERENCES public.citas(id) ON DELETE SET NULL,
  monto       DECIMAL(10, 2) NOT NULL CHECK (monto >= 0),
  tipo_pago   tipo_pago NOT NULL DEFAULT 'efectivo',
  estado      estado_pago NOT NULL DEFAULT 'pendiente',
  concepto    VARCHAR(300),
  fecha_pago  TIMESTAMPTZ,
  notas       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER pagos_updated_at
  BEFORE UPDATE ON public.pagos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_pagos_paciente ON public.pagos(paciente_id);
CREATE INDEX idx_pagos_estado   ON public.pagos(estado);

-- ------------------------------------------------------------
-- TABLA: notificaciones
-- ------------------------------------------------------------

CREATE TABLE public.notificaciones (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  titulo     VARCHAR(200) NOT NULL,
  mensaje    TEXT NOT NULL,
  tipo       VARCHAR(50) NOT NULL DEFAULT 'info',
  leida      BOOLEAN NOT NULL DEFAULT FALSE,
  datos      JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notificaciones_user  ON public.notificaciones(user_id);
CREATE INDEX idx_notificaciones_leida ON public.notificaciones(user_id, leida);

-- ============================================================
-- 5. TRIGGER DE AUTH: crear profile al registrar usuario
-- Debe estar DESPUÉS de CREATE TABLE profiles.
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre, apellidos, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', ''),
    COALESCE(NEW.raw_user_meta_data->>'apellidos', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'paciente')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 6. FUNCIONES HELPER PARA RLS
-- Deben estar DESPUÉS de que existan las tablas que referencian
-- (profiles, fisioterapeutas, pacientes).
-- LANGUAGE sql valida las referencias en el momento de la creación.
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_fisioterapeuta_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM public.fisioterapeutas WHERE profile_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_paciente_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM public.pacientes WHERE profile_id = auth.uid();
$$;

-- ============================================================
-- 7. HABILITAR ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinicas                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fisioterapeutas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fisioterapeuta_paciente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disponibilidad          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tratamientos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesiones                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ejercicios              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planes_ejercicios       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_ejercicios_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_clinicas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones          ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. POLÍTICAS RLS
-- ============================================================

-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_select_fisioterapeuta"
  ON public.profiles FOR SELECT
  USING (
    get_user_role() = 'fisioterapeuta'
    AND EXISTS (
      SELECT 1 FROM public.fisioterapeuta_paciente fp
      JOIN public.fisioterapeutas f ON f.id = fp.fisioterapeuta_id
      JOIN public.pacientes p       ON p.id = fp.paciente_id
      WHERE f.profile_id = auth.uid()
        AND p.profile_id = profiles.id
        AND fp.activo = TRUE
    )
  );

CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (get_user_role() = 'admin');

-- El usuario puede actualizar su propio perfil pero no cambiar el rol
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (get_user_role() = 'admin');

-- ------------------------------------------------------------
-- clinicas
-- ------------------------------------------------------------

CREATE POLICY "clinicas_select_all"
  ON public.clinicas FOR SELECT
  USING (auth.uid() IS NOT NULL AND activa = TRUE);

CREATE POLICY "clinicas_insert_admin"
  ON public.clinicas FOR INSERT
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "clinicas_update_admin"
  ON public.clinicas FOR UPDATE
  USING (get_user_role() = 'admin');

CREATE POLICY "clinicas_delete_admin"
  ON public.clinicas FOR DELETE
  USING (get_user_role() = 'admin');

-- ------------------------------------------------------------
-- fisioterapeutas
-- ------------------------------------------------------------

CREATE POLICY "fisioterapeutas_select_authenticated"
  ON public.fisioterapeutas FOR SELECT
  USING (auth.uid() IS NOT NULL AND activo = TRUE);

CREATE POLICY "fisioterapeutas_update_own"
  ON public.fisioterapeutas FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "fisioterapeutas_all_admin"
  ON public.fisioterapeutas FOR ALL
  USING (get_user_role() = 'admin');

-- ------------------------------------------------------------
-- pacientes
-- ------------------------------------------------------------

CREATE POLICY "pacientes_select_own"
  ON public.pacientes FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "pacientes_select_fisioterapeuta"
  ON public.pacientes FOR SELECT
  USING (
    get_user_role() = 'fisioterapeuta'
    AND EXISTS (
      SELECT 1 FROM public.fisioterapeuta_paciente fp
      JOIN public.fisioterapeutas f ON f.id = fp.fisioterapeuta_id
      WHERE f.profile_id = auth.uid()
        AND fp.paciente_id = pacientes.id
        AND fp.activo = TRUE
    )
  );

CREATE POLICY "pacientes_select_admin"
  ON public.pacientes FOR SELECT
  USING (get_user_role() = 'admin');

CREATE POLICY "pacientes_update_own"
  ON public.pacientes FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "pacientes_update_fisioterapeuta"
  ON public.pacientes FOR UPDATE
  USING (
    get_user_role() = 'fisioterapeuta'
    AND EXISTS (
      SELECT 1 FROM public.fisioterapeuta_paciente fp
      JOIN public.fisioterapeutas f ON f.id = fp.fisioterapeuta_id
      WHERE f.profile_id = auth.uid()
        AND fp.paciente_id = pacientes.id
        AND fp.activo = TRUE
    )
  );

CREATE POLICY "pacientes_all_admin"
  ON public.pacientes FOR ALL
  USING (get_user_role() = 'admin');

-- ------------------------------------------------------------
-- fisioterapeuta_paciente
-- ------------------------------------------------------------

CREATE POLICY "fp_select_fisioterapeuta"
  ON public.fisioterapeuta_paciente FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.fisioterapeutas f
      WHERE f.id = fisioterapeuta_id AND f.profile_id = auth.uid()
    )
  );

CREATE POLICY "fp_select_paciente"
  ON public.fisioterapeuta_paciente FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pacientes p
      WHERE p.id = paciente_id AND p.profile_id = auth.uid()
    )
  );

CREATE POLICY "fp_insert_fisioterapeuta"
  ON public.fisioterapeuta_paciente FOR INSERT
  WITH CHECK (
    get_user_role() = 'fisioterapeuta'
    AND EXISTS (
      SELECT 1 FROM public.fisioterapeutas f
      WHERE f.id = fisioterapeuta_id AND f.profile_id = auth.uid()
    )
  );

CREATE POLICY "fp_all_admin"
  ON public.fisioterapeuta_paciente FOR ALL
  USING (get_user_role() = 'admin');

-- ------------------------------------------------------------
-- disponibilidad
-- ------------------------------------------------------------

CREATE POLICY "disponibilidad_select_all"
  ON public.disponibilidad FOR SELECT
  USING (auth.uid() IS NOT NULL AND activo = TRUE);

CREATE POLICY "disponibilidad_manage_own"
  ON public.disponibilidad FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.fisioterapeutas f
      WHERE f.id = fisioterapeuta_id AND f.profile_id = auth.uid()
    )
  );

CREATE POLICY "disponibilidad_all_admin"
  ON public.disponibilidad FOR ALL
  USING (get_user_role() = 'admin');

-- ------------------------------------------------------------
-- citas
-- ------------------------------------------------------------

CREATE POLICY "citas_select_paciente"
  ON public.citas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pacientes p
      WHERE p.id = paciente_id AND p.profile_id = auth.uid()
    )
  );

CREATE POLICY "citas_select_fisioterapeuta"
  ON public.citas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.fisioterapeutas f
      WHERE f.id = fisioterapeuta_id AND f.profile_id = auth.uid()
    )
  );

CREATE POLICY "citas_select_admin"
  ON public.citas FOR SELECT
  USING (get_user_role() = 'admin');

CREATE POLICY "citas_insert_fisioterapeuta"
  ON public.citas FOR INSERT
  WITH CHECK (
    get_user_role() = 'fisioterapeuta'
    AND EXISTS (
      SELECT 1 FROM public.fisioterapeutas f
      WHERE f.id = fisioterapeuta_id AND f.profile_id = auth.uid()
    )
  );

CREATE POLICY "citas_insert_paciente"
  ON public.citas FOR INSERT
  WITH CHECK (
    get_user_role() = 'paciente'
    AND EXISTS (
      SELECT 1 FROM public.pacientes p
      WHERE p.id = paciente_id AND p.profile_id = auth.uid()
    )
  );

CREATE POLICY "citas_update_fisioterapeuta"
  ON public.citas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.fisioterapeutas f
      WHERE f.id = fisioterapeuta_id AND f.profile_id = auth.uid()
    )
  );

-- Pacientes solo pueden cancelar sus propias citas
CREATE POLICY "citas_update_paciente"
  ON public.citas FOR UPDATE
  USING (
    get_user_role() = 'paciente'
    AND EXISTS (
      SELECT 1 FROM public.pacientes p
      WHERE p.id = paciente_id AND p.profile_id = auth.uid()
    )
  )
  WITH CHECK (estado = 'cancelada');

CREATE POLICY "citas_all_admin"
  ON public.citas FOR ALL
  USING (get_user_role() = 'admin');

-- ------------------------------------------------------------
-- tratamientos
-- ------------------------------------------------------------

CREATE POLICY "tratamientos_select_paciente"
  ON public.tratamientos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pacientes p
      WHERE p.id = paciente_id AND p.profile_id = auth.uid()
    )
  );

CREATE POLICY "tratamientos_select_fisioterapeuta"
  ON public.tratamientos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.fisioterapeutas f
      WHERE f.id = fisioterapeuta_id AND f.profile_id = auth.uid()
    )
  );

CREATE POLICY "tratamientos_select_admin"
  ON public.tratamientos FOR SELECT
  USING (get_user_role() = 'admin');

CREATE POLICY "tratamientos_insert_fisioterapeuta"
  ON public.tratamientos FOR INSERT
  WITH CHECK (
    get_user_role() = 'fisioterapeuta'
    AND EXISTS (
      SELECT 1 FROM public.fisioterapeutas f
      WHERE f.id = fisioterapeuta_id AND f.profile_id = auth.uid()
    )
  );

CREATE POLICY "tratamientos_update_fisioterapeuta"
  ON public.tratamientos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.fisioterapeutas f
      WHERE f.id = fisioterapeuta_id AND f.profile_id = auth.uid()
    )
  );

CREATE POLICY "tratamientos_all_admin"
  ON public.tratamientos FOR ALL
  USING (get_user_role() = 'admin');

-- ------------------------------------------------------------
-- sesiones
-- ------------------------------------------------------------

CREATE POLICY "sesiones_select_paciente"
  ON public.sesiones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pacientes p
      WHERE p.id = paciente_id AND p.profile_id = auth.uid()
    )
  );

CREATE POLICY "sesiones_select_fisioterapeuta"
  ON public.sesiones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.fisioterapeutas f
      WHERE f.id = fisioterapeuta_id AND f.profile_id = auth.uid()
    )
  );

CREATE POLICY "sesiones_select_admin"
  ON public.sesiones FOR SELECT
  USING (get_user_role() = 'admin');

CREATE POLICY "sesiones_insert_fisioterapeuta"
  ON public.sesiones FOR INSERT
  WITH CHECK (
    get_user_role() = 'fisioterapeuta'
    AND EXISTS (
      SELECT 1 FROM public.fisioterapeutas f
      WHERE f.id = fisioterapeuta_id AND f.profile_id = auth.uid()
    )
  );

CREATE POLICY "sesiones_update_fisioterapeuta"
  ON public.sesiones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.fisioterapeutas f
      WHERE f.id = fisioterapeuta_id AND f.profile_id = auth.uid()
    )
  );

CREATE POLICY "sesiones_all_admin"
  ON public.sesiones FOR ALL
  USING (get_user_role() = 'admin');

-- ------------------------------------------------------------
-- ejercicios
-- ------------------------------------------------------------

CREATE POLICY "ejercicios_select_publicos"
  ON public.ejercicios FOR SELECT
  USING (auth.uid() IS NOT NULL AND publico = TRUE);

CREATE POLICY "ejercicios_select_own"
  ON public.ejercicios FOR SELECT
  USING (creado_por = auth.uid());

CREATE POLICY "ejercicios_insert_fisioterapeuta"
  ON public.ejercicios FOR INSERT
  WITH CHECK (
    get_user_role() IN ('fisioterapeuta', 'admin')
    AND creado_por = auth.uid()
  );

CREATE POLICY "ejercicios_update_own"
  ON public.ejercicios FOR UPDATE
  USING (creado_por = auth.uid());

CREATE POLICY "ejercicios_delete_own"
  ON public.ejercicios FOR DELETE
  USING (creado_por = auth.uid());

CREATE POLICY "ejercicios_all_admin"
  ON public.ejercicios FOR ALL
  USING (get_user_role() = 'admin');

-- ------------------------------------------------------------
-- planes_ejercicios
-- ------------------------------------------------------------

CREATE POLICY "planes_select_paciente"
  ON public.planes_ejercicios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pacientes p
      WHERE p.id = paciente_id AND p.profile_id = auth.uid()
    )
  );

CREATE POLICY "planes_select_fisioterapeuta"
  ON public.planes_ejercicios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.fisioterapeutas f
      WHERE f.id = fisioterapeuta_id AND f.profile_id = auth.uid()
    )
  );

CREATE POLICY "planes_select_admin"
  ON public.planes_ejercicios FOR SELECT
  USING (get_user_role() = 'admin');

CREATE POLICY "planes_insert_fisioterapeuta"
  ON public.planes_ejercicios FOR INSERT
  WITH CHECK (
    get_user_role() = 'fisioterapeuta'
    AND EXISTS (
      SELECT 1 FROM public.fisioterapeutas f
      WHERE f.id = fisioterapeuta_id AND f.profile_id = auth.uid()
    )
  );

CREATE POLICY "planes_update_fisioterapeuta"
  ON public.planes_ejercicios FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.fisioterapeutas f
      WHERE f.id = fisioterapeuta_id AND f.profile_id = auth.uid()
    )
  );

CREATE POLICY "planes_delete_fisioterapeuta"
  ON public.planes_ejercicios FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.fisioterapeutas f
      WHERE f.id = fisioterapeuta_id AND f.profile_id = auth.uid()
    )
  );

CREATE POLICY "planes_all_admin"
  ON public.planes_ejercicios FOR ALL
  USING (get_user_role() = 'admin');

-- ------------------------------------------------------------
-- plan_ejercicios_detalle
-- ------------------------------------------------------------

CREATE POLICY "plan_detalle_select"
  ON public.plan_ejercicios_detalle FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.planes_ejercicios pe
      JOIN public.pacientes p       ON p.id = pe.paciente_id
      JOIN public.fisioterapeutas f ON f.id = pe.fisioterapeuta_id
      WHERE pe.id = plan_id
        AND (
          p.profile_id = auth.uid()
          OR f.profile_id = auth.uid()
          OR get_user_role() = 'admin'
        )
    )
  );

CREATE POLICY "plan_detalle_manage_fisioterapeuta"
  ON public.plan_ejercicios_detalle FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.planes_ejercicios pe
      JOIN public.fisioterapeutas f ON f.id = pe.fisioterapeuta_id
      WHERE pe.id = plan_id AND f.profile_id = auth.uid()
    )
  );

CREATE POLICY "plan_detalle_all_admin"
  ON public.plan_ejercicios_detalle FOR ALL
  USING (get_user_role() = 'admin');

-- ------------------------------------------------------------
-- notas_clinicas
-- ------------------------------------------------------------

CREATE POLICY "notas_select_fisioterapeuta"
  ON public.notas_clinicas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.fisioterapeutas f
      WHERE f.id = fisioterapeuta_id AND f.profile_id = auth.uid()
    )
  );

-- Paciente solo ve notas no privadas
CREATE POLICY "notas_select_paciente"
  ON public.notas_clinicas FOR SELECT
  USING (
    privada = FALSE
    AND EXISTS (
      SELECT 1 FROM public.pacientes p
      WHERE p.id = paciente_id AND p.profile_id = auth.uid()
    )
  );

CREATE POLICY "notas_select_admin"
  ON public.notas_clinicas FOR SELECT
  USING (get_user_role() = 'admin');

CREATE POLICY "notas_insert_fisioterapeuta"
  ON public.notas_clinicas FOR INSERT
  WITH CHECK (
    get_user_role() = 'fisioterapeuta'
    AND EXISTS (
      SELECT 1 FROM public.fisioterapeutas f
      WHERE f.id = fisioterapeuta_id AND f.profile_id = auth.uid()
    )
  );

CREATE POLICY "notas_update_fisioterapeuta"
  ON public.notas_clinicas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.fisioterapeutas f
      WHERE f.id = fisioterapeuta_id AND f.profile_id = auth.uid()
    )
  );

CREATE POLICY "notas_all_admin"
  ON public.notas_clinicas FOR ALL
  USING (get_user_role() = 'admin');

-- ------------------------------------------------------------
-- pagos
-- ------------------------------------------------------------

CREATE POLICY "pagos_select_paciente"
  ON public.pagos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pacientes p
      WHERE p.id = paciente_id AND p.profile_id = auth.uid()
    )
  );

CREATE POLICY "pagos_select_fisioterapeuta"
  ON public.pagos FOR SELECT
  USING (
    get_user_role() = 'fisioterapeuta'
    AND (
      cita_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.citas c
        JOIN public.fisioterapeutas f ON f.id = c.fisioterapeuta_id
        WHERE c.id = cita_id AND f.profile_id = auth.uid()
      )
    )
  );

CREATE POLICY "pagos_select_admin"
  ON public.pagos FOR SELECT
  USING (get_user_role() = 'admin');

CREATE POLICY "pagos_insert_fisioterapeuta"
  ON public.pagos FOR INSERT
  WITH CHECK (get_user_role() IN ('fisioterapeuta', 'admin'));

CREATE POLICY "pagos_update_fisioterapeuta"
  ON public.pagos FOR UPDATE
  USING (get_user_role() IN ('fisioterapeuta', 'admin'));

CREATE POLICY "pagos_all_admin"
  ON public.pagos FOR ALL
  USING (get_user_role() = 'admin');

-- ------------------------------------------------------------
-- notificaciones
-- ------------------------------------------------------------

CREATE POLICY "notificaciones_select_own"
  ON public.notificaciones FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notificaciones_update_own"
  ON public.notificaciones FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notificaciones_insert_admin"
  ON public.notificaciones FOR INSERT
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "notificaciones_delete_own"
  ON public.notificaciones FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "notificaciones_all_admin"
  ON public.notificaciones FOR ALL
  USING (get_user_role() = 'admin');

-- ============================================================
-- 9. VISTAS
-- Heredan las políticas RLS de las tablas base.
-- ============================================================

CREATE VIEW public.v_fisioterapeutas AS
  SELECT
    f.id,
    f.profile_id,
    p.nombre,
    p.apellidos,
    p.email,
    p.telefono,
    p.foto_url,
    f.clinica_id,
    c.nombre AS clinica_nombre,
    f.numero_colegiado,
    f.especialidades,
    f.biografia,
    f.activo
  FROM public.fisioterapeutas f
  JOIN public.profiles p ON p.id = f.profile_id
  LEFT JOIN public.clinicas c ON c.id = f.clinica_id;

CREATE VIEW public.v_pacientes AS
  SELECT
    pa.id,
    pa.profile_id,
    p.nombre,
    p.apellidos,
    p.email,
    p.telefono,
    p.foto_url,
    pa.fecha_nacimiento,
    pa.dni,
    pa.direccion,
    pa.contacto_emergencia_nombre,
    pa.contacto_emergencia_telefono,
    pa.alergias,
    pa.medicacion_actual,
    pa.activo
  FROM public.pacientes pa
  JOIN public.profiles p ON p.id = pa.profile_id;

CREATE VIEW public.v_citas AS
  SELECT
    ci.id,
    ci.fecha_hora,
    ci.duracion_minutos,
    ci.estado,
    ci.motivo,
    ci.notas,
    ci.clinica_id,
    cl.nombre AS clinica_nombre,
    ci.fisioterapeuta_id,
    fp.nombre    AS fisioterapeuta_nombre,
    fp.apellidos AS fisioterapeuta_apellidos,
    ci.paciente_id,
    pp.nombre    AS paciente_nombre,
    pp.apellidos AS paciente_apellidos,
    ci.created_at
  FROM public.citas ci
  JOIN public.fisioterapeutas f  ON f.id  = ci.fisioterapeuta_id
  JOIN public.profiles fp        ON fp.id = f.profile_id
  JOIN public.pacientes pa       ON pa.id = ci.paciente_id
  JOIN public.profiles pp        ON pp.id = pa.profile_id
  LEFT JOIN public.clinicas cl   ON cl.id = ci.clinica_id;

-- ============================================================
-- STORAGE BUCKETS
-- Crear desde el dashboard de Supabase o con service_role:
--   - 'avatars'    → fotos de perfil (público)
--   - 'documentos' → documentos clínicos (privado)
--   - 'ejercicios' → imágenes/videos de ejercicios (público)
-- ============================================================
