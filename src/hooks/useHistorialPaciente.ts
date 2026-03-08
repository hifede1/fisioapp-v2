// 🏥 Role: FISIO only

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Tables, Views } from '@/lib/supabase'

// Supabase JS v2.98 no infiere correctamente los tipos sobre vistas y filtros
// .in()/.eq() con enums. Casteamos el cliente para evitar errores de tipos.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any

// ─── Tipos internos de los selects parciales ──────────────────────────────────

// Reutilizamos los tipos Row completos de las tablas directamente.
export type Sesion      = Tables<'sesiones'>
export type Tratamiento = Tables<'tratamientos'>
export type NotaClinica = Tables<'notas_clinicas'>
export type PlanEjercicio = Tables<'planes_ejercicios'>
export type CitaResumen = Views<'v_citas'>
export type PacienteDetalle = Views<'v_pacientes'>

export interface HistorialPacienteData {
  paciente:      PacienteDetalle
  tratamientos:  Tratamiento[]
  sesiones:      Sesion[]
  notas:         NotaClinica[]
  citas:         CitaResumen[]
  planes:        PlanEjercicio[]
}

export interface UseHistorialPacienteResult {
  data:     HistorialPacienteData | null
  loading:  boolean
  error:    string | null
  refetch:  () => void
}

export function useHistorialPaciente(pacienteId: string): UseHistorialPacienteResult {
  const [data, setData]       = useState<HistorialPacienteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [tick, setTick]       = useState(0)

  useEffect(() => {
    if (!pacienteId) return
    let cancelled = false

    async function fetchHistorial() {
      setLoading(true)
      setError(null)

      try {
        // Necesitamos el fisioId para filtrar tratamientos, sesiones y notas
        // de forma que el fisio solo vea sus propios registros (refuerza RLS).
        const { data: fisioIdRaw, error: rpcError } = await supabase.rpc('get_fisioterapeuta_id')
        if (rpcError || !fisioIdRaw) throw new Error('No se encontró el perfil de fisioterapeuta')
        const fisioId = fisioIdRaw as string

        const now = new Date().toISOString()

        // Todas las queries en paralelo para evitar waterfall
        const [
          pacienteRes,
          tratamientosRes,
          sesionesRes,
          notasRes,
          citasRes,
          planesRes,
        ] = await Promise.all([
          // Datos del paciente desde la vista (incluye email, teléfono, foto, etc.)
          sb
            .from('v_pacientes')
            .select('*')
            .eq('id', pacienteId)
            .single(),

          // Todos los tratamientos del fisio para este paciente, más reciente primero
          sb
            .from('tratamientos')
            .select('*')
            .eq('paciente_id', pacienteId)
            .eq('fisioterapeuta_id', fisioId)
            .order('created_at', { ascending: false }),

          // Últimas 10 sesiones del fisio con este paciente
          sb
            .from('sesiones')
            .select('*')
            .eq('paciente_id', pacienteId)
            .eq('fisioterapeuta_id', fisioId)
            .order('fecha', { ascending: false })
            .limit(10),

          // Últimas 10 notas clínicas del fisio para este paciente
          sb
            .from('notas_clinicas')
            .select('*')
            .eq('paciente_id', pacienteId)
            .eq('fisioterapeuta_id', fisioId)
            .order('created_at', { ascending: false })
            .limit(10),

          // Próximas 5 citas vigentes (no canceladas ni completadas)
          sb
            .from('v_citas')
            .select('*')
            .eq('paciente_id', pacienteId)
            .eq('fisioterapeuta_id', fisioId)
            .gte('fecha_hora', now)
            .not('estado', 'in', '("cancelada","completada")')
            .order('fecha_hora', { ascending: true })
            .limit(5),

          // Planes de ejercicio activos del paciente
          sb
            .from('planes_ejercicios')
            .select('*')
            .eq('paciente_id', pacienteId)
            .eq('fisioterapeuta_id', fisioId)
            .eq('activo', true)
            .order('created_at', { ascending: false }),
        ])

        if (pacienteRes.error)    throw pacienteRes.error
        if (tratamientosRes.error) throw tratamientosRes.error
        if (sesionesRes.error)    throw sesionesRes.error
        if (notasRes.error)       throw notasRes.error
        if (citasRes.error)       throw citasRes.error
        if (planesRes.error)      throw planesRes.error

        if (!pacienteRes.data) throw new Error('Paciente no encontrado')

        if (!cancelled) {
          setData({
            paciente:     pacienteRes.data     as PacienteDetalle,
            tratamientos: (tratamientosRes.data ?? []) as Tratamiento[],
            sesiones:     (sesionesRes.data    ?? []) as Sesion[],
            notas:        (notasRes.data       ?? []) as NotaClinica[],
            citas:        (citasRes.data       ?? []) as CitaResumen[],
            planes:       (planesRes.data      ?? []) as PlanEjercicio[],
          })
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar el historial')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchHistorial()
    return () => { cancelled = true }
  }, [pacienteId, tick])

  return {
    data,
    loading,
    error,
    refetch: () => setTick(t => t + 1),
  }
}
