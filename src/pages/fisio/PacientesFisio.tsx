import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { usePacientesFisio } from '@/hooks/usePacientesFisio'
import type { PacienteConInfo } from '@/hooks/usePacientesFisio'
import type { EstadoCita } from '@/types/database.types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDateTime(isoString: string): { fecha: string; hora: string } {
  const d = new Date(isoString)
  return {
    fecha: d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }),
    hora: d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
  }
}

const estadoCitaConfig: Record<EstadoCita, { label: string; classes: string }> = {
  pendiente:  { label: 'Pendiente',  classes: 'bg-amber-50 text-amber-700' },
  confirmada: { label: 'Confirmada', classes: 'bg-blue-50 text-blue-700' },
  completada: { label: 'Completada', classes: 'bg-green-50 text-green-700' },
  cancelada:  { label: 'Cancelada',  classes: 'bg-red-50 text-red-700' },
  no_asistio: { label: 'No asistió', classes: 'bg-gray-100 text-gray-500' },
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Avatar({ nombre, apellidos, fotoUrl }: { nombre: string; apellidos: string; fotoUrl?: string | null }) {
  if (fotoUrl) {
    return <img src={fotoUrl} alt={`${nombre} ${apellidos}`} className="w-10 h-10 rounded-full object-cover" />
  }
  const initials = `${nombre[0] ?? ''}${apellidos[0] ?? ''}`.toUpperCase()
  return (
    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold shrink-0">
      {initials}
    </div>
  )
}

function BadgeActivo({ activo }: { activo: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
      activo ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${activo ? 'bg-green-500' : 'bg-gray-400'}`} />
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  )
}

function ProximaCitaCell({ proximaCita, estadoProximaCita }: Pick<PacienteConInfo, 'proximaCita' | 'estadoProximaCita'>) {
  if (!proximaCita || !estadoProximaCita) {
    return <span className="text-sm text-gray-400">Sin cita</span>
  }
  const { fecha, hora } = formatDateTime(proximaCita)
  const cfg = estadoCitaConfig[estadoProximaCita]
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-gray-900">
        <span className="capitalize">{fecha}</span> · {hora}
      </span>
      <span className={`inline-block w-fit text-xs font-medium px-2 py-0.5 rounded-full ${cfg.classes}`}>
        {cfg.label}
      </span>
    </div>
  )
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      {[...Array(5)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: i === 0 ? 160 : i === 1 ? 120 : i === 2 ? 100 : i === 3 ? 140 : 80 }} />
        </td>
      ))}
    </tr>
  )
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <tr>
      <td colSpan={5} className="px-4 py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {filtered ? 'No hay pacientes que coincidan' : 'No tienes pacientes asignados'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {filtered ? 'Prueba con otro término de búsqueda' : 'Los pacientes aparecerán aquí cuando sean asignados'}
            </p>
          </div>
        </div>
      </td>
    </tr>
  )
}

// ─── Mobile card ─────────────────────────────────────────────────────────────

function PacienteCard({ paciente }: { paciente: PacienteConInfo }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <Avatar nombre={paciente.nombre} apellidos={paciente.apellidos} fotoUrl={paciente.foto_url} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {paciente.apellidos}, {paciente.nombre}
            </p>
            <BadgeActivo activo={paciente.activo} />
          </div>
          {paciente.telefono && (
            <p className="text-xs text-gray-500 mt-0.5">{paciente.telefono}</p>
          )}
        </div>
      </div>

      {paciente.diagnosticoActivo && (
        <div className="flex items-start gap-2 bg-blue-50 rounded-lg px-3 py-2">
          <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-xs text-blue-800 line-clamp-2">{paciente.diagnosticoActivo}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Próxima cita</p>
          <ProximaCitaCell proximaCita={paciente.proximaCita} estadoProximaCita={paciente.estadoProximaCita} />
        </div>
        <Link
          to={`/fisio/pacientes/${paciente.id}`}
          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Historial
        </Link>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function PacientesFisio() {
  const { pacientes, loading, error } = usePacientesFisio()
  const [busqueda, setBusqueda] = useState('')
  const [soloActivos, setSoloActivos] = useState(true)

  const pacientesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return pacientes.filter(p => {
      if (soloActivos && !p.activo) return false
      if (!q) return true
      const fullName = `${p.nombre} ${p.apellidos}`.toLowerCase()
      const diagnostico = (p.diagnosticoActivo ?? '').toLowerCase()
      return fullName.includes(q) || diagnostico.includes(q) || (p.telefono ?? '').includes(q)
    })
  }, [pacientes, busqueda, soloActivos])

  const totalActivos = useMemo(() => pacientes.filter(p => p.activo).length, [pacientes])

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          {!loading && (
            <p className="text-sm text-gray-500 mt-0.5">
              {totalActivos} {totalActivos === 1 ? 'paciente activo' : 'pacientes activos'}
              {pacientes.length > totalActivos && ` · ${pacientes.length - totalActivos} inactivo${pacientes.length - totalActivos !== 1 ? 's' : ''}`}
            </p>
          )}
        </div>
        <Link
          to="/fisio/pacientes/nuevo"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo paciente
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Buscar por nombre, diagnóstico o teléfono..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
          />
        </div>
        <button
          onClick={() => setSoloActivos(v => !v)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors shrink-0 ${
            soloActivos
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          {soloActivos ? 'Solo activos' : 'Todos'}
        </button>
      </div>

      {/* Tabla — desktop */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Paciente</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Diagnóstico</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Próxima cita</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
            ) : pacientesFiltrados.length === 0 ? (
              <EmptyState filtered={busqueda.trim().length > 0} />
            ) : (
              pacientesFiltrados.map(paciente => (
                <tr key={paciente.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  {/* Paciente */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar nombre={paciente.nombre} apellidos={paciente.apellidos} fotoUrl={paciente.foto_url} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {paciente.apellidos}, {paciente.nombre}
                        </p>
                        {paciente.telefono && (
                          <p className="text-xs text-gray-400 truncate">{paciente.telefono}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Diagnóstico */}
                  <td className="px-4 py-3 max-w-xs">
                    {paciente.diagnosticoActivo ? (
                      <p className="text-sm text-gray-700 line-clamp-2">{paciente.diagnosticoActivo}</p>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>

                  {/* Próxima cita */}
                  <td className="px-4 py-3">
                    <ProximaCitaCell
                      proximaCita={paciente.proximaCita}
                      estadoProximaCita={paciente.estadoProximaCita}
                    />
                  </td>

                  {/* Estado */}
                  <td className="px-4 py-3">
                    <BadgeActivo activo={paciente.activo} />
                  </td>

                  {/* Acciones */}
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/fisio/pacientes/${paciente.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Historial
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-36" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-24" />
                </div>
              </div>
              <div className="h-8 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          ))
        ) : pacientesFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-16 text-center">
            <p className="text-sm text-gray-500">
              {busqueda.trim() ? 'No hay pacientes que coincidan con la búsqueda' : 'No tienes pacientes asignados'}
            </p>
          </div>
        ) : (
          pacientesFiltrados.map(paciente => (
            <PacienteCard key={paciente.id} paciente={paciente} />
          ))
        )}
      </div>
    </div>
  )
}
