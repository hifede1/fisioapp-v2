import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Views } from '@/lib/supabase'
import type { EstadoCita } from '@/types/database.types'

export interface PacienteConInfo {
  id: string
  profile_id: string
  nombre: string
  apellidos: string
  email: string
  telefono: string | null
  foto_url: string | null
  activo: boolean
  diagnosticoActivo: string | null
  proximaCita: string | null
  estadoProximaCita: EstadoCita | null
}

export interface UsePacientesFisioResult {
  pacientes: PacienteConInfo[]
  loading: boolean
  error: string | null
  refetch: () => void
}

// Supabase JS v2.98 no infiere correctamente los tipos de filtros sobre vistas
// y selects parciales, ni el valor escalar de RPCs. Casteamos el cliente.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any

// Tipos internos para los resultados de selects parciales
interface AsignacionRow { paciente_id: string; activo: boolean }
interface TratamientoRow { paciente_id: string; diagnostico: string | null; estado: string; fecha_inicio: string }
interface CitaResumenRow { paciente_id: string; fecha_hora: string; estado: string }

export function usePacientesFisio(): UsePacientesFisioResult {
  const [pacientes, setPacientes] = useState<PacienteConInfo[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [tick, setTick]           = useState(0)

  useEffect(() => {
    let cancelled = false

    async function fetchPacientes() {
      setLoading(true)
      setError(null)

      try {
        const { data: fisioIdRaw, error: rpcError } = await supabase.rpc('get_fisioterapeuta_id')
        if (rpcError || !fisioIdRaw) throw new Error('No se encontró el perfil de fisioterapeuta')
        const fisioId = fisioIdRaw as string

        // 1. IDs de pacientes asignados (activos e inactivos)
        const { data: asignacionesRaw, error: asigError } = await sb
          .from('fisioterapeuta_paciente')
          .select('paciente_id, activo')
          .eq('fisioterapeuta_id', fisioId)

        if (asigError) throw asigError
        const asignaciones = (asignacionesRaw ?? []) as AsignacionRow[]
        if (asignaciones.length === 0) {
          if (!cancelled) setPacientes([])
          return
        }

        const pacienteIds = asignaciones.map(a => a.paciente_id)
        const asignacionMap = new Map(asignaciones.map(a => [a.paciente_id, a.activo]))

        const now = new Date().toISOString()

        // 2. Datos de v_pacientes + tratamientos activos + próximas citas (en paralelo)
        const [pacientesRes, tratamientosRes, citasRes] = await Promise.all([
          sb.from('v_pacientes')
            .select('*')
            .in('id', pacienteIds),

          sb.from('tratamientos')
            .select('paciente_id, diagnostico, estado, fecha_inicio')
            .eq('fisioterapeuta_id', fisioId)
            .in('paciente_id', pacienteIds)
            .eq('estado', 'activo')
            .order('fecha_inicio', { ascending: false }),

          sb.from('v_citas')
            .select('paciente_id, fecha_hora, estado')
            .eq('fisioterapeuta_id', fisioId)
            .in('paciente_id', pacienteIds)
            .gt('fecha_hora', now)
            .in('estado', ['pendiente', 'confirmada'])
            .order('fecha_hora'),
        ])

        if (pacientesRes.error)   throw pacientesRes.error
        if (tratamientosRes.error) throw tratamientosRes.error
        if (citasRes.error)       throw citasRes.error

        const tratamientos = (tratamientosRes.data ?? []) as TratamientoRow[]
        const citasResumen  = (citasRes.data        ?? []) as CitaResumenRow[]

        // Mapas para lookup rápido
        const diagnosticoMap = new Map<string, string | null>()
        for (const t of tratamientos) {
          if (!diagnosticoMap.has(t.paciente_id)) {
            diagnosticoMap.set(t.paciente_id, t.diagnostico)
          }
        }

        const proximaCitaMap = new Map<string, { fecha_hora: string; estado: EstadoCita }>()
        for (const c of citasResumen) {
          if (!proximaCitaMap.has(c.paciente_id)) {
            proximaCitaMap.set(c.paciente_id, { fecha_hora: c.fecha_hora, estado: c.estado as EstadoCita })
          }
        }

        const result: PacienteConInfo[] = ((pacientesRes.data ?? []) as Views<'v_pacientes'>[]).map(
          (p: Views<'v_pacientes'>) => {
            const proxima = proximaCitaMap.get(p.id)
            return {
              id:                   p.id,
              profile_id:           p.profile_id,
              nombre:               p.nombre,
              apellidos:            p.apellidos,
              email:                p.email,
              telefono:             p.telefono,
              foto_url:             p.foto_url,
              activo:               asignacionMap.get(p.id) ?? false,
              diagnosticoActivo:    diagnosticoMap.get(p.id) ?? null,
              proximaCita:          proxima?.fecha_hora ?? null,
              estadoProximaCita:    proxima?.estado     ?? null,
            }
          }
        )

        // Ordenar: activos primero, luego por apellido
        result.sort((a, b) => {
          if (a.activo !== b.activo) return a.activo ? -1 : 1
          return `${a.apellidos} ${a.nombre}`.localeCompare(`${b.apellidos} ${b.nombre}`, 'es')
        })

        if (!cancelled) setPacientes(result)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar pacientes')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchPacientes()
    return () => { cancelled = true }
  }, [tick])

  return { pacientes, loading, error, refetch: () => setTick(t => t + 1) }
}
