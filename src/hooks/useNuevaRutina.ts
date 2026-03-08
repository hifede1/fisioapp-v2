// 🏥 Role: FISIO only

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert } from '@/lib/supabase'

// Supabase JS v2.98 no infiere correctamente los tipos sobre vistas y filtros .in()/.or()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any

export type Ejercicio    = Tables<'ejercicios'>
export type PlanInsert   = TablesInsert<'planes_ejercicios'>

export interface PacienteOpcion {
  id: string
  nombre: string
  apellidos: string
}

export interface DetalleInput {
  ejercicio_id: string
  orden: number
  series: number
  repeticiones: number
  descanso_segundos: number
  duracion_segundos: number | null
  notas: string
}

export interface PlanInput {
  nombre: string
  descripcion: string
  paciente_id: string
  fecha_inicio: string
  fecha_fin: string
  activo: boolean
}

export interface UseNuevaRutinaResult {
  pacientes: PacienteOpcion[]
  ejercicios: Ejercicio[]
  loading: boolean
  submitting: boolean
  error: string | null
  crearPlan: (plan: PlanInput, detalles: DetalleInput[]) => Promise<{ plan_id: string; paciente_id: string }>
}

export function useNuevaRutina(): UseNuevaRutinaResult {
  const [pacientes, setPacientes] = useState<PacienteOpcion[]>([])
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([])
  const [loading, setLoading]     = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        const { data: fisioIdRaw, error: rpcError } = await supabase.rpc('get_fisioterapeuta_id')
        if (rpcError || !fisioIdRaw) throw new Error('No se encontró el perfil de fisioterapeuta')
        const fisioId = fisioIdRaw as string

        // 1. IDs de pacientes activos del fisio
        const { data: asigs, error: asigError } = await sb
          .from('fisioterapeuta_paciente')
          .select('paciente_id')
          .eq('fisioterapeuta_id', fisioId)
          .eq('activo', true)

        if (asigError) throw asigError

        const ids = ((asigs ?? []) as Array<{ paciente_id: string }>).map(a => a.paciente_id)

        // 2. Datos de pacientes
        let pacsData: PacienteOpcion[] = []
        if (ids.length > 0) {
          const { data: pacs, error: pacsError } = await sb
            .from('v_pacientes')
            .select('id, nombre, apellidos')
            .in('id', ids)
            .order('apellidos')

          if (pacsError) throw pacsError
          pacsData = (pacs ?? []) as PacienteOpcion[]
        }

        // 3. Ejercicios disponibles (públicos o propios del fisio)
        const { data: ejers, error: ejersError } = await sb
          .from('ejercicios')
          .select('*')
          .or(`publico.eq.true,creado_por.eq.${fisioId}`)
          .order('nombre', { ascending: true })

        if (ejersError) throw ejersError

        if (!cancelled) {
          setPacientes(pacsData)
          setEjercicios((ejers ?? []) as Ejercicio[])
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar datos')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [])

  const crearPlan = async (
    planInput: PlanInput,
    detalles: DetalleInput[],
  ): Promise<{ plan_id: string; paciente_id: string }> => {
    setSubmitting(true)
    setError(null)

    try {
      const { data: fisioIdRaw, error: rpcError } = await supabase.rpc('get_fisioterapeuta_id')
      if (rpcError || !fisioIdRaw) throw new Error('No se encontró el perfil de fisioterapeuta')
      const fisioId = fisioIdRaw as string

      // 1. INSERT en planes_ejercicios
      const planRow: PlanInsert = {
        fisioterapeuta_id: fisioId,
        paciente_id:       planInput.paciente_id,
        nombre:            planInput.nombre,
        descripcion:       planInput.descripcion.trim() || null,
        fecha_inicio:      planInput.fecha_inicio || null,
        fecha_fin:         planInput.fecha_fin.trim() ? planInput.fecha_fin : null,
        activo:            planInput.activo,
      }

      const { data: plan, error: planError } = await sb
        .from('planes_ejercicios')
        .insert(planRow)
        .select('id')
        .single()

      if (planError) throw new Error(planError.message ?? 'Error al crear el plan')

      const planId = (plan as { id: string }).id

      // 2. INSERT múltiple en plan_ejercicios_detalle
      if (detalles.length > 0) {
        const rows = detalles.map((d, idx) => ({
          plan_id:           planId,
          ejercicio_id:      d.ejercicio_id,
          orden:             idx + 1,
          series:            d.series,
          repeticiones:      d.repeticiones,
          descanso_segundos: d.descanso_segundos,
          duracion_segundos: d.duracion_segundos,
          notas:             d.notas.trim() || null,
        }))

        const { error: detallesError } = await sb
          .from('plan_ejercicios_detalle')
          .insert(rows)

        if (detallesError) throw new Error(detallesError.message ?? 'Error al añadir ejercicios al plan')
      }

      return { plan_id: planId, paciente_id: planInput.paciente_id }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear el plan'
      setError(msg)
      throw new Error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return { pacientes, ejercicios, loading, submitting, error, crearPlan }
}
