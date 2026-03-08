// 🏥 Role: FISIO only

import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@/lib/zodResolver'
import { useNuevaRutina } from '@/hooks/useNuevaRutina'
import type { Ejercicio, DetalleInput } from '@/hooks/useNuevaRutina'
import type { DificultadEjercicio } from '@/types/database.types'

// ─── Constantes ───────────────────────────────────────────────────────────────

const DIFICULTAD_BADGE: Record<DificultadEjercicio, string> = {
  basico:     'bg-green-100 text-green-700',
  intermedio: 'bg-amber-100 text-amber-700',
  avanzado:   'bg-red-100 text-red-700',
}

const DIFICULTAD_LABELS: Record<DificultadEjercicio, string> = {
  basico:     'Basico',
  intermedio: 'Intermedio',
  avanzado:   'Avanzado',
}

// ─── Schema plan ──────────────────────────────────────────────────────────────

const schema = z.object({
  nombre:      z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: z.string().max(1000).optional().or(z.literal('')),
  paciente_id: z.string().min(1, 'Selecciona un paciente'),
  fecha_inicio: z.string().min(1, 'La fecha de inicio es requerida'),
  fecha_fin:    z.string().optional().or(z.literal('')),
  activo:       z.boolean(),
})

type FormValues = z.infer<typeof schema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO(): string {
  const d  = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

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

// ─── Fila de ejercicio añadido al plan ────────────────────────────────────────

interface FilaDetalleProps {
  detalle: DetalleInput & { ejercicioNombre: string }
  disabled: boolean
  onChange: (id: string, field: keyof DetalleInput, value: unknown) => void
  onEliminar: (id: string) => void
}

function FilaDetalle({ detalle, disabled, onChange, onEliminar }: FilaDetalleProps) {
  return (
    <li className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      {/* Cabecera de la fila */}
      <div className="flex items-center gap-3">
        {/* Drag handle decorativo */}
        <span className="text-gray-300 cursor-grab select-none" aria-hidden="true">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 110 4 2 2 0 010-4zM13 2a2 2 0 110 4 2 2 0 010-4zM7 8a2 2 0 110 4 2 2 0 010-4zM13 8a2 2 0 110 4 2 2 0 010-4zM7 14a2 2 0 110 4 2 2 0 010-4zM13 14a2 2 0 110 4 2 2 0 010-4z" />
          </svg>
        </span>
        <span className="flex-1 text-sm font-semibold text-gray-900 leading-snug">
          {detalle.ejercicioNombre}
        </span>
        <button
          type="button"
          onClick={() => onEliminar(detalle.ejercicio_id)}
          disabled={disabled}
          aria-label={`Eliminar ${detalle.ejercicioNombre} del plan`}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Inputs de configuracion */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Series</label>
          <input
            type="number"
            min={1} max={20}
            disabled={disabled}
            value={detalle.series}
            onChange={e => onChange(detalle.ejercicio_id, 'series', Math.max(1, Math.min(20, Number(e.target.value))))}
            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-center"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Reps</label>
          <input
            type="number"
            min={1} max={100}
            disabled={disabled}
            value={detalle.repeticiones}
            onChange={e => onChange(detalle.ejercicio_id, 'repeticiones', Math.max(1, Math.min(100, Number(e.target.value))))}
            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-center"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Descanso (s)</label>
          <input
            type="number"
            min={0} max={300}
            disabled={disabled}
            value={detalle.descanso_segundos}
            onChange={e => onChange(detalle.ejercicio_id, 'descanso_segundos', Math.max(0, Math.min(300, Number(e.target.value))))}
            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-center"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Duracion (s)</label>
          <input
            type="number"
            min={0}
            disabled={disabled}
            placeholder="—"
            value={detalle.duracion_segundos ?? ''}
            onChange={e => {
              const v = e.target.value
              onChange(detalle.ejercicio_id, 'duracion_segundos', v === '' ? null : Number(v))
            }}
            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-center"
          />
        </div>
      </div>

      {/* Notas del ejercicio */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Notas / Instrucciones especificas
        </label>
        <textarea
          rows={2}
          disabled={disabled}
          placeholder="Indicaciones particulares para este paciente (opcional)"
          value={detalle.notas}
          onChange={e => onChange(detalle.ejercicio_id, 'notas', e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
        />
      </div>
    </li>
  )
}

// ─── Pagina principal ─────────────────────────────────────────────────────────

export function NuevaRutinaFisio() {
  const navigate      = useNavigate()
  const [params]      = useSearchParams()
  const pacienteParam = params.get('paciente') ?? ''

  const { pacientes, ejercicios, loading, submitting, error: hookError, crearPlan } = useNuevaRutina()

  const [busquedaEj, setBusquedaEj]       = useState('')
  const [detalles, setDetalles]           = useState<Array<DetalleInput & { ejercicioNombre: string }>>([])
  const [errorEjercicios, setErrorEjercicios] = useState<string | null>(null)
  const [serverError, setServerError]     = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre:       '',
      descripcion:  '',
      paciente_id:  pacienteParam,
      fecha_inicio: todayISO(),
      fecha_fin:    '',
      activo:       true,
    },
  })

  // Pre-seleccionar paciente si viene por query param
  useEffect(() => {
    if (pacienteParam) setValue('paciente_id', pacienteParam)
  }, [pacienteParam, setValue])

  // Nombre del paciente pre-seleccionado (para mostrarlo como solo lectura)
  const pacienteSeleccionado = useMemo(() => {
    if (!pacienteParam) return null
    return pacientes.find(p => p.id === pacienteParam) ?? null
  }, [pacienteParam, pacientes])

  // Ejercicios filtrados client-side por la busqueda
  const ejerciciosFiltrados = useMemo(() => {
    const q = busquedaEj.toLowerCase().trim()
    if (!q) return ejercicios.slice(0, 20)  // mostrar solo 20 si no hay busqueda
    return ejercicios.filter(e =>
      e.nombre.toLowerCase().includes(q) ||
      (e.categoria ?? '').toLowerCase().includes(q)
    ).slice(0, 30)
  }, [ejercicios, busquedaEj])

  // IDs ya añadidos (para no duplicar)
  const idsAñadidos = useMemo(() => new Set(detalles.map(d => d.ejercicio_id)), [detalles])

  const añadirEjercicio = (ej: Ejercicio) => {
    if (idsAñadidos.has(ej.id)) return
    setErrorEjercicios(null)
    setDetalles(prev => [...prev, {
      ejercicio_id:      ej.id,
      ejercicioNombre:   ej.nombre,
      orden:             prev.length + 1,
      series:            3,
      repeticiones:      10,
      descanso_segundos: 60,
      duracion_segundos: null,
      notas:             '',
    }])
  }

  const eliminarEjercicio = (ejercicioId: string) => {
    setDetalles(prev => prev.filter(d => d.ejercicio_id !== ejercicioId))
  }

  const cambiarCampoDetalle = (ejercicioId: string, field: keyof DetalleInput, value: unknown) => {
    setDetalles(prev =>
      prev.map(d => d.ejercicio_id === ejercicioId ? { ...d, [field]: value } : d)
    )
  }

  const isDisabled = isSubmitting || submitting

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    setErrorEjercicios(null)

    if (detalles.length === 0) {
      setErrorEjercicios('Debes añadir al menos un ejercicio al plan.')
      return
    }

    try {
      const { paciente_id } = await crearPlan(
        {
          nombre:       values.nombre,
          descripcion:  values.descripcion ?? '',
          paciente_id:  values.paciente_id,
          fecha_inicio: values.fecha_inicio,
          fecha_fin:    values.fecha_fin ?? '',
          activo:       values.activo,
        },
        detalles.map((d, idx) => ({
          ejercicio_id:      d.ejercicio_id,
          orden:             idx + 1,
          series:            d.series,
          repeticiones:      d.repeticiones,
          descanso_segundos: d.descanso_segundos,
          duracion_segundos: d.duracion_segundos,
          notas:             d.notas,
        })),
      )
      navigate(`/fisio/pacientes/${paciente_id}`)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error al crear el plan')
    }
  }

  const activoValue = watch('activo')

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Cabecera */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Volver"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva rutina</h1>
          <p className="text-sm text-gray-500 mt-0.5">Crea y asigna un plan de ejercicios a un paciente</p>
        </div>
      </div>

      {/* Error del hook */}
      {hookError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {hookError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

        {/* ── Sección 1: Datos del plan ──────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">

          <div className="px-6 py-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Datos del plan
            </h2>
          </div>

          <div className="p-6 space-y-5">

            <Field label="Nombre del plan" required error={errors.nombre?.message}>
              <input
                type="text"
                placeholder="Ej. Recuperacion de hombro — Fase 1"
                disabled={isDisabled}
                className={inputClass(!!errors.nombre)}
                {...register('nombre')}
              />
            </Field>

            <Field
              label="Descripcion"
              hint="Objetivos del plan, observaciones generales (opcional)"
              error={errors.descripcion?.message}
            >
              <textarea
                rows={3}
                disabled={isDisabled}
                placeholder="Describe los objetivos y la progresion esperada..."
                className={`${inputClass(!!errors.descripcion)} resize-none`}
                {...register('descripcion')}
              />
            </Field>

            {/* Paciente */}
            <Field label="Paciente" required error={errors.paciente_id?.message}>
              {loading ? (
                <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ) : pacienteParam && pacienteSeleccionado ? (
                /* Paciente pre-seleccionado: mostrar info + enlace para cambiar */
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50">
                  <span className="text-sm text-gray-900">
                    {pacienteSeleccionado.apellidos}, {pacienteSeleccionado.nombre}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('paciente_id', '')
                      navigate('/fisio/rutinas/nueva', { replace: true })
                    }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <select
                  className={inputClass(!!errors.paciente_id)}
                  disabled={isDisabled || loading}
                  {...register('paciente_id')}
                  defaultValue={pacienteParam || ''}
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
            </Field>

            {/* Fechas */}
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Fecha de inicio" required error={errors.fecha_inicio?.message}>
                <input
                  type="date"
                  disabled={isDisabled}
                  className={inputClass(!!errors.fecha_inicio)}
                  {...register('fecha_inicio')}
                />
              </Field>

              <Field
                label="Fecha de fin"
                hint="Opcional"
                error={errors.fecha_fin?.message}
              >
                <input
                  type="date"
                  disabled={isDisabled}
                  className={inputClass(!!errors.fecha_fin)}
                  {...register('fecha_fin')}
                />
              </Field>
            </div>

            {/* Switch activo */}
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <button
                type="button"
                role="switch"
                aria-checked={activoValue}
                onClick={() => setValue('activo', !activoValue)}
                disabled={isDisabled}
                className={[
                  'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  activoValue ? 'bg-blue-600' : 'bg-gray-200',
                ].join(' ')}
              >
                <span
                  aria-hidden="true"
                  className={[
                    'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                    activoValue ? 'translate-x-5' : 'translate-x-0',
                  ].join(' ')}
                />
              </button>
              <div>
                <span className="text-sm font-medium text-gray-700">Plan activo</span>
                <p className="text-xs text-gray-400 mt-0.5">
                  El paciente vera este plan en su seccion de rutinas.
                </p>
              </div>
            </label>

          </div>
        </div>

        {/* ── Sección 2: Ejercicios del plan ────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">

          <div className="px-6 py-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Ejercicios del plan
            </h2>
          </div>

          <div className="p-6 space-y-4">

            {/* Buscador de ejercicios */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
              </svg>
              <input
                type="search"
                placeholder="Busca ejercicios para añadir al plan..."
                value={busquedaEj}
                onChange={e => setBusquedaEj(e.target.value)}
                disabled={isDisabled}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Lista de resultados de busqueda */}
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : ejerciciosFiltrados.length > 0 ? (
              <ul
                className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto"
                aria-label="Resultados de busqueda de ejercicios"
              >
                {ejerciciosFiltrados.map(ej => {
                  const yaAñadido = idsAñadidos.has(ej.id)
                  return (
                    <li key={ej.id}>
                      <button
                        type="button"
                        disabled={isDisabled || yaAñadido}
                        onClick={() => añadirEjercicio(ej)}
                        className={[
                          'w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors',
                          yaAñadido
                            ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                            : 'bg-white hover:bg-blue-50 hover:text-blue-700',
                        ].join(' ')}
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-medium truncate block">{ej.nombre}</span>
                          {ej.categoria && (
                            <span className="text-xs text-gray-400">{ej.categoria}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {ej.dificultad && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DIFICULTAD_BADGE[ej.dificultad]}`}>
                              {DIFICULTAD_LABELS[ej.dificultad]}
                            </span>
                          )}
                          {yaAñadido ? (
                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                          )}
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : busquedaEj ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No se encontraron ejercicios con esa busqueda.
              </p>
            ) : null}

            {/* Separador */}
            {detalles.length > 0 && (
              <div className="flex items-center gap-3 pt-2">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Plan — {detalles.length} ejercicio{detalles.length !== 1 ? 's' : ''}
                </span>
                <div className="flex-1 border-t border-gray-200" />
              </div>
            )}

            {/* Lista de ejercicios añadidos */}
            {detalles.length > 0 ? (
              <ul className="space-y-3">
                {detalles.map(d => (
                  <FilaDetalle
                    key={d.ejercicio_id}
                    detalle={d}
                    disabled={isDisabled}
                    onChange={cambiarCampoDetalle}
                    onEliminar={eliminarEjercicio}
                  />
                ))}
              </ul>
            ) : (
              /* Estado vacío */
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500">
                  Busca y añade ejercicios al plan
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Usa el buscador de arriba para encontrar ejercicios de la biblioteca
                </p>
              </div>
            )}

            {/* Error validacion ejercicios */}
            {errorEjercicios && (
              <p className="text-sm text-red-600 flex items-center gap-1.5" role="alert">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {errorEjercicios}
              </p>
            )}

          </div>
        </div>

        {/* Error servidor */}
        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2.5">
            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={isDisabled}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isDisabled || loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {isDisabled ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Creando plan...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Crear plan de ejercicios
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  )
}
