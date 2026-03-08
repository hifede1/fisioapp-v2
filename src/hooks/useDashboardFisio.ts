import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Views } from '@/lib/supabase'

export interface DashboardStats {
  citasHoy: Views<'v_citas'>[]
  proximas: Views<'v_citas'>[]
  totalPacientesActivos: number
  sesionesEstaSemana: number
  loading: boolean
  error: string | null
}

function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Supabase JS v2.98 no infiere correctamente los tipos de filtros sobre vistas
// ni el valor de retorno de RPCs escalares. Usamos `any` en los puntos exactos
// donde el compilador falla, sin afectar a la lógica ni al tipado de retorno.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any

export function useDashboardFisio() {
  const [stats, setStats] = useState<DashboardStats>({
    citasHoy: [],
    proximas: [],
    totalPacientesActivos: 0,
    sesionesEstaSemana: 0,
    loading: true,
    error: null,
  })

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: fisioIdRaw, error: rpcError } = await supabase.rpc('get_fisioterapeuta_id')
        if (rpcError || !fisioIdRaw) throw new Error('No se encontró el perfil de fisioterapeuta')
        const fisioId = fisioIdRaw as string

        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString()

        // Lunes de la semana actual
        const startOfWeek = new Date(now)
        const dayOfWeek = startOfWeek.getDay()
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
        startOfWeek.setDate(startOfWeek.getDate() + diff)
        startOfWeek.setHours(0, 0, 0, 0)

        const [citasHoyRes, proximasRes, pacientesRes, sesionesRes] = await Promise.all([
          sb.from('v_citas')
            .select('*')
            .eq('fisioterapeuta_id', fisioId)
            .gte('fecha_hora', startOfDay)
            .lte('fecha_hora', endOfDay)
            .order('fecha_hora'),

          sb.from('v_citas')
            .select('*')
            .eq('fisioterapeuta_id', fisioId)
            .gt('fecha_hora', endOfDay)
            .in('estado', ['pendiente', 'confirmada'])
            .order('fecha_hora')
            .limit(5),

          sb.from('fisioterapeuta_paciente')
            .select('*', { count: 'exact', head: true })
            .eq('fisioterapeuta_id', fisioId)
            .eq('activo', true),

          sb.from('sesiones')
            .select('*', { count: 'exact', head: true })
            .eq('fisioterapeuta_id', fisioId)
            .gte('fecha', toDateString(startOfWeek)),
        ])

        setStats({
          citasHoy:                (citasHoyRes.data  ?? []) as Views<'v_citas'>[],
          proximas:                (proximasRes.data  ?? []) as Views<'v_citas'>[],
          totalPacientesActivos:   (pacientesRes.count ?? 0) as number,
          sesionesEstaSemana:      (sesionesRes.count  ?? 0) as number,
          loading: false,
          error: null,
        })
      } catch (err) {
        setStats(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Error al cargar datos',
        }))
      }
    }

    fetchStats()
  }, [])

  return stats
}
