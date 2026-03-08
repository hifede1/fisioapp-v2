import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { FisioLayout } from '@/components/layout/FisioLayout'
import { DashboardFisio } from '@/pages/fisio/DashboardFisio'
import { PacientesFisio } from '@/pages/fisio/PacientesFisio'
import { NuevoPacienteFisio } from '@/pages/fisio/NuevoPacienteFisio'
import { CitasFisio } from '@/pages/fisio/CitasFisio'
import { NuevaCitaFisio } from '@/pages/fisio/NuevaCitaFisio'
import { HistorialPaciente } from '@/pages/fisio/HistorialPaciente'
import { NuevaSesionFisio } from '@/pages/fisio/NuevaSesionFisio'
import { EjerciciosFisio } from '@/pages/fisio/EjerciciosFisio'
import { NuevaRutinaFisio } from '@/pages/fisio/NuevaRutinaFisio'
import { PacienteLayout } from '@/components/layout/PacienteLayout'
import { DashboardPaciente } from '@/pages/paciente/DashboardPaciente'
import { RutinasPaciente } from '@/pages/paciente/RutinasPaciente'

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
      <p className="text-sm text-gray-400 mt-1">Próximamente disponible</p>
    </div>
  )
}

function RootRedirect() {
  const { profile, initialized } = useAuthStore()
  if (!initialized) return null
  if (!profile) return <Navigate to="/login" replace />
  if (profile.role === 'fisioterapeuta') return <Navigate to="/fisio" replace />
  if (profile.role === 'paciente') return <Navigate to="/paciente" replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  const initialize = useAuthStore(s => s.initialize)

  useEffect(() => {
    const unsubscribe = initialize()
    return unsubscribe
    // initialize es una acción estable de Zustand; no debe ser dependencia
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />

        {/* Rutas fisioterapeuta */}
        <Route
          path="/fisio"
          element={
            <ProtectedRoute requiredRole="fisioterapeuta">
              <FisioLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardFisio />} />
          <Route path="citas" element={<CitasFisio />} />
          <Route path="citas/nueva" element={<NuevaCitaFisio />} />
          <Route path="pacientes" element={<PacientesFisio />} />
          <Route path="pacientes/nuevo" element={<NuevoPacienteFisio />} />
          <Route path="pacientes/:id" element={<HistorialPaciente />} />
          <Route path="tratamientos" element={<ComingSoon title="Tratamientos" />} />
          <Route path="sesiones" element={<ComingSoon title="Sesiones" />} />
          <Route path="sesiones/nueva" element={<NuevaSesionFisio />} />
          <Route path="ejercicios" element={<EjerciciosFisio />} />
          <Route path="rutinas/nueva" element={<NuevaRutinaFisio />} />
          <Route path="notas" element={<ComingSoon title="Notas clínicas" />} />
          <Route path="notas/nueva" element={<ComingSoon title="Nueva nota clínica" />} />
          <Route path="perfil" element={<ComingSoon title="Mi perfil" />} />
        </Route>

        {/* Rutas paciente */}
        <Route
          path="/paciente"
          element={
            <ProtectedRoute requiredRole="paciente">
              <PacienteLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPaciente />} />
          <Route path="rutinas" element={<RutinasPaciente />} />
          <Route path="progreso" element={<ComingSoon title="Mi progreso" />} />
          <Route path="chat" element={<ComingSoon title="Chat con mi fisio" />} />
          <Route path="perfil" element={<ComingSoon title="Mi perfil" />} />
        </Route>

        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
