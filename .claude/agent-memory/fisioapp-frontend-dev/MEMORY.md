# FisioApp v2 — Agent Memory

## Key conventions confirmed across sessions

### Supabase workaround (v2.98)
All Supabase queries must use `const sb = supabase as any` for Views, `.in()`, `.eq()` with enums and RPCs.
RPC scalar results must be cast: `const fisioId = fisioIdRaw as string`.
See example pattern in `src/hooks/usePacientesFisio.ts`.

### Custom zodResolver
Import from `@/lib/zodResolver` (not from @hookform/resolvers). It is a local shim for Zod v4 compatibility.

### Hook pattern
Always return `{ data, loading, error, refetch, ...actions }`.
Use `tick` state + `setTick(t => t+1)` for manual refetch trigger.
Use `cancelled` flag inside useEffect for cleanup.

## Implemented features

### Hooks
- `src/hooks/usePacientesFisio.ts` — fetches patients with diagnostico + proxima cita enrichment
- `src/hooks/useCitasFisio.ts` — fetches v_citas for the fisio; client-side filtering by estado + fecha window; exposes cancelarCita / completarCita (UPDATE citas table); refetch via tick
- `src/hooks/useHistorialPaciente.ts` — receives pacienteId; parallel Promise.all over v_pacientes, tratamientos, sesiones (limit 10), notas_clinicas (limit 10), v_citas (upcoming, limit 5), planes_ejercicios (activo=true); returns { data: HistorialPacienteData | null, loading, error, refetch }

### Pages (FISIO)
- `src/pages/fisio/DashboardFisio.tsx`
- `src/pages/fisio/PacientesFisio.tsx` — table (desktop) + cards (mobile), search + activos filter
- `src/pages/fisio/NuevoPacienteFisio.tsx` — calls RPC `crear_paciente_nuevo`
- `src/pages/fisio/CitasFisio.tsx` — chips for estado + periodo filters, confirm dialog (no library), skeleton loaders
- `src/pages/fisio/NuevaCitaFisio.tsx` — loads activos patients via fisioterapeuta_paciente + v_pacientes; INSERT into citas
- `src/pages/fisio/HistorialPaciente.tsx` — patient detail hub; sections: cabecera (avatar, email, tel, activo badge), tratamiento activo, sesiones recientes (DolorIndicator + notes toggle), proximas citas, planes activos, notas clinicas (badge tipo + privada indicator), tratamientos historicos; action buttons: nueva sesion/cita/nota with ?paciente= query param; max-w-3xl wrapper

### Pages (PACIENTE)
- `src/pages/paciente/DashboardPaciente.tsx`

## DB views used
- `v_citas` — includes fisioterapeuta_nombre/apellidos, paciente_nombre/apellidos/email/telefono
- `v_pacientes` — includes nombre, apellidos, email, telefono, foto_url, activo
- `v_fisioterapeutas`

## RPCs available
- `get_fisioterapeuta_id()` → string
- `get_paciente_id()` → string
- `get_user_role()` → UserRole
- `buscar_paciente_por_email(p_email)` → PacienteBuscadoRPC
- `crear_paciente_nuevo(...)` → { user_id, paciente_id, nombre, apellidos, email }
- `vincular_paciente(...)` → { paciente_id, ya_vinculado }

## Design tokens / Tailwind patterns
- Page wrapper: `max-w-5xl mx-auto space-y-6` (list pages) / `max-w-2xl mx-auto space-y-6` (form pages)
- Card: `bg-white rounded-xl border border-gray-200`
- Primary button: `bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg`
- Input: `w-full px-3.5 py-2.5 rounded-lg border text-sm border-gray-200 focus:ring-2 focus:ring-blue-500`
- Error input: `border-red-400 bg-red-50`
- Section heading: `text-sm font-semibold text-gray-500 uppercase tracking-wide`
- Badge estado: pendiente=amber, confirmada=blue, completada=green, cancelada=red, no_asistio=gray
- Mobile/desktop split: `hidden md:block` for table, `md:hidden` for cards

## Route structure (React Router v7)
- `/fisio` → FisioLayout (ProtectedRoute role=fisioterapeuta)
  - index → DashboardFisio
  - `citas` → CitasFisio
  - `citas/nueva` → NuevaCitaFisio
  - `pacientes` → PacientesFisio
  - `pacientes/nuevo` → NuevoPacienteFisio
  - `pacientes/:id` → HistorialPaciente
  - others → ComingSoon
- `/paciente` → PacienteLayout (ProtectedRoute role=paciente)
  - index → DashboardPaciente
  - others → ComingSoon
