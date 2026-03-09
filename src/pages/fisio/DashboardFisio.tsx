import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useDashboardFisio } from '@/hooks/useDashboardFisio'
import type { Views } from '@/lib/supabase'
import type { EstadoCita } from '@/types/database.types'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 13) return 'Buenos días'
  if (hour < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateShort(isoString: string): string {
  return new Date(isoString).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

const estadoConfig: Record<EstadoCita, { label: string; classes: string }> = {
  pendiente:   { label: 'Pendiente',    classes: 'bg-amber-50 text-amber-700' },
  confirmada:  { label: 'Confirmada',   classes: 'bg-blue-50 text-blue-700' },
  completada:  { label: 'Completada',   classes: 'bg-green-50 text-green-700' },
  cancelada:   { label: 'Cancelada',    classes: 'bg-red-50 text-red-700' },
  no_asistio:  { label: 'No asistió',   classes: 'bg-gray-100 text-gray-500' },
}

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ReactNode
  iconBg: string
  loading?: boolean
}

function StatCard({ label, value, icon, iconBg, loading }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500 font-medium">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-12 bg-gray-100 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      )}
    </div>
  )
}

function CitaRow({ cita }: { cita: Views<'v_citas'> }) {
  const cfg = estadoConfig[cita.estado as EstadoCita] ?? estadoConfig.pendiente
  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className="text-center w-14 shrink-0">
        <p className="text-sm font-semibold text-gray-900">{formatTime(cita.fecha_hora ?? '')}</p>
        <p className="text-xs text-gray-400">{cita.duracion_minutos} min</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {cita.paciente_nombre} {cita.paciente_apellidos}
        </p>
        {cita.motivo && (
          <p className="text-xs text-gray-500 truncate">{cita.motivo}</p>
        )}
      </div>
      <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.classes}`}>
        {cfg.label}
      </span>
    </div>
  )
}

function ProximaCitaCard({ cita }: { cita: Views<'v_citas'> }) {
  const cfg = estadoConfig[cita.estado as EstadoCita] ?? estadoConfig.pendiente
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="shrink-0 mt-0.5">
        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {cita.paciente_nombre} {cita.paciente_apellidos}
        </p>
        <p className="text-xs text-gray-500 capitalize">{formatDateShort(cita.fecha_hora ?? '')} · {formatTime(cita.fecha_hora ?? '')}</p>
      </div>
      <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.classes}`}>
        {cfg.label}
      </span>
    </div>
  )
}

const acciones = [
  {
    label: 'Nueva cita',
    path: '/fisio/citas/nueva',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'Nuevo paciente',
    path: '/fisio/pacientes/nuevo',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
  },
  {
    label: 'Nueva sesión',
    path: '/fisio/sesiones/nueva',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    label: 'Nueva nota',
    path: '/fisio/notas/nueva',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
]

export function DashboardFisio() {
  const { profile } = useAuthStore()
  const { citasHoy, proximas, totalPacientesActivos, sesionesEstaSemana, loading, error } = useDashboardFisio()

  const citasPendientesHoy = citasHoy.filter(c => c.estado === 'pendiente' || c.estado === 'confirmada').length

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting()}, {profile?.nombre}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5 capitalize">{formatDate(new Date())}</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Citas hoy"
          value={citasHoy.length}
          loading={loading}
          iconBg="bg-blue-50"
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Pendientes hoy"
          value={citasPendientesHoy}
          loading={loading}
          iconBg="bg-amber-50"
          icon={
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Pacientes activos"
          value={totalPacientesActivos}
          loading={loading}
          iconBg="bg-green-50"
          icon={
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="Sesiones esta semana"
          value={sesionesEstaSemana}
          loading={loading}
          iconBg="bg-purple-50"
          icon={
            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          }
        />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Citas de hoy */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Agenda de hoy</h2>
            <Link to="/fisio/citas" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Ver agenda completa →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4 py-3 border-b border-gray-100">
                  <div className="w-14 h-9 bg-gray-100 rounded animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-40" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : citasHoy.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">No hay citas programadas para hoy</p>
            </div>
          ) : (
            <div>
              {citasHoy.map(cita => (
                <CitaRow key={cita.id} cita={cita} />
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Acciones rápidas */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Acciones rápidas</h2>
            <div className="grid grid-cols-2 gap-2">
              {acciones.map(accion => (
                <Link
                  key={accion.path}
                  to={accion.path}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
                >
                  <span className="text-gray-600">{accion.icon}</span>
                  <span className="text-xs font-medium text-gray-700 leading-tight">{accion.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Próximas citas */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Próximas citas</h2>
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : proximas.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Sin próximas citas</p>
            ) : (
              <div className="space-y-2">
                {proximas.map(cita => (
                  <ProximaCitaCard key={cita.id} cita={cita} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
