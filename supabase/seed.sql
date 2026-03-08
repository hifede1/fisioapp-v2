-- ============================================================
-- FISIOAPP v2 - Datos de prueba (seed)
-- ============================================================
-- Ejecutar en: Supabase SQL Editor (rol postgres / service_role)
-- Hoy = CURRENT_DATE en el momento de ejecución
--
-- CREDENCIALES DE PRUEBA (todos con la misma contraseña):
--   Fisio 1:     ana.garcia@fisiosalud.es   /  Password123!
--   Fisio 2:     carlos.ruiz@fisiosalud.es  /  Password123!
--   Paciente 1:  maria.fernandez@email.com  /  Password123!
--   Paciente 2:  javier.moreno@email.com    /  Password123!
--   Paciente 3:  laura.sanchez@email.com    /  Password123!
-- ============================================================

DO $$
DECLARE
  -- ── Clínica ──────────────────────────────────────────────
  v_clinica_id  UUID := 'a1000000-0000-0000-0000-000000000001';

  -- ── Profiles / auth.users ────────────────────────────────
  v_p_fisio1    UUID := 'b1000000-0000-0000-0000-000000000001';
  v_p_fisio2    UUID := 'b2000000-0000-0000-0000-000000000002';
  v_p_pac1      UUID := 'c1000000-0000-0000-0000-000000000001';
  v_p_pac2      UUID := 'c2000000-0000-0000-0000-000000000002';
  v_p_pac3      UUID := 'c3000000-0000-0000-0000-000000000003';

  -- ── Fisioterapeutas ──────────────────────────────────────
  v_fisio1      UUID := 'd1000000-0000-0000-0000-000000000001';
  v_fisio2      UUID := 'd2000000-0000-0000-0000-000000000002';

  -- ── Pacientes ────────────────────────────────────────────
  v_pac1        UUID := 'e1000000-0000-0000-0000-000000000001';
  v_pac2        UUID := 'e2000000-0000-0000-0000-000000000002';
  v_pac3        UUID := 'e3000000-0000-0000-0000-000000000003';

  -- ── Ejercicios ───────────────────────────────────────────
  v_ej1         UUID := 'f1000000-0000-0000-0000-000000000001';
  v_ej2         UUID := 'f2000000-0000-0000-0000-000000000002';
  v_ej3         UUID := 'f3000000-0000-0000-0000-000000000003';
  v_ej4         UUID := 'f4000000-0000-0000-0000-000000000004';
  v_ej5         UUID := 'f5000000-0000-0000-0000-000000000005';
  v_ej6         UUID := 'f6000000-0000-0000-0000-000000000006';

  -- ── Tratamientos ─────────────────────────────────────────
  v_trat1       UUID := '00000001-0000-0000-0000-000000000001';
  v_trat2       UUID := '00000001-0000-0000-0000-000000000002';
  v_trat3       UUID := '00000001-0000-0000-0000-000000000003';

  -- ── Planes de ejercicios ──────────────────────────────────
  v_plan1       UUID := '00000002-0000-0000-0000-000000000001';
  v_plan2       UUID := '00000002-0000-0000-0000-000000000002';
  v_plan3       UUID := '00000002-0000-0000-0000-000000000003';

  -- ── Citas ────────────────────────────────────────────────
  v_cita_ant1   UUID := '00000003-0000-0000-0000-000000000001';
  v_cita_ant2   UUID := '00000003-0000-0000-0000-000000000002';
  v_cita_ant3   UUID := '00000003-0000-0000-0000-000000000003';
  v_cita_hoy1   UUID := '00000003-0000-0000-0000-000000000004';
  v_cita_hoy2   UUID := '00000003-0000-0000-0000-000000000005';
  v_cita_hoy3   UUID := '00000003-0000-0000-0000-000000000006';
  v_cita_man1   UUID := '00000003-0000-0000-0000-000000000007';
  v_cita_man2   UUID := '00000003-0000-0000-0000-000000000008';
  v_cita_fut1   UUID := '00000003-0000-0000-0000-000000000009';
  v_cita_fut2   UUID := '00000003-0000-0000-0000-00000000000a';

  -- ── Sesiones ─────────────────────────────────────────────
  v_ses1        UUID := '00000004-0000-0000-0000-000000000001';
  v_ses2        UUID := '00000004-0000-0000-0000-000000000002';
  v_ses3        UUID := '00000004-0000-0000-0000-000000000003';
  v_ses4        UUID := '00000004-0000-0000-0000-000000000004';
  v_ses5        UUID := '00000004-0000-0000-0000-000000000005';

  lf TEXT := chr(10);  -- salto de línea

BEGIN

-- ============================================================
-- GUARDIA DE IDEMPOTENCIA
-- ============================================================
IF EXISTS (SELECT 1 FROM public.clinicas WHERE id = v_clinica_id) THEN
  RAISE NOTICE 'Los datos de prueba ya existen. Ejecuta el bloque LIMPIEZA primero si quieres reinsertar.';
  RETURN;
END IF;

-- ============================================================
-- 1. CLÍNICA
-- ============================================================

INSERT INTO public.clinicas (id, nombre, direccion, telefono, email)
VALUES (
  v_clinica_id,
  'Clínica FisioSalud Madrid',
  'Calle Gran Vía 45, 2ª planta, 28013 Madrid',
  '910 234 567',
  'info@fisiosalud.es'
);

-- ============================================================
-- 2. USUARIOS EN AUTH.USERS
-- El trigger handle_new_user() creará los profiles automáticamente.
-- raw_app_meta_data es necesario para que el login por email funcione.
-- ============================================================

INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password, email_confirmed_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) VALUES
(
  v_p_fisio1, '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'ana.garcia@fisiosalud.es',
  crypt('Password123!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"nombre":"Ana","apellidos":"García López","role":"fisioterapeuta"}'::jsonb
),
(
  v_p_fisio2, '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'carlos.ruiz@fisiosalud.es',
  crypt('Password123!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"nombre":"Carlos","apellidos":"Ruiz Martínez","role":"fisioterapeuta"}'::jsonb
),
(
  v_p_pac1, '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'maria.fernandez@email.com',
  crypt('Password123!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"nombre":"María","apellidos":"Fernández Torres","role":"paciente"}'::jsonb
),
(
  v_p_pac2, '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'javier.moreno@email.com',
  crypt('Password123!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"nombre":"Javier","apellidos":"Moreno Santos","role":"paciente"}'::jsonb
),
(
  v_p_pac3, '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'laura.sanchez@email.com',
  crypt('Password123!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"nombre":"Laura","apellidos":"Sánchez Gómez","role":"paciente"}'::jsonb
);

-- ============================================================
-- 2b. IDENTIDADES EN AUTH.IDENTITIES
-- Sin esta tabla los usuarios no pueden hacer login por email/contraseña.
-- identity_data debe incluir "sub" (= user id) y "email".
-- ============================================================

INSERT INTO auth.identities (
  id, user_id, provider, identity_data,
  last_sign_in_at, created_at, updated_at
) VALUES
(
  v_p_fisio1, v_p_fisio1, 'email',
  jsonb_build_object('sub', v_p_fisio1::text, 'email', 'ana.garcia@fisiosalud.es', 'email_verified', true),
  NOW(), NOW(), NOW()
),
(
  v_p_fisio2, v_p_fisio2, 'email',
  jsonb_build_object('sub', v_p_fisio2::text, 'email', 'carlos.ruiz@fisiosalud.es', 'email_verified', true),
  NOW(), NOW(), NOW()
),
(
  v_p_pac1, v_p_pac1, 'email',
  jsonb_build_object('sub', v_p_pac1::text, 'email', 'maria.fernandez@email.com', 'email_verified', true),
  NOW(), NOW(), NOW()
),
(
  v_p_pac2, v_p_pac2, 'email',
  jsonb_build_object('sub', v_p_pac2::text, 'email', 'javier.moreno@email.com', 'email_verified', true),
  NOW(), NOW(), NOW()
),
(
  v_p_pac3, v_p_pac3, 'email',
  jsonb_build_object('sub', v_p_pac3::text, 'email', 'laura.sanchez@email.com', 'email_verified', true),
  NOW(), NOW(), NOW()
);

-- ============================================================
-- 3. COMPLETAR PROFILES (teléfono, no cubierto por el trigger)
-- ============================================================

UPDATE public.profiles SET telefono = '612 345 678' WHERE id = v_p_fisio1;
UPDATE public.profiles SET telefono = '623 456 789' WHERE id = v_p_fisio2;
UPDATE public.profiles SET telefono = '634 567 890' WHERE id = v_p_pac1;
UPDATE public.profiles SET telefono = '645 678 901' WHERE id = v_p_pac2;
UPDATE public.profiles SET telefono = '656 789 012' WHERE id = v_p_pac3;

-- ============================================================
-- 4. FISIOTERAPEUTAS
-- ============================================================

INSERT INTO public.fisioterapeutas
  (id, profile_id, clinica_id, numero_colegiado, especialidades, biografia)
VALUES
(
  v_fisio1, v_p_fisio1, v_clinica_id,
  'MAD-12345',
  ARRAY['Fisioterapia musculoesquelética','Tratamiento del dolor lumbar','Pilates terapéutico'],
  'Fisioterapeuta con más de 10 años de experiencia especializada en el tratamiento de la columna vertebral y patologías musculoesqueléticas. Máster en Fisioterapia del Deporte por la Universidad Complutense de Madrid.'
),
(
  v_fisio2, v_p_fisio2, v_clinica_id,
  'MAD-67890',
  ARRAY['Fisioterapia deportiva','Lesiones de rodilla','Readaptación funcional'],
  'Especialista en fisioterapia deportiva y readaptación de lesiones. Ha trabajado con equipos de fútbol y atletismo de élite. Formación en osteopatía y terapia manual avanzada.'
);

-- ============================================================
-- 5. PACIENTES
-- ============================================================

INSERT INTO public.pacientes (
  id, profile_id,
  fecha_nacimiento, dni, direccion,
  contacto_emergencia_nombre, contacto_emergencia_telefono,
  historial_medico, alergias, medicacion_actual
) VALUES
(
  v_pac1, v_p_pac1,
  '1985-04-12', '45678901A', 'Calle Alcalá 78, 3ºB, 28009 Madrid',
  'Pedro Fernández (marido)', '677 111 222',
  'Lumbalgia crónica desde 2020. Intervenida de hernia discal L4-L5 en 2022. Sin otras patologías relevantes.',
  'Ibuprofeno (reacción leve)',
  'Omeprazol 20 mg (1 vez/día)'
),
(
  v_pac2, v_p_pac2,
  '1992-09-28', '56789012B', 'Avenida de América 23, 5ºA, 28028 Madrid',
  'Carmen Santos (madre)', '688 333 444',
  'Rotura parcial del ligamento cruzado anterior (LCA) rodilla derecha, diciembre 2025. Tratamiento conservador. Practicante de fútbol amateur.',
  'Ninguna conocida',
  'Diclofenaco gel (tópico, según necesidad)'
),
(
  v_pac3, v_p_pac3,
  '1978-11-05', '67890123C', 'Calle Serrano 120, 1ºC, 28006 Madrid',
  'Marcos Gómez (marido)', '699 555 666',
  'Cervicalgia crónica asociada a trabajo de oficina. Escoliosis leve (10° Cobb). Síndrome del túnel carpiano bilateral diagnosticado en 2024.',
  'Penicilina',
  'Ciclobenzaprina 5 mg (esporádico)'
);

-- ============================================================
-- 6. ASIGNACIONES FISIOTERAPEUTA ↔ PACIENTE
-- ============================================================

INSERT INTO public.fisioterapeuta_paciente
  (fisioterapeuta_id, paciente_id, fecha_inicio)
VALUES
  (v_fisio1, v_pac1, '2025-11-01'),   -- Ana → María
  (v_fisio2, v_pac2, '2026-01-10'),   -- Carlos → Javier
  (v_fisio1, v_pac3, '2026-02-01'),   -- Ana → Laura
  (v_fisio2, v_pac3, '2026-02-15');   -- Carlos → Laura (coterapeuta)

-- ============================================================
-- 7. DISPONIBILIDAD SEMANAL
-- 0=dom 1=lun 2=mar 3=mié 4=jue 5=vie 6=sáb
-- ============================================================

INSERT INTO public.disponibilidad (fisioterapeuta_id, dia_semana, hora_inicio, hora_fin) VALUES
  (v_fisio1, 1, '09:00', '14:00'),
  (v_fisio1, 1, '16:00', '20:00'),
  (v_fisio1, 2, '09:00', '14:00'),
  (v_fisio1, 2, '16:00', '20:00'),
  (v_fisio1, 3, '09:00', '14:00'),
  (v_fisio1, 3, '16:00', '20:00'),
  (v_fisio1, 4, '09:00', '14:00'),
  (v_fisio1, 4, '16:00', '20:00'),
  (v_fisio1, 5, '09:00', '14:00'),
  (v_fisio2, 1, '10:00', '19:00'),
  (v_fisio2, 2, '10:00', '19:00'),
  (v_fisio2, 3, '10:00', '19:00'),
  (v_fisio2, 4, '10:00', '19:00'),
  (v_fisio2, 5, '10:00', '15:00');

-- ============================================================
-- 8. TRATAMIENTOS
-- ============================================================

INSERT INTO public.tratamientos (
  id, paciente_id, fisioterapeuta_id,
  titulo, descripcion, diagnostico, objetivos,
  estado, fecha_inicio, fecha_fin_estimada
) VALUES
(
  v_trat1, v_pac1, v_fisio1,
  'Rehabilitación postquirúrgica hernia discal L4-L5',
  'Programa de rehabilitación tras cirugía de hernia discal. Enfoque en fortalecimiento del core, mejora de la flexibilidad y reducción del dolor crónico.',
  'Hernia discal L4-L5 operada (2022). Lumbalgia crónica residual con irradiación ocasional a pierna izquierda.',
  '1. Eliminar el dolor en reposo.' || lf ||
  '2. Recuperar la movilidad completa de la columna lumbar.' || lf ||
  '3. Fortalecer la musculatura estabilizadora del core.' || lf ||
  '4. Retorno a actividad física moderada (caminar 5 km sin dolor).',
  'activo', '2025-11-01', '2026-05-01'
),
(
  v_trat2, v_pac2, v_fisio2,
  'Readaptación LCA rodilla derecha — tratamiento conservador',
  'Programa de rehabilitación de rotura parcial de LCA sin intervención quirúrgica. Protocolo progresivo de fortalecimiento y propiocepción.',
  'Rotura parcial del ligamento cruzado anterior (LCA) rodilla derecha, Grado II. MRI confirmado diciembre 2025.',
  '1. Control del dolor e inflamación.' || lf ||
  '2. Recuperar rango de movimiento completo (0-135°).' || lf ||
  '3. Fortalecer cuádriceps e isquiotibiales.' || lf ||
  '4. Reeducación propioceptiva avanzada.' || lf ||
  '5. Retorno al fútbol en 6 meses.',
  'activo', '2026-01-10', '2026-07-10'
),
(
  v_trat3, v_pac3, v_fisio1,
  'Cervicalgia crónica + síndrome del túnel carpiano bilateral',
  'Abordaje combinado de cervicalgia crónica postural y síndrome del túnel carpiano bilateral. Terapia manual, ejercicio terapéutico y educación ergonómica.',
  'Cervicalgia crónica de origen postural. Escoliosis leve (10° Cobb). Síndrome del túnel carpiano bilateral confirmado por EMG (2024).',
  '1. Reducir el dolor cervical en un 50% en 8 semanas.' || lf ||
  '2. Mejorar la postura y conciencia corporal.' || lf ||
  '3. Aliviar parestesias en manos (túnel carpiano).' || lf ||
  '4. Establecer rutina de ejercicios domiciliarios autónoma.',
  'activo', '2026-02-01', '2026-06-01'
);

-- ============================================================
-- 9. EJERCICIOS (biblioteca pública)
-- ============================================================

INSERT INTO public.ejercicios (
  id, nombre, descripcion, instrucciones,
  categoria, musculos_objetivo, dificultad, publico, creado_por
) VALUES
(
  v_ej1,
  'Puente de glúteos',
  'Ejercicio de activación del glúteo mayor y el core. Fundamental en la rehabilitación lumbar.',
  '1. Tumbado boca arriba, rodillas flexionadas a 90°, pies apoyados.' || lf ||
  '2. Contraer abdomen y glúteo antes de subir.' || lf ||
  '3. Elevar la cadera hasta formar una línea recta hombros-cadera-rodillas.' || lf ||
  '4. Mantener 3 segundos. Bajar lentamente.' || lf ||
  '5. 3 series × 12 repeticiones. Descanso 30 s.',
  'Columna y core', ARRAY['Glúteo mayor','Isquiotibiales','Core'],
  'basico', TRUE, v_p_fisio1
),
(
  v_ej2,
  'Bird-Dog',
  'Estabilización lumbar por coordinación de extremidades opuestas.',
  '1. A cuatro patas: muñecas bajo hombros, rodillas bajo caderas.' || lf ||
  '2. Contraer el abdomen (espalda no debe arquearse).' || lf ||
  '3. Extender simultáneamente brazo derecho y pierna izquierda.' || lf ||
  '4. Mantener 5 s. Volver al inicio. Alternar lados.' || lf ||
  '5. 3 series × 10 rep por lado. Descanso 45 s.',
  'Columna y core', ARRAY['Multífidos','Glúteo mayor','Deltoides','Core'],
  'intermedio', TRUE, v_p_fisio1
),
(
  v_ej3,
  'Sentadilla isométrica en pared',
  'Fortalecimiento de cuádriceps sin carga articular. Ideal para rehabilitación de rodilla.',
  '1. Espalda apoyada en la pared, pies a la anchura de cadera.' || lf ||
  '2. Descender hasta que las rodillas formen ~90° (o el ángulo sin dolor).' || lf ||
  '3. Mantener la posición de 20 a 40 segundos.' || lf ||
  '4. Subir lentamente. Descanso 30 s.' || lf ||
  '5. 4 series. Parar si dolor > 4/10.',
  'Miembro inferior', ARRAY['Cuádriceps','Glúteos','Isquiotibiales'],
  'basico', TRUE, v_p_fisio2
),
(
  v_ej4,
  'Propiocepción monopodal con perturbación',
  'Reeducación neuromotora avanzada del LCA sobre superficie inestable.',
  '1. De pie sobre la pierna afectada (rodilla ligeramente flexionada).' || lf ||
  '2. Mantener equilibrio 30 s con ojos abiertos.' || lf ||
  '3. Progresión: ojos cerrados o superficie foam.' || lf ||
  '4. El fisioterapeuta puede añadir perturbaciones externas suaves.' || lf ||
  '5. 3 series × 30 s por pierna.',
  'Miembro inferior', ARRAY['Estabilizadores de tobillo','Glúteos','Core'],
  'avanzado', TRUE, v_p_fisio2
),
(
  v_ej5,
  'Retracción cervical (chin tuck)',
  'Corrección postural que activa los flexores profundos del cuello.',
  '1. Sentado o de pie con espalda recta.' || lf ||
  '2. Sin inclinar la cabeza, deslizarla hacia atrás (como haciendo papada).' || lf ||
  '3. Mantener 5 segundos. Volver a posición neutra lentamente.' || lf ||
  '4. Movimiento HORIZONTAL únicamente. No bajar la barbilla.' || lf ||
  '5. 3 series × 10 rep. Puede realizarse cada 2 horas.',
  'Columna cervical', ARRAY['Flexores profundos cervicales','Suboccipitales'],
  'basico', TRUE, v_p_fisio1
),
(
  v_ej6,
  'Movilización neural nervio mediano',
  'Neurodinámia del nervio mediano para el síndrome del túnel carpiano.',
  '1. De pie o sentado, brazo en cruz a 90°.' || lf ||
  '2. Extender el codo completamente.' || lf ||
  '3. Dorsiflexión de muñeca (palma hacia fuera, dedos al suelo).' || lf ||
  '4. Inclinar la cabeza hacia el lado contrario al brazo estirado.' || lf ||
  '5. Mantener 10 s. 3 series × 5 rep por lado.' || lf ||
  'AVISO: Detener si el hormigueo supera 3/10 de intensidad.',
  'Extremidad superior', ARRAY['Nervio mediano','Flexores del carpo'],
  'intermedio', TRUE, v_p_fisio1
);

-- ============================================================
-- 10. PLANES DE EJERCICIOS
-- ============================================================

INSERT INTO public.planes_ejercicios (
  id, tratamiento_id, paciente_id, fisioterapeuta_id,
  nombre, descripcion, fecha_inicio, fecha_fin, activo
) VALUES
(
  v_plan1, v_trat1, v_pac1, v_fisio1,
  'Fase 2 — Fortalecimiento lumbar y core',
  'Plan domiciliario para la segunda fase del tratamiento lumbar. Enfoque en activación progresiva del core y glúteos.',
  '2026-02-01', '2026-04-01', TRUE
),
(
  v_plan2, v_trat2, v_pac2, v_fisio2,
  'Fase 2 — Fortalecimiento rodilla y propiocepción',
  'Programa de fortalecimiento de cuádriceps y reeducación propioceptiva tras lesión LCA.',
  '2026-02-15', '2026-05-15', TRUE
),
(
  v_plan3, v_trat3, v_pac3, v_fisio1,
  'Rutina cervical y túnel carpiano — domicilio',
  'Ejercicios para casa: corrección postural cervical y movilización neural del nervio mediano.',
  '2026-02-15', '2026-05-01', TRUE
);

-- ============================================================
-- 11. DETALLE DE PLANES
-- ============================================================

-- Plan 1: María (lumbar) → puente + bird-dog
INSERT INTO public.plan_ejercicios_detalle
  (plan_id, ejercicio_id, orden, series, repeticiones, descanso_segundos, notas)
VALUES
  (v_plan1, v_ej1, 1, 3, 12, 30, 'No arquear la zona lumbar. Contraer abdomen antes de elevar la cadera.'),
  (v_plan1, v_ej2, 2, 3, 10, 45, 'Mantener la espalda perfectamente horizontal. No elevar la cadera.');

-- Plan 2: Javier (rodilla) → sentadilla isométrica + propiocepción
INSERT INTO public.plan_ejercicios_detalle
  (plan_id, ejercicio_id, orden, series, duracion_segundos, descanso_segundos, notas)
VALUES
  (v_plan2, v_ej3, 1, 4, 30, 30, 'Si dolor > 4/10, reducir ángulo de flexión. Nunca sobrepasar los 90°.'),
  (v_plan2, v_ej4, 2, 3, 30, 30, 'Empezar con ojos abiertos y superficie estable. Progresar según tolerancia.');

-- Plan 3: Laura (cervical) → chin tuck + neurodinámia
INSERT INTO public.plan_ejercicios_detalle
  (plan_id, ejercicio_id, orden, series, repeticiones, descanso_segundos, notas)
VALUES
  (v_plan3, v_ej5, 1, 3, 10, 20, 'Hacer cada 2 horas frente al ordenador. Movimiento suave y controlado.'),
  (v_plan3, v_ej6, 2, 3,  5, 30, 'Detener si el hormigueo supera 3/10. Consultar si persiste más de 30 s.');

-- ============================================================
-- 12. CITAS
-- ============================================================

-- ── Pasadas (completadas) ──────────────────────────────────

INSERT INTO public.citas (
  id, fisioterapeuta_id, paciente_id, clinica_id,
  fecha_hora, duracion_minutos, estado, motivo, notas
) VALUES
(
  v_cita_ant1, v_fisio1, v_pac1, v_clinica_id,
  '2026-02-28 10:00:00+01', 60, 'completada',
  'Sesión de seguimiento lumbar',
  'Buena evolución. Dolor reducido de 6/10 a 3/10. Se añade puente de glúteos a la rutina domiciliaria.'
),
(
  v_cita_ant2, v_fisio2, v_pac2, v_clinica_id,
  '2026-02-28 11:30:00+01', 45, 'completada',
  'Control rodilla — 7ª sesión',
  'Flexión completa recuperada (0-135°). Sin derrame articular. Inicia propiocepción con foam.'
),
(
  v_cita_ant3, v_fisio1, v_pac3, v_clinica_id,
  '2026-03-04 09:30:00+01', 60, 'completada',
  'Tratamiento cervical + revisión túnel carpiano',
  'Mejora notable en la rotación cervical. Parestesias en manos reducidas en un 40%.'
);

-- ── HOY ────────────────────────────────────────────────────

INSERT INTO public.citas (
  id, fisioterapeuta_id, paciente_id, clinica_id,
  fecha_hora, duracion_minutos, estado, motivo
) VALUES
(
  v_cita_hoy1, v_fisio1, v_pac1, v_clinica_id,
  CURRENT_DATE + TIME '09:30:00', 60, 'confirmada',
  'Sesión semanal — lumbar. Revisión rutina de ejercicios.'
),
(
  v_cita_hoy2, v_fisio2, v_pac2, v_clinica_id,
  CURRENT_DATE + TIME '11:00:00', 45, 'confirmada',
  'Control LCA — fase de propiocepción avanzada'
),
(
  v_cita_hoy3, v_fisio1, v_pac3, v_clinica_id,
  CURRENT_DATE + TIME '16:00:00', 60, 'pendiente',
  'Tratamiento cervical + neurodinámia nervio mediano'
);

-- ── MAÑANA ─────────────────────────────────────────────────

INSERT INTO public.citas (
  id, fisioterapeuta_id, paciente_id, clinica_id,
  fecha_hora, duracion_minutos, estado, motivo
) VALUES
(
  v_cita_man1, v_fisio2, v_pac2, v_clinica_id,
  (CURRENT_DATE + 1) + TIME '10:00:00', 60, 'confirmada',
  'Fortalecimiento rodilla — inicio trabajo pliométrico'
),
(
  v_cita_man2, v_fisio1, v_pac1, v_clinica_id,
  (CURRENT_DATE + 1) + TIME '17:00:00', 45, 'pendiente',
  'Terapia manual columna lumbar'
);

-- ── PRÓXIMOS DÍAS ──────────────────────────────────────────

INSERT INTO public.citas (
  id, fisioterapeuta_id, paciente_id, clinica_id,
  fecha_hora, duracion_minutos, estado, motivo
) VALUES
(
  v_cita_fut1, v_fisio1, v_pac3, v_clinica_id,
  (CURRENT_DATE + 4) + TIME '09:00:00', 60, 'pendiente',
  'Revisión postural + sesión de educación ergonómica'
),
(
  v_cita_fut2, v_fisio2, v_pac2, v_clinica_id,
  (CURRENT_DATE + 5) + TIME '11:30:00', 45, 'pendiente',
  'Test funcional de rodilla — evaluación de progresión'
);

-- ============================================================
-- 13. SESIONES
-- ============================================================

INSERT INTO public.sesiones (
  id, cita_id, tratamiento_id,
  fisioterapeuta_id, paciente_id,
  fecha, duracion_minutos,
  notas_sesion, evolucion,
  dolor_inicio, dolor_fin
) VALUES
(
  v_ses4, NULL, v_trat1, v_fisio1, v_pac1,
  '2026-01-17 10:00:00+01', 60,
  'Primera sesión fase 2. Evaluación inicial. Terapia manual en L4-L5. Inicio ejercicios de estabilización básica.',
  'Paciente presenta dolor lumbar 7/10 en movimiento. Limitación de la flexión anterior (70°). Se inicia protocolo de estabilización progresiva. Muy buena actitud.',
  7, 5
),
(
  v_ses5, NULL, v_trat2, v_fisio2, v_pac2,
  '2026-01-17 11:00:00+01', 45,
  'Segunda sesión. Crioterapia 15 min. Electroterapia analgésica (TENS). Ejercicios isométricos de cuádriceps.',
  'Inflamación reducida respecto a la sesión anterior. El paciente realiza extensión completa sin dolor. Flexión limitada a 90°. Excelente adherencia.',
  6, 3
),
(
  v_ses1, v_cita_ant1, v_trat1, v_fisio1, v_pac1,
  '2026-02-28 10:00:00+01', 60,
  'Terapia manual en zona lumbar (movilización articular L4-L5, técnicas de mulligan). Ejercicios de activación del core (puente, bird-dog). Revisión y corrección de la rutina domiciliaria.',
  'Mejoría progresiva muy satisfactoria. El dolor en reposo ha desaparecido. Persiste molestia (3/10) a la flexión máxima. Se mantiene el plan y se aumenta la carga del puente de glúteos.',
  6, 3
),
(
  v_ses2, v_cita_ant2, v_trat2, v_fisio2, v_pac2,
  '2026-02-28 11:30:00+01', 45,
  'Electroestimulación cuádriceps 15 min. Sentadilla isométrica en pared (4×40 s). Inicio propiocepción: equilibrio monopodal en superficie estable.',
  'Excelente progresión. Rango de movimiento completo recuperado (0-135°). Sin derrame articular. Se programa inicio de foam roller y perturbaciones en la próxima sesión.',
  4, 1
),
(
  v_ses3, v_cita_ant3, v_trat3, v_fisio1, v_pac3,
  '2026-03-04 09:30:00+01', 60,
  'Masaje cervical y trapecios 20 min. Movilización articular C5-C6. Neurodinámia nervio mediano bilateral. Educación ergonómica en el puesto de trabajo.',
  'Notable mejoría en movilidad cervical: rotación derecha aumentó de 55° a 70°. Parestesias en manos reducidas en un 40%. Se actualiza la tabla de ejercicios domiciliarios.',
  7, 4
);

-- ============================================================
-- 14. NOTAS CLÍNICAS
-- ============================================================

INSERT INTO public.notas_clinicas
  (paciente_id, fisioterapeuta_id, sesion_id, tipo, contenido, privada)
VALUES
(
  v_pac1, v_fisio1, v_ses1, 'evolucion',
  'EVOLUCIÓN 28/02: María continúa con muy buena adherencia al tratamiento. Ha reducido el consumo de analgésicos de forma notable. Próxima revisión con traumatólogo el 15/03. Solicitar informe de fisioterapia.',
  FALSE
),
(
  v_pac1, v_fisio1, NULL, 'general',
  'NOTA PRIVADA 28/02: La paciente comenta situación laboral estresante (teletrabajo en malas condiciones ergonómicas). Puede estar dificultando la evolución. Valorar derivación a psicología si no mejora en las próximas 4 semanas.',
  TRUE
),
(
  v_pac2, v_fisio2, v_ses2, 'evolucion',
  'EVOLUCIÓN 28/02: Javier muestra recuperación excepcional, por encima de lo esperado. Se plantea retorno al entrenamiento (carrera suave) a partir de la semana 10. Muy motivado y comprometido con el tratamiento.',
  FALSE
),
(
  v_pac3, v_fisio1, v_ses3, 'evolucion',
  'EVOLUCIÓN 04/03: Laura responde bien al tratamiento combinado. La clave ha sido la educación postural: reorganizó su puesto de trabajo según las indicaciones. Los síntomas del túnel carpiano mejoran más lentamente; se mantiene el protocolo de neurodinámia.',
  FALSE
),
(
  v_pac3, v_fisio1, NULL, 'incidencia',
  'INCIDENCIA 02/03: La paciente canceló su cita con menos de 24 h de antelación. Primer aviso. Se le recuerda la política de cancelaciones de la clínica.',
  TRUE
);

-- ============================================================
-- 15. PAGOS
-- ============================================================

INSERT INTO public.pagos
  (paciente_id, cita_id, monto, tipo_pago, estado, concepto, fecha_pago)
VALUES
(v_pac1, v_cita_ant1, 65.00, 'tarjeta',       'pagado',   'Sesión de fisioterapia — 28/02/2026', '2026-02-28 11:05:00+01'),
(v_pac2, v_cita_ant2, 55.00, 'efectivo',      'pagado',   'Sesión de fisioterapia — 28/02/2026', '2026-02-28 12:20:00+01'),
(v_pac3, v_cita_ant3, 65.00, 'transferencia', 'pagado',   'Sesión de fisioterapia — 04/03/2026', '2026-03-04 10:35:00+01'),
(v_pac1, v_cita_hoy1, 65.00, 'tarjeta',       'pendiente','Sesión de fisioterapia — hoy',         NULL),
(v_pac2, v_cita_hoy2, 55.00, 'efectivo',      'pendiente','Sesión de fisioterapia — hoy',         NULL);

-- ============================================================
-- 16. NOTIFICACIONES
-- ============================================================

INSERT INTO public.notificaciones
  (user_id, titulo, mensaje, tipo, leida, datos)
VALUES
(
  v_p_fisio1, 'Cita confirmada — hoy 9:30 h',
  'María Fernández Torres ha confirmado su cita de hoy a las 9:30 h.',
  'cita', FALSE,
  jsonb_build_object('cita_id', v_cita_hoy1, 'paciente', 'María Fernández Torres')
),
(
  v_p_fisio2, 'Cita confirmada — hoy 11:00 h',
  'Javier Moreno Santos ha confirmado su cita de hoy a las 11:00 h.',
  'cita', FALSE,
  jsonb_build_object('cita_id', v_cita_hoy2, 'paciente', 'Javier Moreno Santos')
),
(
  v_p_pac1, 'Recordatorio de cita',
  'Tienes una cita con la Dra. Ana García hoy a las 9:30 h en Clínica FisioSalud Madrid. ¡Recuerda traer ropa cómoda!',
  'recordatorio', FALSE, NULL
),
(
  v_p_pac2, 'Recordatorio de cita',
  'Tienes una cita con el Dr. Carlos Ruiz hoy a las 11:00 h. Tu plan de ejercicios ha sido actualizado.',
  'recordatorio', TRUE, NULL
),
(
  v_p_pac3, 'Nuevo plan de ejercicios asignado',
  'La Dra. Ana García ha actualizado tu plan de ejercicios para casa. Accede a la sección "Mis ejercicios" para verlo.',
  'plan', FALSE,
  jsonb_build_object('plan_id', v_plan3)
),
(
  v_p_fisio1, 'Resumen mensual — febrero 2026',
  '3 pacientes activos · 12 sesiones realizadas · Tasa de adherencia: 91%.',
  'sistema', FALSE, NULL
),
(
  v_p_fisio2, 'Resumen mensual — febrero 2026',
  '1 paciente activo · 8 sesiones realizadas · Evolución excelente en caso LCA.',
  'sistema', TRUE, NULL
);

-- ============================================================
-- FIN
-- ============================================================
RAISE NOTICE '';
RAISE NOTICE '✅ Datos de prueba insertados correctamente.';
RAISE NOTICE '';
RAISE NOTICE '── CREDENCIALES ───────────────────────────────────────';
RAISE NOTICE '👩‍⚕️  Fisio 1:    ana.garcia@fisiosalud.es   /  Password123!';
RAISE NOTICE '👨‍⚕️  Fisio 2:    carlos.ruiz@fisiosalud.es  /  Password123!';
RAISE NOTICE '🧑  Paciente 1: maria.fernandez@email.com  /  Password123!';
RAISE NOTICE '🧑  Paciente 2: javier.moreno@email.com   /  Password123!';
RAISE NOTICE '🧑  Paciente 3: laura.sanchez@email.com   /  Password123!';
RAISE NOTICE '───────────────────────────────────────────────────────';

END $$;


-- ============================================================
-- LIMPIEZA — descomenta este bloque para borrar los datos seed
-- ============================================================
/*
DO $$
BEGIN
  DELETE FROM auth.users WHERE id IN (
    'b1000000-0000-0000-0000-000000000001',
    'b2000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000001',
    'c2000000-0000-0000-0000-000000000002',
    'c3000000-0000-0000-0000-000000000003'
  );
  DELETE FROM public.clinicas  WHERE id = 'a1000000-0000-0000-0000-000000000001';
  DELETE FROM public.ejercicios WHERE id IN (
    'f1000000-0000-0000-0000-000000000001',
    'f2000000-0000-0000-0000-000000000002',
    'f3000000-0000-0000-0000-000000000003',
    'f4000000-0000-0000-0000-000000000004',
    'f5000000-0000-0000-0000-000000000005',
    'f6000000-0000-0000-0000-000000000006'
  );
  RAISE NOTICE '🗑️  Datos de prueba eliminados.';
END $$;
*/
