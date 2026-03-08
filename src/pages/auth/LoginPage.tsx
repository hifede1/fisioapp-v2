import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@/lib/zodResolver'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const { user, profile, initialized, signIn, loading } = useAuthStore()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  if (!initialized) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
  if (user) {
    if (!profile) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
    return <Navigate to={profile.role === 'fisioterapeuta' ? '/fisio' : '/dashboard'} replace />
  }

  const onSubmit = async (data: FormValues) => {
    setServerError(null)
    const { error } = await signIn(data.email, data.password)
    if (error) {
      setServerError('Email o contraseña incorrectos')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
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
          <p className="text-gray-500 mt-1">Bienvenido de nuevo</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
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
                autoComplete="current-password"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-gray-900 placeholder-gray-400 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
                  ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
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
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        {/* Enlace a registro */}
        <p className="text-center text-sm text-gray-500 mt-6">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="text-blue-600 hover:text-blue-700 font-medium">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}
