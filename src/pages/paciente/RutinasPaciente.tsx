// Role: PACIENTE only
import { useEffect, useRef, useState } from 'react'
import { useRutinasPaciente } from '@/hooks/useRutinasPaciente'
import type { EjercicioDetalle, PlanConEjercicios } from '@/hooks/useRutinasPaciente'
import type { DificultadEjercicio } from '@/types/database.types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Progress percentage (0–100) based on elapsed days vs. total duration. */
function calcProgreso(fechaInicio: string | null, fechaFin: string | null): number | null {
  if (!fechaInicio || !fechaFin) return null
  const inicio = new Date(fechaInicio).getTime()
  const fin = new Date(fechaFin).getTime()
  const ahora = Date.now()
  if (fin <= inicio) return null
  return Math.min(100, Math.max(0, Math.round(((ahora - inicio) / (fin - inicio)) * 100)))
}

const dificultadConfig: Record<DificultadEjercicio, { label: string; classes: string }> = {
  basico:     { label: 'Básico',      classes: 'bg-green-50 text-green-700' },
  intermedio: { label: 'Intermedio',  classes: 'bg-amber-50 text-amber-700' },
  avanzado:   { label: 'Avanzado',    classes: 'bg-red-50 text-red-700' },
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="h-5 bg-gray-200 rounded w-40" />
        <div className="h-5 bg-gray-100 rounded-full w-16" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-2/3" />
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

// ─── Modal de instrucciones ──────────────────────────────────────────────────

interface ModalInstruccionesProps {
  detalle: EjercicioDetalle
  onClose: () => void
}

function ModalInstrucciones({ detalle, onClose }: ModalInstruccionesProps) {
  const { ejercicios: ej } = detalle
  const overlayRef = useRef<HTMLDivElement>(null)

  // Cerrar con Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Bloquear scroll del body mientras el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) onClose()
  }

  const dificultad = ej.dificultad ? dificultadConfig[ej.dificultad] : null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
    >
      <div className="bg-white w-full sm:max-w-lg sm:rounded-xl rounded-t-xl max-h-[90dvh] flex flex-col shadow-xl">
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
          <h2 id="modal-titulo" className="text-base font-semibold text-gray-900 leading-snug">
            {ej.nombre}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar instrucciones"
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido desplazable */}
        <div className="overflow-y-auto p-5 space-y-4">
          {/* Badges de metadatos */}
          {(dificultad || ej.musculos_objetivo?.length) && (
            <div className="flex flex-wrap gap-2">
              {dificultad && (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${dificultad.classes}`}>
                  {dificultad.label}
                </span>
              )}
              {ej.musculos_objetivo?.map(musculo => (
                <span
                  key={musculo}
                  className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700"
                >
                  {musculo}
                </span>
              ))}
            </div>
          )}

          {/* Descripción */}
          {ej.descripcion && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Descripción
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{ej.descripcion}</p>
            </div>
          )}

          {/* Instrucciones */}
          {ej.instrucciones && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Instrucciones
              </p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {ej.instrucciones}
              </p>
            </div>
          )}

          {/* Notas del fisio para este detalle */}
          {detalle.notas && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">
                Notas de tu fisio
              </p>
              <p className="text-sm text-emerald-900 leading-relaxed">{detalle.notas}</p>
            </div>
          )}

          {/* Prescripción de la serie */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Prescripción
            </p>
            <div className="flex flex-wrap gap-2">
              {detalle.series != null && (
                <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                  {detalle.series} series
                </span>
              )}
              {detalle.repeticiones != null && (
                <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                  {detalle.repeticiones} reps
                </span>
              )}
              {detalle.duracion_segundos != null && detalle.duracion_segundos > 0 && (
                <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                  {detalle.duracion_segundos}s duración
                </span>
              )}
              {detalle.descanso_segundos != null && detalle.descanso_segundos > 0 && (
                <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                  {detalle.descanso_segundos}s descanso
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Fila de ejercicio ───────────────────────────────────────────────────────

interface EjercicioRowProps {
  detalle: EjercicioDetalle
  index: number
}

function EjercicioRow({ detalle, index }: EjercicioRowProps) {
  const [modalAbierto, setModalAbierto] = useState(false)
  const { ejercicios: ej } = detalle

  return (
    <>
      <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
        {/* Número de orden */}
        <div className="shrink-0 w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
          <span className="text-xs font-semibold text-emerald-700">{index + 1}</span>
        </div>

        {/* Nombre + chips */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">{ej.nombre}</p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {detalle.series != null && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {detalle.series} series
              </span>
            )}
            {detalle.repeticiones != null && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {detalle.repeticiones} reps
              </span>
            )}
            {detalle.duracion_segundos != null && detalle.duracion_segundos > 0 && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {detalle.duracion_segundos}s
              </span>
            )}
            {detalle.descanso_segundos != null && detalle.descanso_segundos > 0 && (
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                {detalle.descanso_segundos}s descanso
              </span>
            )}
          </div>
        </div>

        {/* Botón instrucciones */}
        <button
          onClick={() => setModalAbierto(true)}
          aria-label={`Ver instrucciones de ${ej.nombre}`}
          className="shrink-0 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
        >
          Ver instrucciones
        </button>
      </div>

      {modalAbierto && (
        <ModalInstrucciones
          detalle={detalle}
          onClose={() => setModalAbierto(false)}
        />
      )}
    </>
  )
}

// ─── Card de plan ────────────────────────────────────────────────────────────

const UMBRAL_COLAPSADO = 3

interface PlanCardProps {
  plan: PlanConEjercicios
}

function PlanCard({ plan }: PlanCardProps) {
  const progreso = calcProgreso(plan.fecha_inicio, plan.fecha_fin)
  const detalles = plan.plan_ejercicios_detalle
  const necesitaAcordeon = detalles.length > UMBRAL_COLAPSADO
  const [expandido, setExpandido] = useState(!necesitaAcordeon)

  const ejerciciosVisibles = expandido ? detalles : detalles.slice(0, UMBRAL_COLAPSADO)
  const restantes = detalles.length - UMBRAL_COLAPSADO

  return (
    <article className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Cabecera del plan */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h2 className="text-base font-bold text-gray-900 leading-snug">{plan.nombre}</h2>
          <span className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
            Activo
          </span>
        </div>

        {/* Fechas */}
        {(plan.fecha_inicio || plan.fecha_fin) && (
          <p className="text-xs text-gray-500 mt-1">
            {plan.fecha_inicio && `Desde ${formatDate(plan.fecha_inicio)}`}
            {plan.fecha_inicio && plan.fecha_fin && ' · '}
            {plan.fecha_fin && `Hasta ${formatDate(plan.fecha_fin)}`}
          </p>
        )}

        {/* Descripción */}
        {plan.descripcion && (
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">{plan.descripcion}</p>
        )}

        {/* Barra de progreso */}
        {progreso !== null && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 font-medium">Progreso del plan</span>
              <span className="text-xs font-semibold text-emerald-700">{progreso}%</span>
            </div>
            <div
              className="h-2 bg-gray-100 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={progreso}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progreso del plan: ${progreso}%`}
            >
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Lista de ejercicios */}
      {detalles.length === 0 ? (
        <div className="px-5 pb-5">
          <p className="text-sm text-gray-400 italic">Este plan aún no tiene ejercicios asignados.</p>
        </div>
      ) : (
        <div className="border-t border-gray-100 px-5">
          <div className="divide-y divide-gray-100">
            {ejerciciosVisibles.map((detalle, i) => (
              <EjercicioRow key={detalle.id} detalle={detalle} index={i} />
            ))}
          </div>

          {/* Botón expandir / colapsar */}
          {necesitaAcordeon && (
            <button
              onClick={() => setExpandido(prev => !prev)}
              aria-expanded={expandido}
              className="w-full flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
            >
              {expandido ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                  Ver menos
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  Ver {restantes} ejercicio{restantes !== 1 ? 's' : ''} más
                </>
              )}
            </button>
          )}
        </div>
      )}
    </article>
  )
}

// ─── Estado vacío ────────────────────────────────────────────────────────────

function EstadoVacio() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-emerald-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-gray-700 mb-1">Sin rutinas asignadas</h2>
      <p className="text-sm text-gray-400 max-w-xs">
        Tu fisioterapeuta aún no te ha asignado ninguna rutina. Aparecerán aquí en cuanto lo haga.
      </p>
    </div>
  )
}

// ─── Página principal ────────────────────────────────────────────────────────

export function RutinasPaciente() {
  const { planes, loading, error } = useRutinasPaciente()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Cabecera */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis rutinas</h1>
        {!loading && (
          <p className="text-sm text-gray-500 mt-0.5">
            {planes.length === 0
              ? 'Sin planes activos por ahora'
              : `${planes.length} plan${planes.length !== 1 ? 'es' : ''} activo${planes.length !== 1 ? 's' : ''}`}
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Carga */}
      {loading && (
        <div className="space-y-4" aria-busy="true" aria-label="Cargando rutinas">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Contenido */}
      {!loading && !error && (
        planes.length === 0
          ? <EstadoVacio />
          : (
            <div className="space-y-4">
              {planes.map(plan => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          )
      )}
    </div>
  )
}
