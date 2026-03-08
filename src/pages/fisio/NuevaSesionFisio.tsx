// 🏥 Role: FISIO only

import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@/lib/zodResolver'
import { useNuevaSesion } from '@/hooks/useNuevaSesion'

// ─── Schema Zod ───────────────────────────────────────────────────────────────

const schema = z.object({
  paciente_id:          z.string().uuid('Selecciona un paciente'),
  fecha:                z.string().min(1, 'La fecha es obligatoria'),
  duracion_minutos:     z.coerce.number().int().min(15, 'Mínimo 15 min').max(180, 'Máximo 180 min'),
  dolor_inicio:         z.coerce.number().int().min(0).max(10),
  dolor_fin:            z.coerce.number().int().min(0).max(10),
  evolucion:            z.string().min(10, 'Mínimo 10 caracteres').max(2000, 'Máximo 2000 caracteres'),
  notas_sesion:         z.string().max(2000, 'Máximo 2000 caracteres').optional(),
  ejercicios_realizados: z.string().max(2000, 'Máximo 2000 caracteres').optional(),
})

type FormValues = z.infer<typeof schema>

// ─── Helpers de UI ────────────────────────────────────────────────────────────

function nowDatetimeLocal(): string {
  const d   = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  )
}

function inputClass(hasError?: boolean): string {
  return [
    'w-full px-3.5 py-2.5 rounded-lg border text-sm text-gray-900 placeholder-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition',
    'disabled:bg-gray-50 disabled:text-gray-400',
    hasError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white',
  ].join(' ')
}

function dolorColor(valor: number): string {
  if (valor <= 3) return 'text-green-600'
  if (valor <= 6) return 'text-amber-500'
  return 'text-red-600'
}

function dolorLabel(valor: number): string {
  if (valor === 0) return 'Sin dolor'
  if (valor <= 3) return 'Leve'
  if (valor <= 6) return 'Moderado'
  if (valor <= 8) return 'Intenso'
  return 'Insoportable'
}

// ─── Componente Field ─────────────────────────────────────────────────────────

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
        {required && (
          <span className="text-red-500 ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
      {error && (
        <p className="mt-1.5 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// ─── Componente slider EVA ────────────────────────────────────────────────────

function EvaSlider({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  disabled?: boolean
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span
          className={`text-lg font-bold tabular-nums ${dolorColor(value)}`}
          aria-live="polite"
        >
          {value}
          <span className="text-xs font-normal text-gray-400 ml-1">/10 — {dolorLabel(value)}</span>
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        disabled={disabled}
        onChange={e => onChange(Number(e.target.value))}
        aria-label={label}
        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
      />
      <div className="flex justify-between mt-1" aria-hidden="true">
        <span className="text-xs text-green-600">0 — Sin dolor</span>
        <span className="text-xs text-amber-500">5 — Moderado</span>
        <span className="text-xs text-red-600">10 — Máximo</span>
      </div>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export function NuevaSesionFisio() {
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedId  = searchParams.get('paciente') ?? ''

  const { pacientes, loading: pacientesLoading, submitting, error: loadError, crearSesion } =
    useNuevaSesion()

  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      paciente_id:          preselectedId,
      fecha:                nowDatetimeLocal(),
      duracion_minutos:     60,
      dolor_inicio:         0,
      dolor_fin:            0,
      evolucion:            '',
      notas_sesion:         '',
      ejercicios_realizados: '',
    },
  })

  // Nombre del paciente preseleccionado (para el modo readonly)
  const pacientePreseleccionado = preselectedId
    ? pacientes.find(p => p.id === preselectedId)
    : null

  const isBusy = isSubmitting || submitting

  // ── Submit ──────────────────────────────────────────────────────────────────
  const onSubmit = async (data: FormValues) => {
    setServerError(null)
    try {
      const result = await crearSesion(data)
      navigate(`/fisio/pacientes/${result.paciente_id}`)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error al guardar la sesión')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Volver atrás"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva sesión clínica</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Registra los detalles de la sesión con el paciente
          </p>
        </div>
      </div>

      {/* Error al cargar pacientes */}
      {loadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {loadError}
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
              ) : preselectedId ? (
                /* Modo readonly: paciente fijado desde query param */
                <div className="flex items-center justify-between gap-3">
                  <div className={`${inputClass()} flex-1 cursor-default`}>
                    {pacientePreseleccionado
                      ? `${pacientePreseleccionado.apellidos}, ${pacientePreseleccionado.nombre}`
                      : preselectedId}
                  </div>
                  <Link
                    to="/fisio/sesiones/nueva"
                    className="text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap font-medium"
                  >
                    Cambiar paciente
                  </Link>
                  {/* Campo oculto para que React Hook Form registre el valor */}
                  <input type="hidden" {...register('paciente_id')} />
                </div>
              ) : (
                <select
                  className={inputClass(!!errors.paciente_id)}
                  disabled={isBusy || pacientesLoading}
                  {...register('paciente_id')}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Selecciona un paciente...
                  </option>
                  {pacientes.length === 0 ? (
                    <option value="" disabled>
                      No tienes pacientes activos
                    </option>
                  ) : (
                    pacientes.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.apellidos}, {p.nombre}
                      </option>
                    ))
                  )}
                </select>
              )}
              {!pacientesLoading && pacientes.length === 0 && !loadError && !preselectedId && (
                <p className="mt-1.5 text-xs text-amber-600">
                  No tienes pacientes activos asignados. Registra un paciente primero.
                </p>
              )}
            </Field>
          </div>

          {/* Sección: Fecha y duración */}
          <div className="p-6 space-y-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Fecha y duración
            </h2>

            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Fecha y hora" required error={errors.fecha?.message}>
                <input
                  type="datetime-local"
                  disabled={isBusy}
                  className={inputClass(!!errors.fecha)}
                  {...register('fecha')}
                />
              </Field>

              <Field
                label="Duración (minutos)"
                required
                error={errors.duracion_minutos?.message}
                hint="Entre 15 y 180 minutos"
              >
                <input
                  type="number"
                  min={15}
                  max={180}
                  step={5}
                  disabled={isBusy}
                  className={inputClass(!!errors.duracion_minutos)}
                  {...register('duracion_minutos')}
                />
              </Field>
            </div>
          </div>

          {/* Sección: Escala de dolor EVA */}
          <div className="p-6 space-y-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Escala de dolor EVA
            </h2>

            <Controller
              name="dolor_inicio"
              control={control}
              render={({ field }) => (
                <EvaSlider
                  label="Dolor al inicio (EVA)"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isBusy}
                />
              )}
            />

            <Controller
              name="dolor_fin"
              control={control}
              render={({ field }) => (
                <EvaSlider
                  label="Dolor al final (EVA)"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isBusy}
                />
              )}
            />
          </div>

          {/* Sección: Evolución y notas */}
          <div className="p-6 space-y-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Evolución y notas
            </h2>

            <Field
              label="Notas de evolución"
              required
              error={errors.evolucion?.message}
              hint="Mínimo 10 caracteres"
            >
              <textarea
                rows={4}
                disabled={isBusy}
                placeholder="Describe la evolución del paciente en esta sesión..."
                className={`${inputClass(!!errors.evolucion)} resize-none`}
                {...register('evolucion')}
              />
            </Field>

            <Field
              label="Notas de sesión"
              error={errors.notas_sesion?.message}
              hint="Observaciones generales, técnicas aplicadas, incidencias... (opcional)"
            >
              <textarea
                rows={3}
                disabled={isBusy}
                placeholder="Observaciones, técnicas aplicadas, incidencias..."
                className={`${inputClass(!!errors.notas_sesion)} resize-none`}
                {...register('notas_sesion')}
              />
            </Field>

            <Field
              label="Ejercicios realizados"
              error={errors.ejercicios_realizados?.message}
              hint="Lista los ejercicios realizados durante la sesión (opcional)"
            >
              <textarea
                rows={3}
                disabled={isBusy}
                placeholder="Lista los ejercicios realizados durante la sesión..."
                className={`${inputClass(!!errors.ejercicios_realizados)} resize-none`}
                {...register('ejercicios_realizados')}
              />
            </Field>
          </div>
        </div>

        {/* Error del servidor */}
        {serverError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2.5">
            <svg
              className="w-4 h-4 text-red-500 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}

        {/* Acciones */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={isBusy}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isBusy || pacientesLoading || (!preselectedId && pacientes.length === 0)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {isBusy ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth={4}
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Guardar sesión
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
