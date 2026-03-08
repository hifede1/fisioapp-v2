// 🏥 Role: FISIO only
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@/lib/zodResolver'
import { supabase } from '@/lib/supabase'
import type { TablesInsert } from '@/lib/supabase'

// ─── Schema ──────────────────────────────────────────────────────────────────

const schema = z.object({
  nombre:            z.string().min(1, 'El nombre es requerido').max(100),
  apellidos:         z.string().min(1, 'Los apellidos son requeridos').max(100),
  email:             z.string().email('Introduce un email válido'),
  telefono:          z.string().max(20).optional().or(z.literal('')),
  fecha_nacimiento:  z.string().optional().or(z.literal('')),
  historial_medico:  z.string().max(5000).optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

interface PacienteCreado {
  nombre: string
  apellidos: string
  email: string
  paciente_id: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function inputClass(hasError?: boolean) {
  return `w-full px-3.5 py-2.5 rounded-lg border text-sm text-gray-900 placeholder-gray-400
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
    disabled:bg-gray-50 disabled:text-gray-400
    ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'}`
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  )
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({ paciente, onAddAnother }: { paciente: PacienteCreado; onAddAnother: () => void }) {
  const initials = `${paciente.nombre[0] ?? ''}${paciente.apellidos[0] ?? ''}`.toUpperCase()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-1">Paciente registrado</h2>
        <p className="text-sm text-gray-500 mb-6">
          {paciente.nombre} {paciente.apellidos} ha sido añadido a tu lista de pacientes.
        </p>

        {/* Avatar + info */}
        <div className="inline-flex items-center gap-3 bg-gray-50 rounded-xl px-5 py-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
            {initials}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">
              {paciente.nombre} {paciente.apellidos}
            </p>
            <p className="text-xs text-gray-500">{paciente.email}</p>
          </div>
        </div>

        {/* Info acceso */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-left mb-6">
          <div className="flex gap-2.5">
            <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-blue-800">
              El paciente puede acceder a la aplicación usando{' '}
              <span className="font-medium">{paciente.email}</span>. Para configurar su contraseña,
              debe usar la opción <span className="font-medium">"Olvidé mi contraseña"</span> en la pantalla de inicio de sesión.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={`/fisio/pacientes/${paciente.paciente_id}`}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Ver historial
          </Link>
          <button
            onClick={onAddAnother}
            className="flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Añadir otro paciente
          </button>
          <Link
            to="/fisio/pacientes"
            className="flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            Volver a la lista
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function NuevoPacienteFisio() {
  const navigate = useNavigate()
  const [pacienteCreado, setPacienteCreado] = useState<PacienteCreado | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormValues) => {
    setServerError(null)

    // ── Paso 0: obtener el fisioterapeuta_id del usuario actual ───────────────
    const sb = supabase as any // supabase-js v2.98 workaround para RPCs simples
    const { data: fisioIdRaw, error: fisioIdError } = await sb.rpc('get_fisioterapeuta_id')
    if (fisioIdError || !fisioIdRaw) {
      setServerError('No se pudo identificar tu cuenta de fisioterapeuta. Recarga la página e inténtalo de nuevo.')
      return
    }
    const fisioId = fisioIdRaw as string

    // ── Paso 1: INSERT profiles ───────────────────────────────────────────────
    const profileId = crypto.randomUUID()
    const profileInsert: TablesInsert<'profiles'> = {
      id:        profileId,
      role:      'paciente',
      nombre:    data.nombre.trim(),
      apellidos: data.apellidos.trim(),
      email:     data.email.trim().toLowerCase(),
      telefono:  data.telefono?.trim() || null,
    }

    const { error: profileError } = await (supabase as any)
      .from('profiles')
      .insert(profileInsert)

    if (profileError) {
      const msg = profileError.message ?? ''
      if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('profiles_email')) {
        setServerError('Ya existe un paciente registrado con ese email. Usa la opción de vincular desde la lista de pacientes si quieres añadirlo a tu consulta.')
      } else {
        setServerError(`Error al crear el perfil: ${msg}`)
      }
      return
    }

    // ── Paso 2: INSERT pacientes ──────────────────────────────────────────────
    const pacienteInsert: TablesInsert<'pacientes'> = {
      profile_id:       profileId,
      fecha_nacimiento: data.fecha_nacimiento || null,
      historial_medico: data.historial_medico?.trim() || null,
    }

    const { data: pacienteRow, error: pacienteError } = await (supabase as any)
      .from('pacientes')
      .insert(pacienteInsert)
      .select('id')
      .single()

    if (pacienteError || !pacienteRow) {
      // Rollback: eliminar el profile recién creado
      await (supabase as any).from('profiles').delete().eq('id', profileId)
      setServerError(`Error al registrar los datos del paciente: ${pacienteError?.message ?? 'respuesta inesperada'}`)
      return
    }

    const pacienteId = pacienteRow.id

    // ── Paso 3: INSERT fisioterapeuta_paciente ────────────────────────────────
    const vinculoInsert: TablesInsert<'fisioterapeuta_paciente'> = {
      fisioterapeuta_id: fisioId,
      paciente_id:       pacienteId,
    }

    const { error: vinculoError } = await (supabase as any)
      .from('fisioterapeuta_paciente')
      .insert(vinculoInsert)

    if (vinculoError) {
      // Rollback: eliminar paciente y profile
      await (supabase as any).from('pacientes').delete().eq('id', pacienteId)
      await (supabase as any).from('profiles').delete().eq('id', profileId)
      setServerError(`Error al vincular el paciente a tu consulta: ${vinculoError.message}`)
      return
    }

    // ── Éxito ─────────────────────────────────────────────────────────────────
    setPacienteCreado({
      nombre:      data.nombre.trim(),
      apellidos:   data.apellidos.trim(),
      email:       data.email.trim().toLowerCase(),
      paciente_id: pacienteId,
    })
  }

  const handleAddAnother = () => {
    setPacienteCreado(null)
    setServerError(null)
    reset()
  }

  if (pacienteCreado) {
    return <SuccessScreen paciente={pacienteCreado} onAddAnother={handleAddAnother} />
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/fisio/pacientes')}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo paciente</h1>
          <p className="text-sm text-gray-500 mt-0.5">Registra un paciente y añádelo a tu lista</p>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">

          {/* Sección: Datos personales */}
          <div className="p-6 space-y-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Datos personales
            </h2>

            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Nombre" required error={errors.nombre?.message}>
                <input
                  type="text"
                  autoComplete="given-name"
                  placeholder="Ana"
                  disabled={isSubmitting}
                  className={inputClass(!!errors.nombre)}
                  {...register('nombre')}
                />
              </Field>

              <Field label="Apellidos" required error={errors.apellidos?.message}>
                <input
                  type="text"
                  autoComplete="family-name"
                  placeholder="García López"
                  disabled={isSubmitting}
                  className={inputClass(!!errors.apellidos)}
                  {...register('apellidos')}
                />
              </Field>
            </div>

            <Field
              label="Email"
              required
              error={errors.email?.message}
              hint="El paciente usará este email para acceder a la aplicación."
            >
              <input
                type="email"
                autoComplete="off"
                placeholder="paciente@email.com"
                disabled={isSubmitting}
                className={inputClass(!!errors.email)}
                {...register('email')}
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Teléfono" error={errors.telefono?.message}>
                <input
                  type="tel"
                  autoComplete="tel"
                  placeholder="+34 600 000 000"
                  disabled={isSubmitting}
                  className={inputClass(!!errors.telefono)}
                  {...register('telefono')}
                />
              </Field>

              <Field label="Fecha de nacimiento" error={errors.fecha_nacimiento?.message}>
                <input
                  type="date"
                  disabled={isSubmitting}
                  className={inputClass(!!errors.fecha_nacimiento)}
                  {...register('fecha_nacimiento')}
                />
              </Field>
            </div>
          </div>

          {/* Sección: Notas médicas */}
          <div className="p-6 space-y-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Notas médicas iniciales
            </h2>

            <Field
              label="Historial médico / Motivo de consulta"
              error={errors.historial_medico?.message}
              hint="Puedes añadir diagnóstico, antecedentes, motivo de consulta o cualquier información clínica relevante. Se puede ampliar más adelante desde el historial del paciente."
            >
              <textarea
                rows={5}
                disabled={isSubmitting}
                placeholder="Describe el diagnóstico, antecedentes relevantes, motivo de consulta..."
                className={`${inputClass(!!errors.historial_medico)} resize-none`}
                {...register('historial_medico')}
              />
            </Field>
          </div>
        </div>

        {/* Error del servidor */}
        {serverError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2.5">
            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}

        {/* Acciones */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <Link
            to="/fisio/pacientes"
            className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Registrando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Registrar paciente
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
