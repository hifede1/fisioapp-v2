// 🏥 Role: FISIO only

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@/lib/zodResolver'
import { supabase } from '@/lib/supabase'

// ─── Schema ───────────────────────────────────────────────────────────────────

const MINUTOS_VALIDOS = [0, 15, 30, 45] as const

const schema = z.object({
  paciente_id:      z.string().min(1, 'Selecciona un paciente'),
  fecha:            z.string().min(1, 'La fecha es requerida'),
  hora:             z.coerce.number().int().min(8, 'La hora mínima es las 08:00').max(20, 'La hora máxima es las 20:00'),
  minutos:          z.coerce.number().int().refine(
    (v) => (MINUTOS_VALIDOS as readonly number[]).includes(v),
    { message: 'Los minutos deben ser 00, 15, 30 o 45' }
  ),
  duracion_minutos: z.coerce.number().int().min(15).max(240),
  tratamiento_id:   z.string().nullable().optional(),
  notas:            z.string().max(1000).optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

// ─── Tipos locales ────────────────────────────────────────────────────────────

interface PacienteOption {
  id: string
  nombre: string
  apellidos: string
}

interface TratamientoOption {
  id: string
  titulo: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function inputClass(hasError?: boolean) {
  return [
    'w-full px-3.5 py-2.5 rounded-lg border text-sm text-gray-900 placeholder-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition',
    'disabled:bg-gray-50 disabled:text-gray-400',
    hasError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white',
  ].join(' ')
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-600" role="alert">{error}</p>}
    </div>
  )
}

// ─── Today ISO string para el atributo min del input date ─────────────────────

function todayISO(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const dd   = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// ─── Formateador de fecha para el mensaje de solapamiento ────────────────────

function formatearFechaLegible(fechaISO: string): string {
  // fechaISO: "YYYY-MM-DD"
  const [yyyy, mm, dd] = fechaISO.split('-')
  return `${dd}/${mm}/${yyyy}`
}

// ─── Opciones estáticas ───────────────────────────────────────────────────────

const OPCIONES_HORAS: number[] = Array.from({ length: 13 }, (_, i) => i + 8) // 8..20

// ─── Page ─────────────────────────────────────────────────────────────────────

export function NuevaCitaFisio() {
  const navigate = useNavigate()

  const [pacientes, setPacientes]                     = useState<PacienteOption[]>([])
  const [pacientesLoading, setPacientesLoading]       = useState(true)
  const [pacientesError, setPacientesError]           = useState<string | null>(null)

  const [tratamientos, setTratamientos]               = useState<TratamientoOption[]>([])
  const [tratamientosLoading, setTratamientosLoading] = useState(false)

  const [serverError, setServerError]                 = useState<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const {
    register,
    handleSubmit,
    watch,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      hora:             9,
      minutos:          0,
      duracion_minutos: 60,
      tratamiento_id:   null,
    },
  })

  const pacienteIdWatched = watch('paciente_id')
  const fechaWatched      = watch('fecha')
  const horaWatched       = watch('hora')
  const minutosWatched    = watch('minutos')

  // ── Cargar pacientes activos del fisio ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function loadPacientes() {
      setPacientesLoading(true)
      setPacientesError(null)

      try {
        const { data: fisioIdRaw, error: rpcError } = await supabase.rpc('get_fisioterapeuta_id')
        if (rpcError || !fisioIdRaw) throw new Error('No se encontró el perfil de fisioterapeuta')
        const fisioId = fisioIdRaw as string

        // 1. IDs de pacientes activos asignados al fisio
        const { data: asigs, error: asigError } = await sb
          .from('fisioterapeuta_paciente')
          .select('paciente_id')
          .eq('fisioterapeuta_id', fisioId)
          .eq('activo', true)

        if (asigError) throw asigError

        const ids = ((asigs ?? []) as Array<{ paciente_id: string }>).map(a => a.paciente_id)

        if (ids.length === 0) {
          if (!cancelled) setPacientes([])
          return
        }

        // 2. Datos de los pacientes desde v_pacientes
        const { data: pacs, error: pacsError } = await sb
          .from('v_pacientes')
          .select('id, nombre, apellidos')
          .in('id', ids)
          .order('apellidos')

        if (pacsError) throw pacsError

        if (!cancelled) {
          setPacientes((pacs ?? []) as PacienteOption[])
        }
      } catch (err) {
        if (!cancelled) {
          setPacientesError(err instanceof Error ? err.message : 'Error al cargar pacientes')
        }
      } finally {
        if (!cancelled) setPacientesLoading(false)
      }
    }

    loadPacientes()
    return () => { cancelled = true }
  }, [])

  // ── Cargar tratamientos activos cuando cambia el paciente seleccionado ───────
  useEffect(() => {
    if (!pacienteIdWatched) {
      setTratamientos([])
      return
    }

    let cancelled = false

    async function loadTratamientos() {
      setTratamientosLoading(true)

      try {
        const { data, error: fetchError } = await sb
          .from('tratamientos')
          .select('id, titulo')
          .eq('paciente_id', pacienteIdWatched)
          .eq('estado', 'activo')
          .order('fecha_inicio', { ascending: false })

        if (fetchError) throw fetchError

        if (!cancelled) {
          setTratamientos((data ?? []) as TratamientoOption[])
        }
      } catch {
        if (!cancelled) setTratamientos([])
      } finally {
        if (!cancelled) setTratamientosLoading(false)
      }
    }

    loadTratamientos()
    return () => { cancelled = true }
  }, [pacienteIdWatched])

  // ── Componer la cadena "HH:MM" a partir de hora y minutos ────────────────────

  function buildHoraString(h: number, m: number): string {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const onSubmit = async (data: FormValues) => {
    setServerError(null)

    try {
      const { data: fisioIdRaw, error: rpcError } = await supabase.rpc('get_fisioterapeuta_id')
      if (rpcError || !fisioIdRaw) throw new Error('No se encontró el perfil de fisioterapeuta')
      const fisioId = fisioIdRaw as string

      // ── 1. Verificar solapamiento ────────────────────────────────────────────
      const horaStr     = buildHoraString(data.hora, data.minutos)
      const fechaHoraSlot = `${data.fecha}T${horaStr}:00`

      const { data: existentes, error: overlapError } = await sb
        .from('citas')
        .select('id')
        .eq('fisioterapeuta_id', fisioId)
        .eq('fecha_hora', fechaHoraSlot)
        .neq('estado', 'cancelada')
        .limit(1)

      if (overlapError) throw overlapError

      if (existentes && existentes.length > 0) {
        setError('hora', {
          type: 'manual',
          message: `Ya tienes una cita programada a las ${horaStr} el ${formatearFechaLegible(data.fecha)}.`,
        })
        return
      }

      // ── 2. Insertar cita ────────────────────────────────────────────────────
      const { error: insertError } = await sb
        .from('citas')
        .insert({
          fisioterapeuta_id: fisioId,
          paciente_id:       data.paciente_id,
          fecha_hora:        fechaHoraSlot,
          duracion_minutos:  data.duracion_minutos,
          notas:             data.notas?.trim() || null,
          estado:            'pendiente',
          ...(data.tratamiento_id ? { tratamiento_id: data.tratamiento_id } : {}),
        })

      if (insertError) throw insertError

      navigate('/fisio/citas')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error al crear la cita')
    }
  }

  // ── Hora display para el banner de solapamiento ───────────────────────────
  const horaDisplayBanner =
    horaWatched != null && minutosWatched != null
      ? buildHoraString(Number(horaWatched), Number(minutosWatched))
      : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/fisio/citas')}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Volver a citas"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva cita</h1>
          <p className="text-sm text-gray-500 mt-0.5">Programa una cita con uno de tus pacientes</p>
        </div>
      </div>

      {/* Error al cargar pacientes */}
      {pacientesError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {pacientesError}
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">

          {/* Sección: Paciente */}
          <div className="p-6 space-y-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Paciente
            </h2>

            <Field label="Paciente" required error={errors.paciente_id?.message}>
              {pacientesLoading ? (
                <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ) : (
                <select
                  className={inputClass(!!errors.paciente_id)}
                  disabled={isSubmitting || pacientesLoading}
                  {...register('paciente_id')}
                  defaultValue=""
                >
                  <option value="" disabled>Selecciona un paciente...</option>
                  {pacientes.length === 0 ? (
                    <option value="" disabled>No tienes pacientes activos</option>
                  ) : (
                    pacientes.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.apellidos}, {p.nombre}
                      </option>
                    ))
                  )}
                </select>
              )}
              {!pacientesLoading && pacientes.length === 0 && !pacientesError && (
                <p className="mt-1.5 text-xs text-amber-600">
                  No tienes pacientes activos asignados. Registra un paciente primero.
                </p>
              )}
            </Field>

            {/* Tratamiento asociado — aparece cuando hay un paciente seleccionado */}
            {pacienteIdWatched && (
              <Field
                label="Tratamiento asociado"
                hint="Opcional. Vincula esta cita a un tratamiento activo del paciente."
                error={errors.tratamiento_id?.message}
              >
                {tratamientosLoading ? (
                  <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                ) : (
                  <Controller
                    name="tratamiento_id"
                    control={control}
                    render={({ field }) => (
                      <select
                        className={inputClass(!!errors.tratamiento_id)}
                        disabled={isSubmitting}
                        value={field.value ?? ''}
                        onChange={e => field.onChange(e.target.value || null)}
                        onBlur={field.onBlur}
                        ref={field.ref}
                      >
                        <option value="">Sin tratamiento asociado</option>
                        {tratamientos.length === 0 ? (
                          <option value="" disabled>No hay tratamientos activos</option>
                        ) : (
                          tratamientos.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.titulo}
                            </option>
                          ))
                        )}
                      </select>
                    )}
                  />
                )}
              </Field>
            )}
          </div>

          {/* Sección: Fecha y hora */}
          <div className="p-6 space-y-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Fecha y hora
            </h2>

            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Fecha" required error={errors.fecha?.message}>
                <input
                  type="date"
                  min={todayISO()}
                  disabled={isSubmitting}
                  className={inputClass(!!errors.fecha)}
                  {...register('fecha')}
                />
              </Field>

              {/* Selectores de hora y minutos en la misma línea */}
              <Field
                label="Hora"
                required
                error={errors.hora?.message ?? errors.minutos?.message}
              >
                <div className="flex items-center gap-1">
                  {/* Selector de horas */}
                  <Controller
                    name="hora"
                    control={control}
                    render={({ field }) => (
                      <select
                        className={inputClass(!!(errors.hora || errors.minutos))}
                        disabled={isSubmitting}
                        value={field.value}
                        onChange={e => field.onChange(Number(e.target.value))}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        aria-label="Hora"
                      >
                        {OPCIONES_HORAS.map(h => (
                          <option key={h} value={h}>
                            {String(h).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    )}
                  />

                  {/* Separador */}
                  <span
                    className="px-1 text-lg font-semibold text-gray-500 select-none"
                    aria-hidden="true"
                  >
                    :
                  </span>

                  {/* Selector de minutos */}
                  <Controller
                    name="minutos"
                    control={control}
                    render={({ field }) => (
                      <select
                        className={inputClass(!!(errors.hora || errors.minutos))}
                        disabled={isSubmitting}
                        value={field.value}
                        onChange={e => field.onChange(Number(e.target.value))}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        aria-label="Minutos"
                      >
                        {MINUTOS_VALIDOS.map(m => (
                          <option key={m} value={m}>
                            {String(m).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>
              </Field>
            </div>

            {/* Banner de solapamiento — sólo cuando hay error manual en hora */}
            {errors.hora?.type === 'manual' && fechaWatched && horaDisplayBanner && (
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-amber-700">{errors.hora.message}</p>
              </div>
            )}

            <Field
              label="Duración"
              required
              error={errors.duracion_minutos?.message}
            >
              <select
                className={inputClass(!!errors.duracion_minutos)}
                disabled={isSubmitting}
                {...register('duracion_minutos')}
              >
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos</option>
                <option value={90}>90 minutos</option>
                <option value={120}>120 minutos</option>
              </select>
            </Field>
          </div>

          {/* Sección: Notas */}
          <div className="p-6 space-y-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Notas
            </h2>

            <Field
              label="Notas de la cita"
              hint="Información adicional, motivo de consulta, preparación, etc. (opcional)"
              error={errors.notas?.message}
            >
              <textarea
                rows={4}
                disabled={isSubmitting}
                placeholder="Motivo de la cita, preparación necesaria, observaciones..."
                className={`${inputClass(!!errors.notas)} resize-none`}
                {...register('notas')}
              />
            </Field>
          </div>
        </div>

        {/* Error del servidor */}
        {serverError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2.5">
            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}

        {/* Acciones */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/fisio/citas')}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || pacientesLoading || pacientes.length === 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                </svg>
                Crear cita
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
