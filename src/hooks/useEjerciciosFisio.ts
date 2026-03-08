// 🏥 Role: FISIO only

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/supabase'

// Supabase JS v2.98 no infiere correctamente los tipos sobre tablas con enums y .or()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any

export type Ejercicio = Tables<'ejercicios'>

export type EjercicioCrearInput = Pick<
  TablesInsert<'ejercicios'>,
  'nombre' | 'descripcion' | 'instrucciones' | 'categoria' | 'dificultad' | 'musculos_objetivo' | 'publico'
>

export type EjercicioActualizarInput = Pick<
  TablesUpdate<'ejercicios'>,
  'nombre' | 'descripcion' | 'instrucciones' | 'categoria' | 'dificultad' | 'musculos_objetivo' | 'publico'
>

export interface UseEjerciciosFisioResult {
  ejercicios: Ejercicio[]
  loading: boolean
  error: string | null
  crearEjercicio: (data: EjercicioCrearInput) => Promise<Ejercicio>
  actualizarEjercicio: (id: string, data: EjercicioActualizarInput) => Promise<Ejercicio>
  refetch: () => void
}

export function useEjerciciosFisio(): UseEjerciciosFisioResult {
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [tick, setTick]             = useState(0)

  useEffect(() => {
    let cancelled = false

    async function fetchEjercicios() {
      setLoading(true)
      setError(null)

      try {
        // Obtener el fisioterapeuta_id para filtrar ejercicios propios
        const { data: fisioIdRaw, error: rpcError } = await supabase.rpc('get_fisioterapeuta_id')
        if (rpcError || !fisioIdRaw) throw new Error('No se encontró el perfil de fisioterapeuta')
        const fisioId = fisioIdRaw as string

        // Cargar ejercicios públicos O creados por este fisio
        // Supabase v2.98: usamos .or() con la sintaxis de filtro de PostgREST
        const { data, error: fetchError } = await sb
          .from('ejercicios')
          .select('*')
          .or(`publico.eq.true,creado_por.eq.${fisioId}`)
          .order('nombre', { ascending: true })

        if (fetchError) throw fetchError

        if (!cancelled) {
          setEjercicios((data ?? []) as Ejercicio[])
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar ejercicios')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchEjercicios()
    return () => { cancelled = true }
  }, [tick])

  const crearEjercicio = async (data: EjercicioCrearInput): Promise<Ejercicio> => {
    const { data: fisioIdRaw, error: rpcError } = await supabase.rpc('get_fisioterapeuta_id')
    if (rpcError || !fisioIdRaw) throw new Error('No se encontró el perfil de fisioterapeuta')
    const fisioId = fisioIdRaw as string

    const { data: inserted, error: insertError } = await sb
      .from('ejercicios')
      .insert({ ...data, creado_por: fisioId })
      .select()
      .single()

    if (insertError) throw new Error(insertError.message ?? 'Error al crear el ejercicio')

    const ejercicio = inserted as Ejercicio
    setEjercicios(prev => [...prev, ejercicio].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    return ejercicio
  }

  const actualizarEjercicio = async (id: string, data: EjercicioActualizarInput): Promise<Ejercicio> => {
    const { data: updated, error: updateError } = await sb
      .from('ejercicios')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw new Error(updateError.message ?? 'Error al actualizar el ejercicio')

    const ejercicio = updated as Ejercicio
    setEjercicios(prev =>
      prev.map(e => e.id === id ? ejercicio : e).sort((a, b) => a.nombre.localeCompare(b.nombre))
    )
    return ejercicio
  }

  return {
    ejercicios,
    loading,
    error,
    crearEjercicio,
    actualizarEjercicio,
    refetch: () => setTick(t => t + 1),
  }
}
