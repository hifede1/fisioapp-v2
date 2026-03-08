// 🏥 Role: FISIO only

import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useHistorialPaciente } from '@/hooks/useHistorialPaciente'
import type { Sesion, NotaClinica, Tratamiento, CitaResumen, PlanEjercicio } from '@/hooks/useHistorialPaciente'
import type { EstadoCita, EstadoTratamiento, TipoNota } from '@/types/database.types'

// ─── Helpers de fecha ─────────────────────────────────────────────────────────

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatFechaHora(iso: string): string {
  const d = new Date(iso)
  const fecha = d.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  const hora = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  const cap = fecha.charAt(0).toUpperCase() + fecha.slice(1)
  return `${cap} · ${hora}`
}

// ─── Config de estados ────────────────────────────────────────────────────────

const ESTADO_CITA_CONFIG: Record<EstadoCita, { label: string; classes: string }> = {
  pendiente:  { label: 'Pendiente',  classes: 'bg-amber-50 text-amber-700' },
  confirmada: { label: 'Confirmada', classes: 'bg-blue-50 text-blue-700'   },
  completada: { label: 'Completada', classes: 'bg-green-50 text-green-700' },
  cancelada:  { label: 'Cancelada',  classes: 'bg-red-50 text-red-600'     },
  no_asistio: { label: 'No asistió', classes: 'bg-gray-100 text-gray-500'  },
}

const ESTADO_TRATAMIENTO_CONFIG: Record<EstadoTratamiento, { label: string; classes: string }> = {
  activo:     { label: 'Activo',     classes: 'bg-green-50 text-green-700' },
  completado: { label: 'Completado', classes: 'bg-blue-50 text-blue-700'   },
  suspendido: { label: 'Suspendido', classes: 'bg-gray-100 text-gray-500'  },
}

const TIPO_NOTA_CONFIG: Record<TipoNota, { label: string; classes: string }> = {
  general:    { label: 'General',   classes: 'bg-gray-100 text-gray-600'   },
  evolucion:  { label: 'Evolución', classes: 'bg-blue-50 text-blue-700'    },
  incidencia: { label: 'Incidencia',classes: 'bg-amber-50 text-amber-700'  },
  alta:       { label: 'Alta',      classes: 'bg-green-50 text-green-700'  },
}

// ─── Componentes de utilidad ──────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
      {children}
    </h2>
  )
}

function BadgeCita({ estado }: { estado: EstadoCita }) {
  const cfg = ESTADO_CITA_CONFIG[estado] ?? ESTADO_CITA_CONFIG.pendiente
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${cfg.classes}`}>
      {cfg.label}
    </span>
  )
}

function BadgeTratamiento({ estado }: { estado: EstadoTratamiento }) {
  const cfg = ESTADO_TRATAMIENTO_CONFIG[estado] ?? ESTADO_TRATAMIENTO_CONFIG.activo
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${cfg.classes}`}>
      {cfg.label}
    </span>
  )
}

function BadgeTipoNota({ tipo }: { tipo: TipoNota }) {
  const cfg = TIPO_NOTA_CONFIG[tipo] ?? TIPO_NOTA_CONFIG.general
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${cfg.classes}`}>
      {cfg.label}
    </span>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

interface AvatarProps {
  nombre: string
  apellidos: string
  fotoUrl: string | null
  size?: 'md' | 'lg'
}

function Avatar({ nombre, apellidos, fotoUrl, size = 'md' }: AvatarProps) {
  const sizeClasses = size === 'lg'
    ? 'w-16 h-16 text-xl'
    : 'w-10 h-10 text-sm'

  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={`Foto de ${nombre} ${apellidos}`}
        className={`${sizeClasses} rounded-full object-cover shrink-0`}
      />
    )
  }

  const initials = `${nombre[0] ?? ''}${apellidos[0] ?? ''}`.toUpperCase()
  return (
    <div
      className={`${sizeClasses} rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold shrink-0`}
      aria-label={`Iniciales de ${nombre} ${apellidos}`}
    >
      {initials}
    </div>
  )
}

// ─── Escala de dolor ──────────────────────────────────────────────────────────

function DolorIndicator({ inicio, fin }: { inicio: number | null; fin: number | null }) {
  if (inicio === null && fin === null) return <span className="text-xs text-gray-400">Sin datos</span>

  function colorPorValor(v: number): string {
    if (v <= 3) return 'text-green-600'
    if (v <= 6) return 'text-amber-600'
    return 'text-red-600'
  }

  const inicioStr = inicio !== null ? String(inicio) : '–'
  const finStr    = fin    !== null ? String(fin)    : '–'

  const inicioColor = inicio !== null ? colorPorValor(inicio) : 'text-gray-400'
  const finColor    = fin    !== null ? colorPorValor(fin)    : 'text-gray-400'

  // Determinar si mejoró, empeoró o igual
  let tendencia: 'mejor' | 'peor' | 'igual' | 'indeterminado' = 'indeterminado'
  if (inicio !== null && fin !== null) {
    if (fin < inicio) tendencia = 'mejor'
    else if (fin > inicio) tendencia = 'peor'
    else tendencia = 'igual'
  }

  const flechaColor =
    tendencia === 'mejor' ? 'text-green-500' :
    tendencia === 'peor'  ? 'text-red-500' :
    tendencia === 'igual' ? 'text-gray-400' :
    'text-gray-300'

  return (
    <div className="flex items-center gap-1.5" aria-label={`Dolor: inicio ${inicioStr}, fin ${finStr}`}>
      <span className={`text-sm font-bold tabular-nums ${inicioColor}`}>{inicioStr}</span>
      {/* Flecha */}
      <svg
        className={`w-4 h-4 ${flechaColor}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        {tendencia === 'mejor' ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        ) : tendencia === 'peor' ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
        )}
      </svg>
      <span className={`text-sm font-bold tabular-nums ${finColor}`}>{finStr}</span>
      <span className="text-xs text-gray-400 ml-0.5">/10</span>
    </div>
  )
}

// ─── Skeleton de página completa ──────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
      {/* Back */}
      <div className="h-4 w-28 bg-gray-100 rounded" />

      {/* Cabecera */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-48 bg-gray-100 rounded" />
          <div className="h-3 w-36 bg-gray-100 rounded" />
          <div className="h-3 w-28 bg-gray-100 rounded" />
        </div>
      </div>

      {/* Sección tratamiento */}
      <div className="space-y-3">
        <div className="h-3 w-32 bg-gray-100 rounded" />
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="h-4 w-56 bg-gray-100 rounded" />
          <div className="h-3 w-72 bg-gray-100 rounded" />
          <div className="h-3 w-40 bg-gray-100 rounded" />
        </div>
      </div>

      {/* Sección sesiones */}
      <div className="space-y-3">
        <div className="h-3 w-32 bg-gray-100 rounded" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
            <div className="h-4 w-40 bg-gray-100 rounded" />
            <div className="h-3 w-60 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tarjeta de sesión con toggle de notas ────────────────────────────────────

function SesionCard({ sesion }: { sesion: Sesion }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className="text-sm font-semibold text-gray-900">{formatFecha(sesion.fecha)}</p>
        <DolorIndicator inicio={sesion.dolor_inicio} fin={sesion.dolor_fin} />
      </div>

      {sesion.evolucion && (
        <p className="text-sm text-gray-600 line-clamp-2">{sesion.evolucion}</p>
      )}

      {sesion.notas_sesion && (
        <div className="border-t border-gray-100 pt-2">
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            aria-expanded={expanded}
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {expanded ? 'Ocultar notas' : 'Ver notas de sesión'}
          </button>
          {expanded && (
            <p className="mt-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 whitespace-pre-wrap">
              {sesion.notas_sesion}
            </p>
          )}
        </div>
      )}

      {sesion.duracion_minutos && (
        <p className="text-xs text-gray-400">{sesion.duracion_minutos} min de sesión</p>
      )}
    </div>
  )
}

// ─── Tarjeta de nota clínica ──────────────────────────────────────────────────

function NotaCard({ nota }: { nota: NotaClinica }) {
  const [expanded, setExpanded] = useState(false)
  const preview = nota.contenido.length > 120
    ? nota.contenido.slice(0, 120) + '…'
    : nota.contenido

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <BadgeTipoNota tipo={nota.tipo} />
          {nota.privada && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Privada
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">{formatFecha(nota.created_at)}</span>
      </div>

      <p className="text-sm text-gray-700">
        {expanded ? nota.contenido : preview}
      </p>

      {nota.contenido.length > 120 && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          aria-expanded={expanded}
        >
          {expanded ? 'Ver menos' : 'Ver completo'}
        </button>
      )}
    </div>
  )
}

// ─── Tarjeta de tratamiento ───────────────────────────────────────────────────

function TratamientoCard({ tratamiento, destacado }: { tratamiento: Tratamiento; destacado: boolean }) {
  const ringClass = destacado
    ? 'border-blue-200 ring-1 ring-blue-200'
    : 'border-gray-200'

  return (
    <div className={`bg-white rounded-xl border p-4 space-y-3 ${ringClass}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className="text-sm font-semibold text-gray-900">{tratamiento.titulo}</p>
        <BadgeTratamiento estado={tratamiento.estado} />
      </div>

      {tratamiento.diagnostico && (
        <p className="text-sm text-gray-600 line-clamp-3">{tratamiento.diagnostico}</p>
      )}

      {tratamiento.objetivos && (
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <p className="text-xs font-medium text-gray-500 mb-0.5">Objetivos</p>
          <p className="text-xs text-gray-700 line-clamp-2">{tratamiento.objetivos}</p>
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-400 pt-1 border-t border-gray-100">
        <span>Inicio: {formatFecha(tratamiento.fecha_inicio)}</span>
        {tratamiento.fecha_fin_estimada && (
          <span>Fin estimado: {formatFecha(tratamiento.fecha_fin_estimada)}</span>
        )}
      </div>
    </div>
  )
}

// ─── Tarjeta de plan de ejercicios ────────────────────────────────────────────

function PlanCard({ plan }: { plan: PlanEjercicio }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
      <p className="text-sm font-semibold text-gray-900">{plan.nombre}</p>
      {plan.descripcion && (
        <p className="text-sm text-gray-500 line-clamp-2">{plan.descripcion}</p>
      )}
      {(plan.fecha_inicio || plan.fecha_fin) && (
        <p className="text-xs text-gray-400">
          {plan.fecha_inicio && `Desde ${formatFecha(plan.fecha_inicio)}`}
          {plan.fecha_inicio && plan.fecha_fin && ' · '}
          {plan.fecha_fin && `Hasta ${formatFecha(plan.fecha_fin)}`}
        </p>
      )}
    </div>
  )
}

// ─── Fila de cita próxima ─────────────────────────────────────────────────────

function CitaRow({ cita }: { cita: CitaResumen }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{formatFechaHora(cita.fecha_hora)}</p>
        <p className="text-xs text-gray-400 mt-0.5">{cita.duracion_minutos} min</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {cita.motivo && (
          <span className="text-xs text-gray-500 hidden sm:inline truncate max-w-[140px]">{cita.motivo}</span>
        )}
        <BadgeCita estado={cita.estado} />
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function HistorialPaciente() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const pacienteId = id ?? ''
  const { data, loading, error, refetch } = useHistorialPaciente(pacienteId)

  if (loading) return <PageSkeleton />

  if (error) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <button
          type="button"
          onClick={() => navigate('/fisio/pacientes')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver a pacientes
        </button>

        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-6 text-center space-y-3">
          <svg className="w-8 h-8 text-red-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm font-medium text-red-800">{error}</p>
          <button
            type="button"
            onClick={refetch}
            className="text-sm font-medium text-red-700 underline hover:no-underline transition-all"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { paciente, tratamientos, sesiones, notas, citas, planes } = data

  // El tratamiento activo es el primero con estado 'activo'; si no hay, el más reciente
  const tratamientoActivo = tratamientos.find(t => t.estado === 'activo') ?? null
  const tratamientosHistorico = tratamientos.filter(t => t !== tratamientoActivo)

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Back */}
      <Link
        to="/fisio/pacientes"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Volver a pacientes
      </Link>

      {/* ── Cabecera del paciente ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start gap-4 flex-wrap">
          <Avatar
            nombre={paciente.nombre}
            apellidos={paciente.apellidos}
            fotoUrl={paciente.foto_url}
            size="lg"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">
                {paciente.nombre} {paciente.apellidos}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                  paciente.activo
                    ? 'bg-green-50 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${paciente.activo ? 'bg-green-500' : 'bg-gray-400'}`}
                  aria-hidden="true"
                />
                {paciente.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <div className="mt-1.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <a
                href={`mailto:${paciente.email}`}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                aria-label={`Enviar email a ${paciente.email}`}
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {paciente.email}
              </a>

              {paciente.telefono && (
                <>
                  <span className="hidden sm:inline text-gray-300" aria-hidden="true">·</span>
                  <a
                    href={`tel:${paciente.telefono}`}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                    aria-label={`Llamar a ${paciente.telefono}`}
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.95V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {paciente.telefono}
                  </a>
                </>
              )}
            </div>

            {/* Fecha de nacimiento si existe */}
            {paciente.fecha_nacimiento && (
              <p className="mt-1 text-xs text-gray-400">
                Nacimiento: {formatFecha(paciente.fecha_nacimiento)}
              </p>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 flex-wrap">
          <Link
            to={`/fisio/sesiones/nueva?paciente=${pacienteId}`}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nueva sesión
          </Link>

          <Link
            to={`/fisio/citas/nueva?paciente=${pacienteId}`}
            className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Nueva cita
          </Link>

          <Link
            to={`/fisio/notas/nueva?paciente=${pacienteId}`}
            className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Nueva nota
          </Link>
        </div>
      </div>

      {/* ── Tratamiento activo ────────────────────────────────────────── */}
      <section aria-labelledby="tratamiento-heading" className="space-y-3">
        <SectionHeading>
          <span id="tratamiento-heading">Tratamiento activo</span>
        </SectionHeading>

        {tratamientoActivo ? (
          <TratamientoCard tratamiento={tratamientoActivo} destacado={true} />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-6 flex flex-col items-center gap-3 text-center">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-700">Sin tratamiento activo</p>
              <p className="text-xs text-gray-400 mt-0.5">Este paciente no tiene ningún tratamiento en curso</p>
            </div>
          </div>
        )}
      </section>

      {/* ── Sesiones recientes ────────────────────────────────────────── */}
      <section aria-labelledby="sesiones-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeading>
            <span id="sesiones-heading">Sesiones recientes</span>
          </SectionHeading>
          {sesiones.length > 0 && (
            <span className="text-xs text-gray-400">{sesiones.length} mostradas</span>
          )}
        </div>

        {sesiones.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-6 text-center">
            <p className="text-sm text-gray-500">No hay sesiones registradas todavía</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sesiones.map(sesion => (
              <SesionCard key={sesion.id} sesion={sesion} />
            ))}
          </div>
        )}
      </section>

      {/* ── Próximas citas ────────────────────────────────────────────── */}
      <section aria-labelledby="citas-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeading>
            <span id="citas-heading">Proximas citas</span>
          </SectionHeading>
          <Link
            to={`/fisio/citas/nueva?paciente=${pacienteId}`}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            + Nueva cita
          </Link>
        </div>

        {citas.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-6 text-center">
            <p className="text-sm text-gray-500">No hay citas próximas programadas</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 px-4">
            {citas.map(cita => (
              <CitaRow key={cita.id} cita={cita} />
            ))}
          </div>
        )}
      </section>

      {/* ── Planes de ejercicio activos ───────────────────────────────── */}
      {planes.length > 0 && (
        <section aria-labelledby="planes-heading" className="space-y-3">
          <SectionHeading>
            <span id="planes-heading">Planes de ejercicio activos</span>
          </SectionHeading>
          <div className="space-y-2">
            {planes.map(plan => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </section>
      )}

      {/* ── Notas clínicas ────────────────────────────────────────────── */}
      <section aria-labelledby="notas-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeading>
            <span id="notas-heading">Notas clinicas</span>
          </SectionHeading>
          <Link
            to={`/fisio/notas/nueva?paciente=${pacienteId}`}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            + Nueva nota
          </Link>
        </div>

        {notas.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-6 text-center">
            <p className="text-sm text-gray-500">No hay notas clínicas registradas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notas.map(nota => (
              <NotaCard key={nota.id} nota={nota} />
            ))}
          </div>
        )}
      </section>

      {/* ── Tratamientos históricos (colapsados) ─────────────────────── */}
      {tratamientosHistorico.length > 0 && (
        <section aria-labelledby="histtrat-heading" className="space-y-3 pb-8">
          <SectionHeading>
            <span id="histtrat-heading">Tratamientos anteriores</span>
          </SectionHeading>
          <div className="space-y-2">
            {tratamientosHistorico.map(t => (
              <TratamientoCard key={t.id} tratamiento={t} destacado={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
