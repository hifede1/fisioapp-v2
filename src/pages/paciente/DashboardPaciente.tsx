import { useAuthStore } from '@/store/authStore'
import { useDashboardPaciente } from '@/hooks/useDashboardPaciente'
import type { Views } from '@/lib/supabase'
import type { EstadoCita } from '@/types/database.types'
import { Link } from 'react-router-dom'

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

function formatDateMed(isoString: string): string {
  return new Date(isoString).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

const estadoConfig: Record<EstadoCita, { label: string; classes: string }> = {
  pendiente:  { label: 'Pendiente',  classes: 'bg-amber-50 text-amber-700' },
  confirmada: { label: 'Confirmada', classes: 'bg-blue-50 text-blue-700' },
  completada: { label: 'Completada', classes: 'bg-green-50 text-green-700' },
  cancelada:  { label: 'Cancelada',  classes: 'bg-red-50 text-red-700' },
  no_asistio: { label: 'No asistió', classes: 'bg-gray-100 text-gray-500' },
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

function CitaCard({ cita }: { cita: Views<'v_citas'> }) {
  const cfg = estadoConfig[cita.estado as EstadoCita] ?? estadoConfig.pendiente
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="shrink-0 mt-0.5">
        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">
          {cita.fisioterapeuta_nombre} {cita.fisioterapeuta_apellidos}
        </p>
        <p className="text-xs text-gray-500 capitalize">
          {formatDateMed(cita.fecha_hora ?? '')} · {formatTime(cita.fecha_hora ?? '')}
        </p>
      </div>
      <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.classes}`}>
        {cfg.label}
      </span>
    </div>
  )
}

const accionesRapidas = [
  {
    label: 'Mis rutinas',
    path: '/paciente/rutinas',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    label: 'Mi progreso',
    path: '/paciente/progreso',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: 'Chat con mi fisio',
    path: '/paciente/chat',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    label: 'Mi perfil',
    path: '/paciente/perfil',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

export function DashboardPaciente() {
  const { profile } = useAuthStore()
  const { proximasCitas, planesActivos, totalSesiones, loading, error } = useDashboardPaciente()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Próximas citas"
          value={proximasCitas.length}
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
          label="Planes activos"
          value={planesActivos.length}
          loading={loading}
          iconBg="bg-emerald-50"
          icon={
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
        />
        <StatCard
          label="Sesiones completadas"
          value={totalSesiones}
          loading={loading}
          iconBg="bg-purple-50"
          icon={
            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
        />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Próximas citas */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Próximas citas</h2>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : proximasCitas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">No tienes citas próximas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {proximasCitas.map(cita => (
                <CitaCard key={cita.id} cita={cita} />
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Acciones rápidas */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Acceso rápido</h2>
            <div className="grid grid-cols-2 gap-2">
              {accionesRapidas.map(accion => (
                <Link
                  key={accion.path}
                  to={accion.path}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors text-center"
                >
                  <span className="text-gray-600">{accion.icon}</span>
                  <span className="text-xs font-medium text-gray-700 leading-tight">{accion.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Planes activos */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Mis rutinas activas</h2>
            {loading ? (
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : planesActivos.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Sin rutinas activas</p>
            ) : (
              <ul className="space-y-2">
                {planesActivos.map(plan => (
                  <li key={plan.id}>
                    <Link
                      to="/paciente/rutinas"
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 hover:bg-emerald-50 transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-md bg-emerald-100 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700 group-hover:text-emerald-700 font-medium truncate">
                        {plan.nombre}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
