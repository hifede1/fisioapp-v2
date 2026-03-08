// 🏥 Role: FISIO only

import { useState, useMemo, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@/lib/zodResolver'
import { supabase } from '@/lib/supabase'
import { useEjerciciosFisio } from '@/hooks/useEjerciciosFisio'
import type { Ejercicio, EjercicioCrearInput, EjercicioActualizarInput } from '@/hooks/useEjerciciosFisio'
import type { DificultadEjercicio } from '@/types/database.types'

// ─── Constantes ───────────────────────────────────────────────────────────────

const DIFICULTAD_LABELS: Record<DificultadEjercicio, string> = {
  basico:     'Básico',
  intermedio: 'Intermedio',
  avanzado:   'Avanzado',
}

const DIFICULTAD_BADGE: Record<DificultadEjercicio, string> = {
  basico:     'bg-green-100 text-green-700',
  intermedio: 'bg-amber-100 text-amber-700',
  avanzado:   'bg-red-100 text-red-700',
}

// ─── Zod schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  nombre:            z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion:       z.string().max(1000).optional().or(z.literal('')),
  instrucciones:     z.string().max(2000).optional().or(z.literal('')),
  categoria:         z.string().max(100).optional().or(z.literal('')),
  dificultad:        z.enum(['basico', 'intermedio', 'avanzado']).optional().or(z.literal('')),
  musculos_objetivo: z.string().max(500).optional().or(z.literal('')),
  publico:           z.boolean(),
})

type FormValues = z.infer<typeof schema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Modal crear/editar ejercicio ─────────────────────────────────────────────

interface ModalEjercicioProps {
  ejercicio: Ejercicio | null   // null = crear, !null = editar
  fisioId: string
  onClose: () => void
  onSave: (data: EjercicioCrearInput | EjercicioActualizarInput, id?: string) => Promise<void>
}

function ModalEjercicio({ ejercicio, onClose, onSave }: ModalEjercicioProps) {
  const isEdit = ejercicio !== null
  const [serverError, setServerError] = useState<string | null>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre:            ejercicio?.nombre            ?? '',
      descripcion:       ejercicio?.descripcion       ?? '',
      instrucciones:     ejercicio?.instrucciones     ?? '',
      categoria:         ejercicio?.categoria         ?? '',
      dificultad:        ejercicio?.dificultad        ?? '',
      musculos_objetivo: ejercicio?.musculos_objetivo?.join(', ') ?? '',
      publico:           ejercicio?.publico           ?? false,
    },
  })

  // Foco al abrir
  useEffect(() => {
    firstInputRef.current?.focus()
  }, [])

  // Cerrar con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Bloquear scroll del body
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    try {
      const musculosStr = values.musculos_objetivo?.trim() ?? ''
      const musculos = musculosStr
        ? musculosStr.split(',').map(s => s.trim()).filter(Boolean)
        : null

      const payload: EjercicioCrearInput = {
        nombre:            values.nombre,
        descripcion:       values.descripcion?.trim() || null,
        instrucciones:     values.instrucciones?.trim() || null,
        categoria:         values.categoria?.trim() || null,
        dificultad:        (values.dificultad as DificultadEjercicio) || null,
        musculos_objetivo: musculos,
        publico:           values.publico,
      }

      await onSave(payload, ejercicio?.id)
      onClose()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error al guardar el ejercicio')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Editar ejercicio' : 'Nuevo ejercicio'}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl my-8 flex flex-col">

        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Editar ejercicio' : 'Nuevo ejercicio'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-6 space-y-5">

          <Field label="Nombre" required error={errors.nombre?.message}>
            <input
              type="text"
              placeholder="Ej. Sentadilla con banda"
              disabled={isSubmitting}
              className={inputClass(!!errors.nombre)}
              {...register('nombre')}
              ref={e => {
                register('nombre').ref(e)
                ;(firstInputRef as React.MutableRefObject<HTMLInputElement | null>).current = e
              }}
            />
          </Field>

          <Field label="Descripcion" hint="Breve descripción del ejercicio (opcional)" error={errors.descripcion?.message}>
            <textarea
              rows={3}
              disabled={isSubmitting}
              placeholder="Describe el ejercicio brevemente..."
              className={`${inputClass(!!errors.descripcion)} resize-none`}
              {...register('descripcion')}
            />
          </Field>

          <Field label="Instrucciones" hint="Pasos detallados para realizar el ejercicio (opcional)" error={errors.instrucciones?.message}>
            <textarea
              rows={4}
              disabled={isSubmitting}
              placeholder="1. Colócate de pie con los pies a la anchura de hombros&#10;2. ..."
              className={`${inputClass(!!errors.instrucciones)} resize-none`}
              {...register('instrucciones')}
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Categoria" hint="Ej. Fuerza, Movilidad, Cardio..." error={errors.categoria?.message}>
              <input
                type="text"
                disabled={isSubmitting}
                placeholder="Ej. Fuerza"
                className={inputClass(!!errors.categoria)}
                {...register('categoria')}
              />
            </Field>

            <Field label="Dificultad" error={errors.dificultad?.message}>
              <select
                disabled={isSubmitting}
                className={inputClass(!!errors.dificultad)}
                {...register('dificultad')}
                defaultValue={ejercicio?.dificultad ?? ''}
              >
                <option value="">Sin especificar</option>
                <option value="basico">Basico</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
              </select>
            </Field>
          </div>

          <Field
            label="Musculos objetivo"
            hint="Separados por coma. Ej: Cuadriceps, Gluteos, Isquiotibiales"
            error={errors.musculos_objetivo?.message}
          >
            <input
              type="text"
              disabled={isSubmitting}
              placeholder="Cuadriceps, Gluteos..."
              className={inputClass(!!errors.musculos_objetivo)}
              {...register('musculos_objetivo')}
            />
          </Field>

          {/* Checkbox publico */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <div className="flex items-center h-5 mt-0.5">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isSubmitting}
                {...register('publico')}
              />
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Ejercicio publico</span>
              <p className="text-xs text-gray-400 mt-0.5">
                Si lo marcas como publico, otros fisioterapeutas podran verlo en su biblioteca.
              </p>
            </div>
          </label>

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
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
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
                isEdit ? 'Guardar cambios' : 'Crear ejercicio'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="h-5 bg-gray-200 rounded w-2/3" />
        <div className="h-5 bg-gray-100 rounded w-16" />
      </div>
      <div className="flex gap-2">
        <div className="h-4 bg-gray-100 rounded w-20" />
        <div className="h-4 bg-gray-100 rounded w-16" />
      </div>
      <div className="h-4 bg-gray-100 rounded w-full" />
      <div className="h-4 bg-gray-100 rounded w-4/5" />
    </div>
  )
}

// ─── Card ejercicio ───────────────────────────────────────────────────────────

function EjercicioCard({
  ejercicio,
  esPropio,
  onEditar,
}: {
  ejercicio: Ejercicio
  esPropio: boolean
  onEditar: (e: Ejercicio) => void
}) {
  return (
    <article className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:border-blue-200 hover:shadow-sm transition-all">
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 leading-snug">{ejercicio.nombre}</h3>
        {ejercicio.dificultad && (
          <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${DIFICULTAD_BADGE[ejercicio.dificultad]}`}>
            {DIFICULTAD_LABELS[ejercicio.dificultad]}
          </span>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        {ejercicio.categoria && (
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
            {ejercicio.categoria}
          </span>
        )}
        {ejercicio.publico && (
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
            Publico
          </span>
        )}
        {esPropio && !ejercicio.publico && (
          <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
            Mio
          </span>
        )}
      </div>

      {/* Musculos */}
      {ejercicio.musculos_objetivo && ejercicio.musculos_objetivo.length > 0 && (
        <p className="text-xs text-gray-400">
          {ejercicio.musculos_objetivo.join(' · ')}
        </p>
      )}

      {/* Descripcion truncada */}
      {ejercicio.descripcion && (
        <p className="text-xs text-gray-500 line-clamp-2">{ejercicio.descripcion}</p>
      )}

      {/* Boton editar (solo propios) */}
      {esPropio && (
        <div className="pt-1 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={() => onEditar(ejercicio)}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Editar
          </button>
        </div>
      )}
    </article>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function EjerciciosFisio() {
  const { ejercicios, loading, error, crearEjercicio, actualizarEjercicio, refetch } = useEjerciciosFisio()

  const [fisioId, setFisioId] = useState<string | null>(null)
  const [busqueda, setBusqueda]               = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroDificultad, setFiltroDificultad] = useState<'' | DificultadEjercicio>('')
  const [modalAbierto, setModalAbierto]       = useState(false)
  const [ejercicioEditando, setEjercicioEditando] = useState<Ejercicio | null>(null)

  // Obtener fisioId para saber qué ejercicios son propios
  useEffect(() => {
    supabase.rpc('get_fisioterapeuta_id').then(({ data }) => {
      if (data) setFisioId(data as string)
    })
  }, [])

  // Categorias unicas del listado
  const categorias = useMemo(() => {
    const set = new Set(ejercicios.map(e => e.categoria).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [ejercicios])

  // Filtrado client-side
  const ejerciciosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim()
    return ejercicios.filter(e => {
      const matchNombre    = !q || e.nombre.toLowerCase().includes(q)
      const matchCategoria = !filtroCategoria || e.categoria === filtroCategoria
      const matchDif       = !filtroDificultad || e.dificultad === filtroDificultad
      return matchNombre && matchCategoria && matchDif
    })
  }, [ejercicios, busqueda, filtroCategoria, filtroDificultad])

  const abrirModalCrear = () => {
    setEjercicioEditando(null)
    setModalAbierto(true)
  }

  const abrirModalEditar = (e: Ejercicio) => {
    setEjercicioEditando(e)
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setEjercicioEditando(null)
  }

  const handleGuardar = async (
    data: EjercicioCrearInput | EjercicioActualizarInput,
    id?: string,
  ) => {
    if (id) {
      await actualizarEjercicio(id, data as EjercicioActualizarInput)
    } else {
      await crearEjercicio(data as EjercicioCrearInput)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Biblioteca de ejercicios</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Cargando...' : `${ejercicios.length} ejercicio${ejercicios.length !== 1 ? 's' : ''} disponibles`}
          </p>
        </div>
        <button
          type="button"
          onClick={abrirModalCrear}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo ejercicio
        </button>
      </div>

      {/* Error carga */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2.5">
          <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={refetch}
              className="text-xs font-medium text-red-600 underline mt-1"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Buscador */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
          </svg>
          <input
            type="search"
            placeholder="Buscar ejercicios..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Filtro categoria */}
        <select
          value={filtroCategoria}
          onChange={e => setFiltroCategoria(e.target.value)}
          aria-label="Filtrar por categoria"
          className="px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        >
          <option value="">Todas las categorias</option>
          {categorias.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Filtro dificultad */}
        <select
          value={filtroDificultad}
          onChange={e => setFiltroDificultad(e.target.value as '' | DificultadEjercicio)}
          aria-label="Filtrar por dificultad"
          className="px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        >
          <option value="">Todas las dificultades</option>
          <option value="basico">Basico</option>
          <option value="intermedio">Intermedio</option>
          <option value="avanzado">Avanzado</option>
        </select>
      </div>

      {/* Grid de ejercicios */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : ejerciciosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-600">
            {busqueda || filtroCategoria || filtroDificultad
              ? 'No hay ejercicios que coincidan con los filtros'
              : 'No hay ejercicios disponibles'}
          </p>
          {(busqueda || filtroCategoria || filtroDificultad) && (
            <button
              type="button"
              onClick={() => { setBusqueda(''); setFiltroCategoria(''); setFiltroDificultad('') }}
              className="mt-2 text-xs font-medium text-blue-600 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ejerciciosFiltrados.map(e => (
            <EjercicioCard
              key={e.id}
              ejercicio={e}
              esPropio={!!fisioId && e.creado_por === fisioId}
              onEditar={abrirModalEditar}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalAbierto && fisioId && (
        <ModalEjercicio
          ejercicio={ejercicioEditando}
          fisioId={fisioId}
          onClose={cerrarModal}
          onSave={handleGuardar}
        />
      )}
    </div>
  )
}
