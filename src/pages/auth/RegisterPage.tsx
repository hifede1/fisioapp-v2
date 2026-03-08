import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@/lib/zodResolver'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellidos: z.string().min(1, 'Los apellidos son requeridos'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  role: z.enum(['fisioterapeuta', 'paciente']),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type FormValues = z.infer<typeof schema>

export function RegisterPage() {
  const { user, signUp, loading } = useAuthStore()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'paciente' },
  })

  if (user) return <Navigate to="/" replace />

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Revisa tu email</h2>
            <p className="text-gray-500 text-sm">
              Te hemos enviado un enlace de confirmación. Por favor, revisa tu bandeja de entrada y confirma tu cuenta para continuar.
            </p>
            <Link
              to="/login"
              className="inline-block mt-6 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const onSubmit = async (data: FormValues) => {
    setServerError(null)
    const { error, needsConfirmation } = await signUp({
      email: data.email,
      password: data.password,
      nombre: data.nombre,
      apellidos: data.apellidos,
      role: data.role,
    })
    if (error) {
      setServerError(error)
    } else if (needsConfirmation) {
      setEmailSent(true)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">FisioApp</h1>
          <p className="text-gray-500 mt-1">Crea tu cuenta</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Nombre + Apellidos */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre
                </label>
                <input
                  id="nombre"
                  type="text"
                  autoComplete="given-name"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-gray-900 placeholder-gray-400 text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
                    ${errors.nombre ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
                  placeholder="Ana"
                  {...register('nombre')}
                />
                {errors.nombre && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.nombre.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Apellidos
                </label>
                <input
                  id="apellidos"
                  type="text"
                  autoComplete="family-name"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-gray-900 placeholder-gray-400 text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
                    ${errors.apellidos ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
                  placeholder="García"
                  {...register('apellidos')}
                />
                {errors.apellidos && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.apellidos.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-gray-900 placeholder-gray-400 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
                  ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
                placeholder="tu@email.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-gray-900 placeholder-gray-400 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
                  ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
                placeholder="Mínimo 8 caracteres"
                {...register('password')}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-gray-900 placeholder-gray-400 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
                  ${errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
                placeholder="Repite tu contraseña"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Rol */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Soy...
              </label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: 'fisioterapeuta', label: 'Fisioterapeuta', icon: '🩺' },
                  { value: 'paciente', label: 'Paciente', icon: '🧑‍⚕️' },
                ] as const).map(({ value, label, icon }) => (
                  <label
                    key={value}
                    className="relative flex cursor-pointer rounded-lg border p-3 focus-within:ring-2 focus-within:ring-blue-500 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 border-gray-300 transition"
                  >
                    <input
                      type="radio"
                      value={value}
                      className="sr-only"
                      {...register('role')}
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{icon}</span>
                      <span className="text-sm font-medium text-gray-900">{label}</span>
                    </div>
                  </label>
                ))}
              </div>
              {errors.role && (
                <p className="mt-1.5 text-xs text-red-600">{errors.role.message}</p>
              )}
            </div>

            {/* Error del servidor */}
            {serverError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-700">{serverError}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white
                font-medium py-2.5 px-4 rounded-lg transition text-sm cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        {/* Enlace a login */}
        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
