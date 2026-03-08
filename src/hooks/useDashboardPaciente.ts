import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Views, Tables } from '@/lib/supabase'

interface DashboardPacienteData {
  proximasCitas: Views<'v_citas'>[]
  planesActivos: Tables<'planes_ejercicios'>[]
  totalSesiones: number
  loading: boolean
  error: string | null
}

// Supabase JS v2.98 no infiere correctamente los tipos de filtros sobre vistas
// ni valores enum/boolean en .in()/.eq(). Casteamos el cliente para evitarlo.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any

export function useDashboardPaciente(): DashboardPacienteData {
  const [proximasCitas, setProximasCitas] = useState<Views<'v_citas'>[]>([])
  const [planesActivos, setPlanesActivos] = useState<Tables<'planes_ejercicios'>[]>([])
  const [totalSesiones, setTotalSesiones] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const now = new Date().toISOString()

        const [citasRes, planesRes, sesionesRes] = await Promise.all([
          sb.from('v_citas')
            .select('*')
            .gte('fecha_hora', now)
            .in('estado', ['pendiente', 'confirmada'])
            .order('fecha_hora', { ascending: true })
            .limit(5),

          sb.from('planes_ejercicios')
            .select('*')
            .eq('activo', true)
            .order('created_at', { ascending: false }),

          supabase
            .from('sesiones')
            .select('id', { count: 'exact', head: true }),
        ])

        if (cancelled) return

        if (citasRes.error)   throw new Error(`[v_citas] ${citasRes.error.message}`)
        if (planesRes.error)  throw new Error(`[planes_ejercicios] ${planesRes.error.message}`)
        if (sesionesRes.error) throw new Error(`[sesiones] ${sesionesRes.error.message}`)

        setProximasCitas((citasRes.data  ?? []) as Views<'v_citas'>[])
        setPlanesActivos((planesRes.data ?? []) as Tables<'planes_ejercicios'>[])
        setTotalSesiones(sesionesRes.count ?? 0)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar datos')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [])

  return { proximasCitas, planesActivos, totalSesiones, loading, error }
}
