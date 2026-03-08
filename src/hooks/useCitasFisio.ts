// 🏥 Role: FISIO only

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { Views } from '@/lib/supabase'

// Supabase JS v2.98 no infiere correctamente los tipos sobre vistas y filtros .in()/.eq() con enums.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any

export type FiltroEstado = 'todas' | 'pendiente' | 'confirmada' | 'cancelada' | 'completada'
export type FiltroFecha  = 'hoy' | 'semana' | 'mes' | 'todas'

export interface UseCitasFisioResult {
  citas: Views<'v_citas'>[]
  loading: boolean
  error: string | null
  filtroEstado: FiltroEstado
  setFiltroEstado: (f: FiltroEstado) => void
  filtroFecha: FiltroFecha
  setFiltroFecha: (f: FiltroFecha) => void
  cancelarCita: (id: string) => Promise<void>
  completarCita: (id: string) => Promise<void>
  refetch: () => void
}

// Ventana de fetch: últimos 30 días + próximos 3 meses
function getVentanaFetch(): { desde: string; hasta: string } {
  const ahora = new Date()
  const desde = new Date(ahora)
  desde.setDate(desde.getDate() - 30)
  const hasta = new Date(ahora)
  hasta.setMonth(hasta.getMonth() + 3)
  return { desde: desde.toISOString(), hasta: hasta.toISOString() }
}

// Helpers para los filtros de fecha aplicados en el cliente
function esMismaFecha(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  )
}

function aplicarFiltroFecha(citas: Views<'v_citas'>[], filtro: FiltroFecha): Views<'v_citas'>[] {
  if (filtro === 'todas') return citas

  const ahora  = new Date()
  const hoy    = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())

  if (filtro === 'hoy') {
    return citas.filter(c => esMismaFecha(new Date(c.fecha_hora), hoy))
  }

  if (filtro === 'semana') {
    // Lunes de esta semana
    const lunes = new Date(hoy)
    const dow   = hoy.getDay() === 0 ? 6 : hoy.getDay() - 1  // 0=lun, 6=dom
    lunes.setDate(hoy.getDate() - dow)
    const domingo = new Date(lunes)
    domingo.setDate(lunes.getDate() + 6)
    domingo.setHours(23, 59, 59, 999)
    return citas.filter(c => {
      const d = new Date(c.fecha_hora)
      return d >= lunes && d <= domingo
    })
  }

  if (filtro === 'mes') {
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const finMes    = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59, 999)
    return citas.filter(c => {
      const d = new Date(c.fecha_hora)
      return d >= inicioMes && d <= finMes
    })
  }

  return citas
}

export function useCitasFisio(): UseCitasFisioResult {
  const [citasRaw, setCitasRaw]       = useState<Views<'v_citas'>[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [tick, setTick]               = useState(0)
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todas')
  const [filtroFecha, setFiltroFecha]   = useState<FiltroFecha>('semana')

  useEffect(() => {
    let cancelled = false

    async function fetchCitas() {
      setLoading(true)
      setError(null)

      try {
        const { data: fisioIdRaw, error: rpcError } = await supabase.rpc('get_fisioterapeuta_id')
        if (rpcError || !fisioIdRaw) throw new Error('No se encontró el perfil de fisioterapeuta')
        const fisioId = fisioIdRaw as string

        const { desde, hasta } = getVentanaFetch()

        const { data, error: fetchError } = await sb
          .from('v_citas')
          .select('*')
          .eq('fisioterapeuta_id', fisioId)
          .gte('fecha_hora', desde)
          .lte('fecha_hora', hasta)
          .order('fecha_hora', { ascending: true })

        if (fetchError) throw fetchError

        if (!cancelled) {
          setCitasRaw((data ?? []) as Views<'v_citas'>[])
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar las citas')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchCitas()
    return () => { cancelled = true }
  }, [tick])

  // Filtros aplicados en el cliente para evitar problemas de tipos con supabase-js v2.98
  const citas = useMemo(() => {
    let resultado = citasRaw

    if (filtroEstado !== 'todas') {
      resultado = resultado.filter(c => c.estado === filtroEstado)
    }

    resultado = aplicarFiltroFecha(resultado, filtroFecha)

    return resultado
  }, [citasRaw, filtroEstado, filtroFecha])

  const cancelarCita = async (id: string): Promise<void> => {
    const { error: updateError } = await sb
      .from('citas')
      .update({ estado: 'cancelada' })
      .eq('id', id)

    if (updateError) throw new Error(updateError.message ?? 'Error al cancelar la cita')

    // Actualiza el estado local sin refetch completo
    setCitasRaw(prev =>
      prev.map(c => c.id === id ? { ...c, estado: 'cancelada' } : c)
    )
  }

  const completarCita = async (id: string): Promise<void> => {
    const { error: updateError } = await sb
      .from('citas')
      .update({ estado: 'completada' })
      .eq('id', id)

    if (updateError) throw new Error(updateError.message ?? 'Error al completar la cita')

    setCitasRaw(prev =>
      prev.map(c => c.id === id ? { ...c, estado: 'completada' } : c)
    )
  }

  return {
    citas,
    loading,
    error,
    filtroEstado,
    setFiltroEstado,
    filtroFecha,
    setFiltroFecha,
    cancelarCita,
    completarCita,
    refetch: () => setTick(t => t + 1),
  }
}
