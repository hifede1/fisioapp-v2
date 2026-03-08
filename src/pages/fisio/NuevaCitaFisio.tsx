// 🏥 Role: FISIO only

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@/lib/zodResolver'
import { supabase } from '@/lib/supabase'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  paciente_id:      z.string().min(1, 'Selecciona un paciente'),
  fecha:            z.string().min(1, 'La fecha es requerida'),
  hora:             z.string().min(1, 'La hora es requerida'),
  duracion_minutos: z.coerce.number().int().min(15).max(240),
  notas:            z.string().max(1000).optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

// ─── Tipos locales ────────────────────────────────────────────────────────────

interface PacienteOption {
  id: string
  nombre: string
  apellidos: string
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export function NuevaCitaFisio() {
  const navigate = useNavigate()

  const [pacientes, setPacientes]       = useState<PacienteOption[]>([])
  const [pacientesLoading, setPacientesLoading] = useState(true)
  const [pacientesError, setPacientesError]     = useState<string | null>(null)
  const [serverError, setServerError]   = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      duracion_minutos: 60,
    },
  })

  // ── Cargar pacientes activos del fisio ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function loadPacientes() {
      setPacientesLoading(true)
      setPacientesError(null)

      try {
        // Supabase JS v2.98: casteamos para evitar errores de tipos en filtros
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sb = supabase as any

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

  // ── Submit ──────────────────────────────────────────────────────────────────
  const onSubmit = async (data: FormValues) => {
    setServerError(null)

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      const { data: fisioIdRaw, error: rpcError } = await supabase.rpc('get_fisioterapeuta_id')
      if (rpcError || !fisioIdRaw) throw new Error('No se encontró el perfil de fisioterapeuta')
      const fisioId = fisioIdRaw as string

      const { error: insertError } = await sb
        .from('citas')
        .insert({
          fisioterapeuta_id: fisioId,
          paciente_id:       data.paciente_id,
          fecha_hora:        `${data.fecha}T${data.hora}:00`,
          duracion_minutos:  data.duracion_minutos,
          notas:             data.notas?.trim() || null,
          estado:            'pendiente',
        })

      if (insertError) throw insertError

      navigate('/fisio/citas')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error al crear la cita')
    }
  }

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

              <Field label="Hora" required error={errors.hora?.message}>
                <input
                  type="time"
                  step={900}
                  disabled={isSubmitting}
                  className={inputClass(!!errors.hora)}
                  {...register('hora')}
                />
              </Field>
            </div>

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
