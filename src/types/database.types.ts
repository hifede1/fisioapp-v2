// Tipos generados manualmente a partir del esquema de la migración.
// Para regenerarlos automáticamente: npx supabase gen types typescript --linked > src/types/database.types.ts

export type UserRole = 'admin' | 'fisioterapeuta' | 'paciente'
export type EstadoCita = 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'no_asistio'
export type EstadoTratamiento = 'activo' | 'completado' | 'suspendido'
export type TipoPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'seguro'
export type EstadoPago = 'pendiente' | 'pagado' | 'parcial' | 'cancelado'
export type DificultadEjercicio = 'basico' | 'intermedio' | 'avanzado'
export type TipoNota = 'general' | 'evolucion' | 'incidencia' | 'alta'

// Tipo de retorno de la RPC buscar_paciente_por_email
export interface PacienteBuscadoRPC {
  profile_id: string
  nombre: string
  apellidos: string
  email: string
  telefono: string | null
  paciente_id: string | null
  fecha_nacimiento: string | null
  historial_medico: string | null
  alergias: string | null
  medicacion_actual: string | null
  ya_vinculado: boolean
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: UserRole
          nombre: string
          apellidos: string
          email: string
          telefono: string | null
          foto_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: UserRole
          nombre: string
          apellidos: string
          email: string
          telefono?: string | null
          foto_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: UserRole
          nombre?: string
          apellidos?: string
          email?: string
          telefono?: string | null
          foto_url?: string | null
          updated_at?: string
        }
      }
      clinicas: {
        Row: {
          id: string
          nombre: string
          direccion: string | null
          telefono: string | null
          email: string | null
          logo_url: string | null
          activa: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          direccion?: string | null
          telefono?: string | null
          email?: string | null
          logo_url?: string | null
          activa?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          nombre?: string
          direccion?: string | null
          telefono?: string | null
          email?: string | null
          logo_url?: string | null
          activa?: boolean
          updated_at?: string
        }
      }
      fisioterapeutas: {
        Row: {
          id: string
          profile_id: string
          clinica_id: string | null
          numero_colegiado: string | null
          especialidades: string[] | null
          biografia: string | null
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          clinica_id?: string | null
          numero_colegiado?: string | null
          especialidades?: string[] | null
          biografia?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          clinica_id?: string | null
          numero_colegiado?: string | null
          especialidades?: string[] | null
          biografia?: string | null
          activo?: boolean
          updated_at?: string
        }
      }
      pacientes: {
        Row: {
          id: string
          profile_id: string
          fecha_nacimiento: string | null
          dni: string | null
          direccion: string | null
          contacto_emergencia_nombre: string | null
          contacto_emergencia_telefono: string | null
          historial_medico: string | null
          alergias: string | null
          medicacion_actual: string | null
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          fecha_nacimiento?: string | null
          dni?: string | null
          direccion?: string | null
          contacto_emergencia_nombre?: string | null
          contacto_emergencia_telefono?: string | null
          historial_medico?: string | null
          alergias?: string | null
          medicacion_actual?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          fecha_nacimiento?: string | null
          dni?: string | null
          direccion?: string | null
          contacto_emergencia_nombre?: string | null
          contacto_emergencia_telefono?: string | null
          historial_medico?: string | null
          alergias?: string | null
          medicacion_actual?: string | null
          activo?: boolean
          updated_at?: string
        }
      }
      fisioterapeuta_paciente: {
        Row: {
          id: string
          fisioterapeuta_id: string
          paciente_id: string
          fecha_inicio: string
          fecha_fin: string | null
          activo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          fisioterapeuta_id: string
          paciente_id: string
          fecha_inicio?: string
          fecha_fin?: string | null
          activo?: boolean
          created_at?: string
        }
        Update: {
          fecha_fin?: string | null
          activo?: boolean
        }
      }
      disponibilidad: {
        Row: {
          id: string
          fisioterapeuta_id: string
          dia_semana: number
          hora_inicio: string
          hora_fin: string
          activo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          fisioterapeuta_id: string
          dia_semana: number
          hora_inicio: string
          hora_fin: string
          activo?: boolean
          created_at?: string
        }
        Update: {
          hora_inicio?: string
          hora_fin?: string
          activo?: boolean
        }
      }
      citas: {
        Row: {
          id: string
          fisioterapeuta_id: string
          paciente_id: string
          clinica_id: string | null
          fecha_hora: string
          duracion_minutos: number
          estado: EstadoCita
          motivo: string | null
          notas: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          fisioterapeuta_id: string
          paciente_id: string
          clinica_id?: string | null
          fecha_hora: string
          duracion_minutos?: number
          estado?: EstadoCita
          motivo?: string | null
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          clinica_id?: string | null
          fecha_hora?: string
          duracion_minutos?: number
          estado?: EstadoCita
          motivo?: string | null
          notas?: string | null
          updated_at?: string
        }
      }
      tratamientos: {
        Row: {
          id: string
          paciente_id: string
          fisioterapeuta_id: string
          titulo: string
          descripcion: string | null
          diagnostico: string | null
          objetivos: string | null
          estado: EstadoTratamiento
          fecha_inicio: string
          fecha_fin_estimada: string | null
          fecha_fin_real: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          paciente_id: string
          fisioterapeuta_id: string
          titulo: string
          descripcion?: string | null
          diagnostico?: string | null
          objetivos?: string | null
          estado?: EstadoTratamiento
          fecha_inicio?: string
          fecha_fin_estimada?: string | null
          fecha_fin_real?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          titulo?: string
          descripcion?: string | null
          diagnostico?: string | null
          objetivos?: string | null
          estado?: EstadoTratamiento
          fecha_fin_estimada?: string | null
          fecha_fin_real?: string | null
          updated_at?: string
        }
      }
      sesiones: {
        Row: {
          id: string
          cita_id: string | null
          tratamiento_id: string | null
          fisioterapeuta_id: string
          paciente_id: string
          fecha: string
          duracion_minutos: number | null
          notas_sesion: string | null
          evolucion: string | null
          dolor_inicio: number | null
          dolor_fin: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cita_id?: string | null
          tratamiento_id?: string | null
          fisioterapeuta_id: string
          paciente_id: string
          fecha?: string
          duracion_minutos?: number | null
          notas_sesion?: string | null
          evolucion?: string | null
          dolor_inicio?: number | null
          dolor_fin?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          cita_id?: string | null
          tratamiento_id?: string | null
          fecha?: string
          duracion_minutos?: number | null
          notas_sesion?: string | null
          evolucion?: string | null
          dolor_inicio?: number | null
          dolor_fin?: number | null
          updated_at?: string
        }
      }
      ejercicios: {
        Row: {
          id: string
          nombre: string
          descripcion: string | null
          instrucciones: string | null
          categoria: string | null
          musculos_objetivo: string[] | null
          dificultad: DificultadEjercicio | null
          video_url: string | null
          imagen_url: string | null
          creado_por: string | null
          publico: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          descripcion?: string | null
          instrucciones?: string | null
          categoria?: string | null
          musculos_objetivo?: string[] | null
          dificultad?: DificultadEjercicio | null
          video_url?: string | null
          imagen_url?: string | null
          creado_por?: string | null
          publico?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          nombre?: string
          descripcion?: string | null
          instrucciones?: string | null
          categoria?: string | null
          musculos_objetivo?: string[] | null
          dificultad?: DificultadEjercicio | null
          video_url?: string | null
          imagen_url?: string | null
          publico?: boolean
          updated_at?: string
        }
      }
      planes_ejercicios: {
        Row: {
          id: string
          tratamiento_id: string | null
          paciente_id: string
          fisioterapeuta_id: string
          nombre: string
          descripcion: string | null
          fecha_inicio: string | null
          fecha_fin: string | null
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tratamiento_id?: string | null
          paciente_id: string
          fisioterapeuta_id: string
          nombre: string
          descripcion?: string | null
          fecha_inicio?: string | null
          fecha_fin?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          tratamiento_id?: string | null
          nombre?: string
          descripcion?: string | null
          fecha_inicio?: string | null
          fecha_fin?: string | null
          activo?: boolean
          updated_at?: string
        }
      }
      plan_ejercicios_detalle: {
        Row: {
          id: string
          plan_id: string
          ejercicio_id: string
          orden: number
          series: number | null
          repeticiones: number | null
          duracion_segundos: number | null
          descanso_segundos: number | null
          notas: string | null
          created_at: string
        }
        Insert: {
          id?: string
          plan_id: string
          ejercicio_id: string
          orden?: number
          series?: number | null
          repeticiones?: number | null
          duracion_segundos?: number | null
          descanso_segundos?: number | null
          notas?: string | null
          created_at?: string
        }
        Update: {
          orden?: number
          series?: number | null
          repeticiones?: number | null
          duracion_segundos?: number | null
          descanso_segundos?: number | null
          notas?: string | null
        }
      }
      notas_clinicas: {
        Row: {
          id: string
          paciente_id: string
          fisioterapeuta_id: string
          sesion_id: string | null
          tipo: TipoNota
          contenido: string
          privada: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          paciente_id: string
          fisioterapeuta_id: string
          sesion_id?: string | null
          tipo?: TipoNota
          contenido: string
          privada?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          sesion_id?: string | null
          tipo?: TipoNota
          contenido?: string
          privada?: boolean
          updated_at?: string
        }
      }
      pagos: {
        Row: {
          id: string
          paciente_id: string
          cita_id: string | null
          monto: number
          tipo_pago: TipoPago
          estado: EstadoPago
          concepto: string | null
          fecha_pago: string | null
          notas: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          paciente_id: string
          cita_id?: string | null
          monto: number
          tipo_pago?: TipoPago
          estado?: EstadoPago
          concepto?: string | null
          fecha_pago?: string | null
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          cita_id?: string | null
          monto?: number
          tipo_pago?: TipoPago
          estado?: EstadoPago
          concepto?: string | null
          fecha_pago?: string | null
          notas?: string | null
          updated_at?: string
        }
      }
      notificaciones: {
        Row: {
          id: string
          user_id: string
          titulo: string
          mensaje: string
          tipo: string
          leida: boolean
          datos: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          titulo: string
          mensaje: string
          tipo?: string
          leida?: boolean
          datos?: Record<string, unknown> | null
          created_at?: string
        }
        Update: {
          leida?: boolean
          datos?: Record<string, unknown> | null
        }
      }
    }
    Views: {
      v_fisioterapeutas: {
        Row: {
          id: string
          profile_id: string
          nombre: string
          apellidos: string
          email: string
          telefono: string | null
          foto_url: string | null
          clinica_id: string | null
          clinica_nombre: string | null
          numero_colegiado: string | null
          especialidades: string[] | null
          biografia: string | null
          activo: boolean
        }
      }
      v_pacientes: {
        Row: {
          id: string
          profile_id: string
          nombre: string
          apellidos: string
          email: string
          telefono: string | null
          foto_url: string | null
          fecha_nacimiento: string | null
          dni: string | null
          direccion: string | null
          contacto_emergencia_nombre: string | null
          contacto_emergencia_telefono: string | null
          alergias: string | null
          medicacion_actual: string | null
          activo: boolean
        }
      }
      v_citas: {
        Row: {
          id: string
          fecha_hora: string
          duracion_minutos: number
          estado: EstadoCita
          motivo: string | null
          notas: string | null
          clinica_id: string | null
          clinica_nombre: string | null
          fisioterapeuta_id: string
          fisioterapeuta_nombre: string
          fisioterapeuta_apellidos: string
          paciente_id: string
          paciente_nombre: string
          paciente_apellidos: string
          created_at: string
        }
      }
    }
    Functions: {
      get_user_role: {
        Args: Record<never, never>
        Returns: UserRole
      }
      get_fisioterapeuta_id: {
        Args: Record<never, never>
        Returns: string
      }
      get_paciente_id: {
        Args: Record<never, never>
        Returns: string
      }
      buscar_paciente_por_email: {
        Args: { p_email: string }
        Returns: PacienteBuscadoRPC | null
      }
      vincular_paciente: {
        Args: {
          p_profile_id: string
          p_fecha_nacimiento?: string | null
          p_historial_medico?: string | null
          p_alergias?: string | null
          p_medicacion_actual?: string | null
        }
        Returns: { paciente_id: string; ya_vinculado: boolean }
      }
      crear_paciente_nuevo: {
        Args: {
          p_nombre: string
          p_apellidos: string
          p_email: string
          p_telefono?: string | null
          p_fecha_nacimiento?: string | null
          p_historial_medico?: string | null
        }
        Returns: {
          user_id: string
          paciente_id: string
          nombre: string
          apellidos: string
          email: string
        }
      }
    }
    Enums: {
      user_role: UserRole
      estado_cita: EstadoCita
      estado_tratamiento: EstadoTratamiento
      tipo_pago: TipoPago
      estado_pago: EstadoPago
      dificultad_ejercicio: DificultadEjercicio
      tipo_nota: TipoNota
    }
  }
}
