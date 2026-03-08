// Role: PACIENTE only
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

// Supabase JS v2.98 no infiere correctamente los tipos de filtros y relaciones anidadas.
// Casteamos el cliente para evitar errores de tipo en queries con .select() anidado.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any

export type EjercicioDetalle = Tables<'plan_ejercicios_detalle'> & {
  ejercicios: Tables<'ejercicios'>
}

export type PlanConEjercicios = Tables<'planes_ejercicios'> & {
  plan_ejercicios_detalle: EjercicioDetalle[]
}

interface UseRutinasPacienteResult {
  planes: PlanConEjercicios[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useRutinasPaciente(): UseRutinasPacienteResult {
  const { user } = useAuthStore()
  const [planes, setPlanes] = useState<PlanConEjercicios[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = () => setTick(t => t + 1)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        // 1. Obtener el paciente_id del usuario autenticado
        const { data: pacienteRow, error: pacienteError } = await supabase
          .from('pacientes')
          .select('id')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .eq('profile_id' as any, user!.id)
          .single() as { data: { id: string } | null; error: { message: string } | null }

        if (pacienteError || !pacienteRow) {
          throw new Error(pacienteError?.message ?? 'No se encontró el perfil del paciente')
        }

        if (cancelled) return

        // 2. Cargar planes activos con detalles y ejercicios anidados
        const { data, error: planesError } = await sb
          .from('planes_ejercicios')
          .select(`
            *,
            plan_ejercicios_detalle (
              *,
              ejercicios (*)
            )
          `)
          .eq('paciente_id', pacienteRow.id)
          .eq('activo', true)
          .order('fecha_inicio', { ascending: false })

        if (cancelled) return

        if (planesError) {
          throw new Error(`[planes_ejercicios] ${planesError.message}`)
        }

        // Ordenar los ejercicios de cada plan por su campo `orden`
        const planesOrdenados: PlanConEjercicios[] = ((data ?? []) as PlanConEjercicios[]).map(plan => ({
          ...plan,
          plan_ejercicios_detalle: [...plan.plan_ejercicios_detalle].sort((a, b) => a.orden - b.orden),
        }))

        setPlanes(planesOrdenados)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar las rutinas')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [user, tick])

  return { planes, loading, error, refetch }
}
