// 🏥 Role: FISIO only

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCitasFisio } from '@/hooks/useCitasFisio'
import type { FiltroEstado, FiltroFecha } from '@/hooks/useCitasFisio'
import type { Views } from '@/lib/supabase'
import type { EstadoCita } from '@/types/database.types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFechaHora(isoString: string): { linea1: string; linea2: string } {
  const d = new Date(isoString)
  const linea1 = d.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  const linea2 = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  // Capitaliza el primer carácter del día (lun → Lun)
  return {
    linea1: linea1.charAt(0).toUpperCase() + linea1.slice(1),
    linea2,
  }
}

// ─── Config de estados ───────────────────────────────────────────────────────

interface EstadoConfig {
  label: string
  badgeClasses: string
}

const ESTADO_CONFIG: Record<EstadoCita, EstadoConfig> = {
  pendiente:  { label: 'Pendiente',  badgeClasses: 'bg-amber-50 text-amber-700' },
  confirmada: { label: 'Confirmada', badgeClasses: 'bg-blue-50 text-blue-700'  },
  completada: { label: 'Completada', badgeClasses: 'bg-green-50 text-green-700' },
  cancelada:  { label: 'Cancelada',  badgeClasses: 'bg-red-50 text-red-600'    },
  no_asistio: { label: 'No asistió', badgeClasses: 'bg-gray-100 text-gray-500'  },
}

const FILTROS_ESTADO: { value: FiltroEstado; label: string }[] = [
  { value: 'todas',      label: 'Todas'      },
  { value: 'pendiente',  label: 'Pendiente'  },
  { value: 'confirmada', label: 'Confirmada' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada',  label: 'Cancelada'  },
]

const FILTROS_FECHA: { value: FiltroFecha; label: string }[] = [
  { value: 'hoy',    label: 'Hoy'         },
  { value: 'semana', label: 'Esta semana' },
  { value: 'mes',    label: 'Este mes'    },
  { value: 'todas',  label: 'Todas'       },
]

// ─── Confirm dialog ──────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  confirmClasses: string
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmClasses,
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-sm p-6 space-y-4">
        <h2 id="dialog-title" className="text-base font-semibold text-gray-900">
          {title}
        </h2>
        <p className="text-sm text-gray-500">{description}</p>

        <div className="flex gap-3 justify-end pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${confirmClasses}`}
          >
            {loading && (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton loader ─────────────────────────────────────────────────────────

function CitaCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="h-4 w-32 bg-gray-100 rounded" />
          <div className="h-3 w-16 bg-gray-100 rounded" />
        </div>
        <div className="h-5 w-20 bg-gray-100 rounded-full" />
      </div>
      <div className="h-4 w-44 bg-gray-100 rounded" />
      <div className="flex gap-2 pt-1">
        <div className="h-7 w-24 bg-gray-100 rounded-lg" />
        <div className="h-7 w-20 bg-gray-100 rounded-lg" />
      </div>
    </div>
  )
}

// ─── Cita card (mobile + desktop) ────────────────────────────────────────────

interface CitaCardProps {
  cita: Views<'v_citas'>
  onCompletar: (cita: Views<'v_citas'>) => void
  onCancelar: (cita: Views<'v_citas'>) => void
}

function CitaBadge({ estado }: { estado: EstadoCita }) {
  const cfg = ESTADO_CONFIG[estado] ?? ESTADO_CONFIG.pendiente
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${cfg.badgeClasses}`}>
      {cfg.label}
    </span>
  )
}

function CitaCard({ cita, onCompletar, onCancelar }: CitaCardProps) {
  const { linea1, linea2 } = formatFechaHora(cita.fecha_hora)
  const puedeAccionar = cita.estado === 'pendiente' || cita.estado === 'confirmada'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      {/* Cabecera: fecha + badge */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">{linea1} · {linea2}</p>
          <p className="text-xs text-gray-400 mt-0.5">{cita.duracion_minutos} min</p>
        </div>
        <CitaBadge estado={cita.estado} />
      </div>

      {/* Paciente */}
      <div className="flex items-center gap-2.5">
        {/* Avatar inicial */}
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold shrink-0">
          {(cita.paciente_nombre[0] ?? '').toUpperCase()}
          {(cita.paciente_apellidos[0] ?? '').toUpperCase()}
        </div>
        <span className="text-sm text-gray-800 font-medium truncate">
          {cita.paciente_apellidos}, {cita.paciente_nombre}
        </span>
      </div>

      {/* Notas */}
      {cita.notas && (
        <p className="text-xs text-gray-500 line-clamp-2 bg-gray-50 rounded-lg px-3 py-2">
          {cita.notas}
        </p>
      )}

      {/* Acciones */}
      {puedeAccionar && (
        <div className="flex gap-2 pt-1 border-t border-gray-100">
          <button
            type="button"
            onClick={() => onCompletar(cita)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Completar
          </button>
          <button
            type="button"
            onClick={() => onCancelar(cita)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Desktop table row ────────────────────────────────────────────────────────

interface CitaRowProps {
  cita: Views<'v_citas'>
  onCompletar: (cita: Views<'v_citas'>) => void
  onCancelar: (cita: Views<'v_citas'>) => void
}

function CitaRow({ cita, onCompletar, onCancelar }: CitaRowProps) {
  const { linea1, linea2 } = formatFechaHora(cita.fecha_hora)
  const puedeAccionar = cita.estado === 'pendiente' || cita.estado === 'confirmada'

  return (
    <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
      {/* Fecha / hora */}
      <td className="px-4 py-3 whitespace-nowrap">
        <p className="text-sm font-semibold text-gray-900">{linea1}</p>
        <p className="text-xs text-gray-400">{linea2} · {cita.duracion_minutos} min</p>
      </td>

      {/* Paciente */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold shrink-0">
            {(cita.paciente_nombre[0] ?? '').toUpperCase()}
            {(cita.paciente_apellidos[0] ?? '').toUpperCase()}
          </div>
          <span className="text-sm font-medium text-gray-900">
            {cita.paciente_apellidos}, {cita.paciente_nombre}
          </span>
        </div>
      </td>

      {/* Notas */}
      <td className="px-4 py-3 max-w-xs">
        {cita.notas ? (
          <p className="text-sm text-gray-500 line-clamp-2">{cita.notas}</p>
        ) : (
          <span className="text-sm text-gray-300">—</span>
        )}
      </td>

      {/* Estado */}
      <td className="px-4 py-3 whitespace-nowrap">
        <CitaBadge estado={cita.estado} />
      </td>

      {/* Acciones */}
      <td className="px-4 py-3 whitespace-nowrap text-right">
        {puedeAccionar && (
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => onCompletar(cita)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Completar
            </button>
            <button
              type="button"
              onClick={() => onCancelar(cita)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancelar
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

// ─── Desktop skeleton rows ────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      {[140, 180, 120, 80, 160].map((w, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700">No hay citas para los filtros seleccionados</p>
        <p className="text-xs text-gray-400 mt-0.5">Prueba cambiando el periodo o el estado</p>
      </div>
      <Link
        to="/fisio/citas/nueva"
        className="mt-1 flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Crear primera cita
      </Link>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PendingAction {
  cita: Views<'v_citas'>
  tipo: 'completar' | 'cancelar'
}

export function CitasFisio() {
  const {
    citas,
    loading,
    error,
    filtroEstado,
    setFiltroEstado,
    filtroFecha,
    setFiltroFecha,
    cancelarCita,
    completarCita,
  } = useCitasFisio()

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [actionLoading, setActionLoading]  = useState(false)
  const [actionError, setActionError]      = useState<string | null>(null)

  const handleCompletar = (cita: Views<'v_citas'>) => {
    setActionError(null)
    setPendingAction({ cita, tipo: 'completar' })
  }

  const handleCancelar = (cita: Views<'v_citas'>) => {
    setActionError(null)
    setPendingAction({ cita, tipo: 'cancelar' })
  }

  const handleConfirm = async () => {
    if (!pendingAction) return
    setActionLoading(true)
    setActionError(null)
    try {
      if (pendingAction.tipo === 'completar') {
        await completarCita(pendingAction.cita.id)
      } else {
        await cancelarCita(pendingAction.cita.id)
      }
      setPendingAction(null)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error al actualizar la cita')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDialogCancel = () => {
    if (!actionLoading) setPendingAction(null)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Citas</h1>
          {!loading && (
            <p className="text-sm text-gray-500 mt-0.5">
              {citas.length} {citas.length === 1 ? 'cita' : 'citas'} encontradas
            </p>
          )}
        </div>
        <Link
          to="/fisio/citas/nueva"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva cita
        </Link>
      </div>

      {/* Error de carga */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Error de accion */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2.5">
          <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-red-700">{actionError}</p>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col gap-3">
        {/* Filtro de estado — chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-400 shrink-0">Estado:</span>
          {FILTROS_ESTADO.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFiltroEstado(f.value)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                filtroEstado === f.value
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Filtro de fecha — chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-400 shrink-0">Periodo:</span>
          {FILTROS_FECHA.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFiltroFecha(f.value)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                filtroFecha === f.value
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla — desktop */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha y hora</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Paciente</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Notas</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
            ) : citas.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState />
                </td>
              </tr>
            ) : (
              citas.map(cita => (
                <CitaRow
                  key={cita.id}
                  cita={cita}
                  onCompletar={handleCompletar}
                  onCancelar={handleCancelar}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <CitaCardSkeleton key={i} />)
        ) : citas.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 px-4">
            <EmptyState />
          </div>
        ) : (
          citas.map(cita => (
            <CitaCard
              key={cita.id}
              cita={cita}
              onCompletar={handleCompletar}
              onCancelar={handleCancelar}
            />
          ))
        )}
      </div>

      {/* Dialog de confirmación */}
      {pendingAction && (
        <ConfirmDialog
          open={true}
          title={
            pendingAction.tipo === 'completar'
              ? 'Marcar como completada'
              : 'Cancelar cita'
          }
          description={
            pendingAction.tipo === 'completar'
              ? `¿Confirmas que la cita de ${pendingAction.cita.paciente_nombre} ${pendingAction.cita.paciente_apellidos} fue completada?`
              : `¿Seguro que quieres cancelar la cita de ${pendingAction.cita.paciente_nombre} ${pendingAction.cita.paciente_apellidos}? Esta acción no se puede deshacer.`
          }
          confirmLabel={pendingAction.tipo === 'completar' ? 'Sí, completar' : 'Sí, cancelar'}
          confirmClasses={
            pendingAction.tipo === 'completar'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }
          loading={actionLoading}
          onConfirm={handleConfirm}
          onCancel={handleDialogCancel}
        />
      )}
    </div>
  )
}
