# FisioApp v2 — TODO

> Análisis generado el 2026-03-08. Estado del proyecto: autenticación, dashboards y gestión básica de pacientes implementados. 11 rutas pendientes.

---

## 🔴 P0 — Bugs (rompen funcionalidad o build)

### 1. Error TypeScript que rompe `npm run build`
**Archivo:** `src/pages/paciente/DashboardPaciente.tsx:84`
```tsx
// ❌ Actual — campos que NO existen en Views<'v_citas'>
{cita.fisio_nombre} {cita.fisio_apellidos}

// ✅ Correcto — nombres reales de la vista
{cita.fisioterapeuta_nombre} {cita.fisioterapeuta_apellidos}
```
El tipo `Views<'v_citas'>` (definido en `src/types/database.types.ts:578`) tiene `fisioterapeuta_nombre` y `fisioterapeuta_apellidos`. Con `strict: true` en `tsconfig.app.json`, el build falla.

---

### 2. `<a href>` en lugar de `<Link>` en DashboardFisio — full page reload
**Archivo:** `src/pages/fisio/DashboardFisio.tsx`

- **Línea 241:** `<a href="/fisio/citas">Ver agenda completa →</a>` → rompe SPA navigation
- **Línea 283-292:** Array `acciones` renderizado con `<a href={accion.path}>` → rompe SPA navigation

```tsx
// ❌ Actual
<a href="/fisio/citas" className="...">Ver agenda completa →</a>

// ✅ Correcto
<Link to="/fisio/citas" className="...">Ver agenda completa →</Link>
```
Requiere importar `Link` de `react-router-dom` (ya importado en DashboardPaciente, falta en DashboardFisio).

---

### 3. Rutas de acciones rápidas no definidas en App.tsx
**Archivos:** `src/pages/fisio/DashboardFisio.tsx:120-158` y `src/App.tsx`

Las acciones rápidas del dashboard enlazan a rutas que no existen → el catch-all `*` redirige a `/` sin aviso:
- `/fisio/citas/nueva` — **no está en App.tsx**
- `/fisio/sesiones/nueva` — **no está en App.tsx**
- `/fisio/notas/nueva` — **no está en App.tsx**

Solución mínima: añadir las tres rutas a `App.tsx` con `<ComingSoon>` hasta implementarlas.

---

### 4. Riesgo de compatibilidad en migración `crear_paciente_nuevo`
**Archivo:** `supabase/migrations/20260308000002_crear_paciente_nuevo.sql:56-79`

La función inserta directamente en `auth.users` con columnas que pueden no existir en todas las versiones de Supabase (`is_super_admin`, `is_sso_user`). Si la versión del proyecto difiere, la migración falla silenciosamente o con error en producción. Verificar contra la versión exacta de GoTrue del proyecto antes de hacer `supabase db push`.

---

### 5. `useDashboardPaciente` — sesiones sin filtro explícito de paciente
**Archivo:** `src/hooks/useDashboardPaciente.ts:45-47`

```ts
// ❌ Actual — depende enteramente de RLS (si el paciente no tiene registro
//    en la tabla `pacientes`, get_paciente_id() devuelve NULL y la policy
//    falla silenciosamente: devuelve 0 sesiones aunque las haya)
supabase.from('sesiones').select('id', { count: 'exact', head: true })

// ✅ Más robusto — usar get_paciente_id() con manejo de null explícito
const { data: pacienteId } = await supabase.rpc('get_paciente_id')
if (pacienteId) {
  supabase.from('sesiones').select('id', { count: 'exact', head: true })
    .eq('paciente_id', pacienteId)
}
```

---

## 🟠 P1 — Alta prioridad (funcionalidades core)

### Páginas del fisioterapeuta

#### ~~`/fisio/pacientes/:id` — Historial del paciente~~ ✅ COMPLETADO
**Archivos:** `src/pages/fisio/HistorialPaciente.tsx`, `src/hooks/useHistorialPaciente.ts`

---

#### ~~`/fisio/citas` — Gestión de citas~~ ✅ COMPLETADO
**Archivos:** `src/pages/fisio/CitasFisio.tsx`, `src/hooks/useCitasFisio.ts`

---

#### ~~`/fisio/citas/nueva` — Nueva cita~~ ✅ COMPLETADO
**Archivo:** `src/pages/fisio/NuevaCitaFisio.tsx`

---

#### `/fisio/sesiones` — Gestión de sesiones
**Archivo a crear:** `src/pages/fisio/SesionesFisio.tsx`
**Hook a crear:** `src/hooks/useSesionesFisio.ts`
**Ruta en App.tsx:65** — actualmente `<ComingSoon title="Sesiones" />`

Lista de sesiones del fisio con filtros por paciente/fecha. Muestra escala de dolor (dolor_inicio → dolor_fin), notas de sesión, evolución.

---

#### ~~`/fisio/sesiones/nueva` — Nueva sesión~~ ✅ COMPLETADO
**Archivos:** `src/pages/fisio/NuevaSesionFisio.tsx`, `src/hooks/useNuevaSesion.ts`

---

#### `/fisio/tratamientos` — Gestión de tratamientos
**Archivo a crear:** `src/pages/fisio/TratamientosFisio.tsx`
**Hook a crear:** `src/hooks/useTratamientosFisio.ts`
**Ruta en App.tsx:64** — actualmente `<ComingSoon title="Tratamientos" />`

Lista de tratamientos agrupados por estado (`activo`, `completado`, `suspendido`). Muestra paciente, título, diagnóstico, fechas. Permite cambiar estado.

---

### Páginas del paciente

#### ~~`/paciente/rutinas` — Mis rutinas de ejercicios~~ ✅ COMPLETADO
**Archivos:** `src/pages/paciente/RutinasPaciente.tsx`, `src/hooks/useRutinasPaciente.ts`

---

## 🟡 P2 — Media prioridad

### Páginas del fisioterapeuta

#### `/fisio/notas` — Notas clínicas
**Archivo a crear:** `src/pages/fisio/NotasClincias.tsx`
**Hook a crear:** `src/hooks/useNotasClincias.ts`
**Ruta en App.tsx:66** — actualmente `<ComingSoon title="Notas clínicas" />`

Lista de notas agrupadas por paciente o por fecha. Filtra por tipo (`general`, `evolucion`, `incidencia`, `alta`) y por privacidad. Las notas privadas (`privada: true`) no deben ser visibles al paciente (ya controlado por RLS).

#### `/fisio/notas/nueva` — Nueva nota clínica
**Archivo a crear:** `src/pages/fisio/NuevaNotaFisio.tsx`
**Ruta en App.tsx** — falta añadir

Formulario: paciente, tipo de nota, contenido, privada (toggle), sesión asociada (opcional). Insert en `notas_clinicas`.

#### `/fisio/ejercicios` — Biblioteca de ejercicios
**Archivo a crear:** `src/pages/fisio/EjerciciosFisio.tsx`
**Hook a crear:** `src/hooks/useEjercicios.ts`
**Ruta en App.tsx:65** — actualmente `<ComingSoon title="Ejercicios" />`

Biblioteca con ejercicios públicos + propios del fisio. Filtros por categoría, dificultad, grupos musculares. CRUD de ejercicios propios. Asignación de ejercicios a planes de pacientes.

Query: `ejercicios WHERE publico = true OR creado_por = get_fisioterapeuta_id()`.

#### `/fisio/perfil` — Perfil del fisioterapeuta
**Archivo a crear:** `src/pages/fisio/PerfilFisio.tsx`
**Ruta en App.tsx:67** — actualmente `<ComingSoon title="Mi perfil" />`

Formulario de edición: nombre, apellidos, teléfono, foto (upload a Storage bucket `avatars`), número colegiado, especialidades (tags), biografía. Update en `profiles` + `fisioterapeutas`.

### Páginas del paciente

#### `/paciente/perfil` — Perfil del paciente
**Archivo a crear:** `src/pages/paciente/PerfilPaciente.tsx`
**Ruta en App.tsx:83** — actualmente `<ComingSoon title="Mi perfil" />`

Formulario: nombre, apellidos, teléfono, fecha nacimiento, dirección, contacto de emergencia, alergias, medicación actual. Update en `profiles` + `pacientes`.

#### `/paciente/progreso` — Mi progreso
**Archivo a crear:** `src/pages/paciente/ProgresoPaciente.tsx`
**Hook a crear:** `src/hooks/useProgresoPaciente.ts`
**Ruta en App.tsx:82** — actualmente `<ComingSoon title="Mi progreso" />`

Gráfico de dolor a lo largo del tiempo (dolor_inicio / dolor_fin por sesión). Lista de sesiones completadas. Contador de racha. Usa `sesiones` filtradas por `get_paciente_id()`.

---

### Mejoras de hooks existentes

#### `usePacientesFisio.ts` — Paginación
**Archivo:** `src/hooks/usePacientesFisio.ts`

La consulta actual carga todos los pacientes de una vez. Si el fisio tiene muchos pacientes, añadir paginación server-side (`.range(offset, offset + PAGE_SIZE - 1)`). El `refetch` está expuesto pero no se usa en la página.

#### `useDashboardFisio.ts` — Datos de pacientes recientes
**Archivo:** `src/hooks/useDashboardFisio.ts`

El dashboard muestra "pacientes activos" como número pero no los lista. Considerar añadir los últimos 3 pacientes con actividad reciente para acceso rápido.

---

### Backend (nuevas RPCs o políticas)

#### Función RPC: historial completo de paciente
**Archivo a crear:** `supabase/migrations/20260308000003_historial_paciente.sql`

Función `get_historial_paciente(p_paciente_id UUID)` que devuelve en una sola llamada: datos del paciente + tratamiento activo + últimas N sesiones + próximas citas + planes activos. Evita el waterfall de queries en el historial del paciente.

#### Función RPC: disponibilidad de slots para citas
**Archivo a crear:** `supabase/migrations/20260308000004_slots_disponibilidad.sql`

Función `get_slots_disponibles(p_fisio_id UUID, p_fecha DATE)` que consulta la tabla `disponibilidad` del fisio para esa fecha y resta las citas ya existentes, devolviendo los huecos libres. Necesaria para el formulario de nueva cita.

#### Política RLS faltante: actualización de `fisioterapeuta_paciente`
**Archivo:** `supabase/migrations/20260307000001_schema_completo.sql`

No existe policy `UPDATE` en `fisioterapeuta_paciente` para el fisioterapeuta. Actualmente `vincular_paciente` (SECURITY DEFINER) lo hace correctamente, pero si en el futuro se quiere desactivar un vínculo directamente desde el cliente, se necesitará:
```sql
CREATE POLICY "fp_update_fisioterapeuta"
  ON public.fisioterapeuta_paciente FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM fisioterapeutas f WHERE f.id = fisioterapeuta_id AND f.profile_id = auth.uid())
  );
```

---

## 🟢 P3 — Baja prioridad / Mejoras técnicas

### Chat en tiempo real
**Requiere:** tabla `mensajes` (nueva migración), Supabase Realtime, canal por par fisio-paciente
**Archivos a crear:** `src/pages/paciente/ChatPaciente.tsx`, `src/pages/fisio/ChatFisio.tsx` (o integrado en historial), `src/hooks/useChat.ts`
**Ruta en App.tsx:82** — actualmente `<ComingSoon title="Chat con mi fisio" />`

Implementar con `supabase.channel()` + `.on('postgres_changes', ...)`. La tabla `mensajes` debería tener: `id`, `fisioterapeuta_id`, `paciente_id`, `autor_id`, `contenido`, `leido`, `created_at`. RLS: cada parte solo ve sus conversaciones.

### Sistema de notificaciones
**Archivos:** la tabla `notificaciones` ya existe en el esquema.
**Pendiente:** UI de notificaciones en ambos layouts (campana en header mobile), mark as read, Realtime subscription para notificaciones en tiempo real.

### Sistema de pagos
**Tabla:** `pagos` ya existe en el esquema.
**Pendiente:** UI para registrar pagos, historial de pagos por paciente, resumen contable del fisio.

### Configuración de disponibilidad del fisio
**Tabla:** `disponibilidad` ya existe en el esquema.
**Pendiente:** UI tipo grid semanal donde el fisio configura sus horarios de trabajo (CRUD en tabla `disponibilidad`).

---

## 🔧 Deuda técnica

| Problema | Archivo | Acción |
|---|---|---|
| `src/App.css` vacío e importado desde ningún sitio | `src/App.css` | Eliminar el archivo |
| `src/hooks/useAuth.ts` solo re-exporta `useAuthStore` | `src/hooks/useAuth.ts` | Eliminar; importar `useAuthStore` directamente |
| `README.md` es el template de Vite | `README.md` | Reescribir con instrucciones reales del proyecto |
| `supabase/seed.sql` vacío | `supabase/seed.sql` | Añadir datos de prueba (fisio, paciente, citas) para desarrollo local |
| Tipos generados a mano en `database.types.ts` | `src/types/database.types.ts` | Configurar `supabase gen types typescript --linked` en un script npm para mantenerlos sincronizados |
| Sin tests | — | Configurar Vitest + Testing Library para hooks y componentes críticos |
| Sin error boundary global | `src/App.tsx` | Añadir `<ErrorBoundary>` raíz para capturar crashes inesperados |
| Skeleton duplicado en `PacientesFisio` y `DashboardFisio` | Varios | Extraer `<Skeleton>` a `src/components/ui/Skeleton.tsx` |

---

## 📋 Resumen rápido

| Prioridad | Items | Estado |
|---|---|---|
| 🔴 P0 Bugs | 5 | Pendientes |
| 🟠 P1 Core | 6 páginas + 5 hooks | 5/6 completadas ✅ |
| 🟡 P2 Importantes | 5 páginas + 2 mejoras + 3 RPCs | Pendientes |
| 🟢 P3 Nice-to-have | Chat, notificaciones, pagos, disponibilidad | Pendientes |
| 🔧 Deuda técnica | 8 items | Pendientes |

### Orden de ataque sugerido
1. Corregir bugs P0 (especialmente el error TypeScript — rompe el build)
2. `/fisio/pacientes/:id` — historial del paciente (es la página más enlazada y sin ella los otros módulos no tienen contexto)
3. `/fisio/citas` + `/fisio/citas/nueva` — core del negocio
4. `/fisio/sesiones` + `/fisio/sesiones/nueva`
5. Perfiles editables (fisio y paciente)
6. Resto del flujo del paciente (rutinas, progreso)
