// 🏥 Role: FISIO only

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Supabase JS v2.98: cast para evitar errores de tipos en vistas y .in()/.eq() con enums
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface PacienteOption {
  id: string
  nombre: string
  apellidos: string
}

export interface CrearSesionInput {
  paciente_id: string
  fecha: string            // datetime-local string: "YYYY-MM-DDTHH:mm"
  duracion_minutos: number
  dolor_inicio: number
  dolor_fin: number
  evolucion: string
  notas_sesion?: string
  ejercicios_realizados?: string
}

export interface CrearSesionResult {
  id: string
  paciente_id: string
}

export interface UseNuevaSesionResult {
  pacientes: PacienteOption[]
  loading: boolean          // carga inicial de pacientes
  submitting: boolean       // mientras se guarda
  error: string | null      // error de carga de pacientes
  crearSesion: (data: CrearSesionInput) => Promise<CrearSesionResult>
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useNuevaSesion(): UseNuevaSesionResult {
  const [pacientes, setPacientes] = useState<PacienteOption[]>([])
  const [loading, setLoading]     = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  // ── Cargar pacientes activos del fisio ─────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function loadPacientes() {
      setLoading(true)
      setError(null)

      try {
        const { data: fisioIdRaw, error: rpcError } = await supabase.rpc('get_fisioterapeuta_id')
        if (rpcError || !fisioIdRaw) throw new Error('No se encontró el perfil de fisioterapeuta')
        const fisioId = fisioIdRaw as string

        // 1. IDs de pacientes activos asignados al fisio
        const { data: asigs, error: asigError } = await sb
          .from('fisioterapeuta_paciente')
          .select('paciente_id')
          .eq('fisioterapeuta_id', fisioId)
          .eq('activo', true)

        if (asigError) throw asigError

        const ids = ((asigs ?? []) as Array<{ paciente_id: string }>).map(a => a.paciente_id)

        if (ids.length === 0) {
          if (!cancelled) { setPacientes([]); setLoading(false) }
          return
        }

        // 2. Datos de los pacientes desde v_pacientes
        const { data: pacs, error: pacsError } = await sb
          .from('v_pacientes')
          .select('id, nombre, apellidos')
          .in('id', ids)
          .order('apellidos')

        if (pacsError) throw pacsError

        if (!cancelled) {
          setPacientes((pacs ?? []) as PacienteOption[])
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar pacientes')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadPacientes()
    return () => { cancelled = true }
  }, [])

  // ── Crear sesión ───────────────────────────────────────────────────────────
  const crearSesion = async (data: CrearSesionInput): Promise<CrearSesionResult> => {
    setSubmitting(true)

    try {
      const { data: fisioIdRaw, error: rpcError } = await supabase.rpc('get_fisioterapeuta_id')
      if (rpcError || !fisioIdRaw) throw new Error('No se encontró el perfil de fisioterapeuta')
      const fisioId = fisioIdRaw as string

      // La columna `fecha` en sesiones es tipo DATE (solo fecha, sin hora).
      // Extraemos la parte de fecha del string datetime-local "YYYY-MM-DDTHH:mm".
      const fechaSolo = data.fecha.substring(0, 10)

      // `ejercicios_realizados` no existe como columna en sesiones.
      // Lo anexamos a notas_sesion si viene relleno.
      let notasFinal = data.notas_sesion?.trim() ?? ''
      if (data.ejercicios_realizados?.trim()) {
        const bloque = `Ejercicios realizados:\n${data.ejercicios_realizados.trim()}`
        notasFinal = notasFinal ? `${notasFinal}\n\n${bloque}` : bloque
      }

      const { data: inserted, error: insertError } = await sb
        .from('sesiones')
        .insert({
          fisioterapeuta_id: fisioId,
          paciente_id:       data.paciente_id,
          fecha:             fechaSolo,
          duracion_minutos:  data.duracion_minutos,
          dolor_inicio:      data.dolor_inicio,
          dolor_fin:         data.dolor_fin,
          evolucion:         data.evolucion.trim(),
          notas_sesion:      notasFinal || null,
        })
        .select('id, paciente_id')
        .single()

      if (insertError) throw insertError
      if (!inserted) throw new Error('No se recibió respuesta al crear la sesión')

      return inserted as CrearSesionResult
    } finally {
      setSubmitting(false)
    }
  }

  return { pacientes, loading, submitting, error, crearSesion }
}
