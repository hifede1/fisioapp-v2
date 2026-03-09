export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      clinicas: {
        Row: {
          activa: boolean
          created_at: string
          direccion: string | null
          email: string | null
          id: string
          logo_url: string | null
          nombre: string
          telefono: string | null
          updated_at: string
        }
        Insert: {
          activa?: boolean
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          nombre: string
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          activa?: boolean
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          nombre?: string
          telefono?: string | null
          updated_at?: string
        }
      }
      citas: {
        Row: {
          clinica_id: string | null
          created_at: string
          duracion_minutos: number
          estado: Database['public']['Enums']['estado_cita']
          fecha_hora: string
          fisioterapeuta_id: string
          id: string
          motivo: string | null
          notas: string | null
          paciente_id: string
          tratamiento_id: string | null
          updated_at: string
        }
        Insert: {
          clinica_id?: string | null
          created_at?: string
          duracion_minutos?: number
          estado?: Database['public']['Enums']['estado_cita']
          fecha_hora: string
          fisioterapeuta_id: string
          id?: string
          motivo?: string | null
          notas?: string | null
          paciente_id: string
          tratamiento_id?: string | null
          updated_at?: string
        }
        Update: {
          clinica_id?: string | null
          created_at?: string
          duracion_minutos?: number
          estado?: Database['public']['Enums']['estado_cita']
          fecha_hora?: string
          fisioterapeuta_id?: string
          id?: string
          motivo?: string | null
          notas?: string | null
          paciente_id?: string
          tratamiento_id?: string | null
          updated_at?: string
        }
      }
      disponibilidad: {
        Row: {
          activo: boolean
          created_at: string
          dia_semana: number
          fisioterapeuta_id: string
          hora_fin: string
          hora_inicio: string
          id: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          dia_semana: number
          fisioterapeuta_id: string
          hora_fin: string
          hora_inicio: string
          id?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          dia_semana?: number
          fisioterapeuta_id?: string
          hora_fin?: string
          hora_inicio?: string
          id?: string
        }
      }
      ejercicios: {
        Row: {
          categoria: string | null
          created_at: string
          creado_por: string | null
          descripcion: string | null
          dificultad: Database['public']['Enums']['dificultad_ejercicio'] | null
          id: string
          imagen_url: string | null
          instrucciones: string | null
          musculos_objetivo: string[] | null
          nombre: string
          publico: boolean
          updated_at: string
          video_url: string | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          creado_por?: string | null
          descripcion?: string | null
          dificultad?: Database['public']['Enums']['dificultad_ejercicio'] | null
          id?: string
          imagen_url?: string | null
          instrucciones?: string | null
          musculos_objetivo?: string[] | null
          nombre: string
          publico?: boolean
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          categoria?: string | null
          created_at?: string
          creado_por?: string | null
          descripcion?: string | null
          dificultad?: Database['public']['Enums']['dificultad_ejercicio'] | null
          id?: string
          imagen_url?: string | null
          instrucciones?: string | null
          musculos_objetivo?: string[] | null
          nombre?: string
          publico?: boolean
          updated_at?: string
          video_url?: string | null
        }
      }
      fisioterapeuta_paciente: {
        Row: {
          activo: boolean
          created_at: string
          fecha_fin: string | null
          fecha_inicio: string
          fisioterapeuta_id: string
          id: string
          paciente_id: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          fisioterapeuta_id: string
          id?: string
          paciente_id: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          fisioterapeuta_id?: string
          id?: string
          paciente_id?: string
        }
      }
      fisioterapeutas: {
        Row: {
          activo: boolean
          biografia: string | null
          clinica_id: string | null
          created_at: string
          especialidades: string[] | null
          id: string
          numero_colegiado: string | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          biografia?: string | null
          clinica_id?: string | null
          created_at?: string
          especialidades?: string[] | null
          id?: string
          numero_colegiado?: string | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          biografia?: string | null
          clinica_id?: string | null
          created_at?: string
          especialidades?: string[] | null
          id?: string
          numero_colegiado?: string | null
          profile_id?: string
          updated_at?: string
        }
      }
      notas_clinicas: {
        Row: {
          contenido: string
          created_at: string
          fisioterapeuta_id: string
          id: string
          paciente_id: string
          privada: boolean
          sesion_id: string | null
          tipo: Database['public']['Enums']['tipo_nota']
          updated_at: string
        }
        Insert: {
          contenido: string
          created_at?: string
          fisioterapeuta_id: string
          id?: string
          paciente_id: string
          privada?: boolean
          sesion_id?: string | null
          tipo?: Database['public']['Enums']['tipo_nota']
          updated_at?: string
        }
        Update: {
          contenido?: string
          created_at?: string
          fisioterapeuta_id?: string
          id?: string
          paciente_id?: string
          privada?: boolean
          sesion_id?: string | null
          tipo?: Database['public']['Enums']['tipo_nota']
          updated_at?: string
        }
      }
      notificaciones: {
        Row: {
          created_at: string
          datos: Json | null
          id: string
          leida: boolean
          mensaje: string
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          datos?: Json | null
          id?: string
          leida?: boolean
          mensaje: string
          tipo?: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          datos?: Json | null
          id?: string
          leida?: boolean
          mensaje?: string
          tipo?: string
          titulo?: string
          user_id?: string
        }
      }
      pacientes: {
        Row: {
          activo: boolean
          alergias: string | null
          contacto_emergencia_nombre: string | null
          contacto_emergencia_telefono: string | null
          created_at: string
          direccion: string | null
          dni: string | null
          fecha_nacimiento: string | null
          historial_medico: string | null
          id: string
          medicacion_actual: string | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          alergias?: string | null
          contacto_emergencia_nombre?: string | null
          contacto_emergencia_telefono?: string | null
          created_at?: string
          direccion?: string | null
          dni?: string | null
          fecha_nacimiento?: string | null
          historial_medico?: string | null
          id?: string
          medicacion_actual?: string | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          alergias?: string | null
          contacto_emergencia_nombre?: string | null
          contacto_emergencia_telefono?: string | null
          created_at?: string
          direccion?: string | null
          dni?: string | null
          fecha_nacimiento?: string | null
          historial_medico?: string | null
          id?: string
          medicacion_actual?: string | null
          profile_id?: string
          updated_at?: string
        }
      }
      pagos: {
        Row: {
          cita_id: string | null
          concepto: string | null
          created_at: string
          estado: Database['public']['Enums']['estado_pago']
          fecha_pago: string | null
          id: string
          monto: number
          notas: string | null
          paciente_id: string
          tipo_pago: Database['public']['Enums']['tipo_pago']
          updated_at: string
        }
        Insert: {
          cita_id?: string | null
          concepto?: string | null
          created_at?: string
          estado?: Database['public']['Enums']['estado_pago']
          fecha_pago?: string | null
          id?: string
          monto: number
          notas?: string | null
          paciente_id: string
          tipo_pago?: Database['public']['Enums']['tipo_pago']
          updated_at?: string
        }
        Update: {
          cita_id?: string | null
          concepto?: string | null
          created_at?: string
          estado?: Database['public']['Enums']['estado_pago']
          fecha_pago?: string | null
          id?: string
          monto?: number
          notas?: string | null
          paciente_id?: string
          tipo_pago?: Database['public']['Enums']['tipo_pago']
          updated_at?: string
        }
      }
      plan_ejercicios_detalle: {
        Row: {
          created_at: string
          descanso_segundos: number | null
          duracion_segundos: number | null
          ejercicio_id: string
          id: string
          notas: string | null
          orden: number
          plan_id: string
          repeticiones: number | null
          series: number | null
        }
        Insert: {
          created_at?: string
          descanso_segundos?: number | null
          duracion_segundos?: number | null
          ejercicio_id: string
          id?: string
          notas?: string | null
          orden?: number
          plan_id: string
          repeticiones?: number | null
          series?: number | null
        }
        Update: {
          created_at?: string
          descanso_segundos?: number | null
          duracion_segundos?: number | null
          ejercicio_id?: string
          id?: string
          notas?: string | null
          orden?: number
          plan_id?: string
          repeticiones?: number | null
          series?: number | null
        }
      }
      planes_ejercicios: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          fisioterapeuta_id: string
          id: string
          nombre: string
          paciente_id: string
          tratamiento_id: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          fisioterapeuta_id: string
          id?: string
          nombre: string
          paciente_id: string
          tratamiento_id?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          fisioterapeuta_id?: string
          id?: string
          nombre?: string
          paciente_id?: string
          tratamiento_id?: string | null
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          apellidos: string
          created_at: string
          email: string
          foto_url: string | null
          id: string
          nombre: string
          role: Database['public']['Enums']['user_role']
          telefono: string | null
          updated_at: string
        }
        Insert: {
          apellidos: string
          created_at?: string
          email: string
          foto_url?: string | null
          id: string
          nombre: string
          role?: Database['public']['Enums']['user_role']
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          apellidos?: string
          created_at?: string
          email?: string
          foto_url?: string | null
          id?: string
          nombre?: string
          role?: Database['public']['Enums']['user_role']
          telefono?: string | null
          updated_at?: string
        }
      }
      sesiones: {
        Row: {
          cita_id: string | null
          created_at: string
          dolor_fin: number | null
          dolor_inicio: number | null
          duracion_minutos: number | null
          evolucion: string | null
          fecha: string
          fisioterapeuta_id: string
          id: string
          notas_sesion: string | null
          paciente_id: string
          tratamiento_id: string | null
          updated_at: string
        }
        Insert: {
          cita_id?: string | null
          created_at?: string
          dolor_fin?: number | null
          dolor_inicio?: number | null
          duracion_minutos?: number | null
          evolucion?: string | null
          fecha?: string
          fisioterapeuta_id: string
          id?: string
          notas_sesion?: string | null
          paciente_id: string
          tratamiento_id?: string | null
          updated_at?: string
        }
        Update: {
          cita_id?: string | null
          created_at?: string
          dolor_fin?: number | null
          dolor_inicio?: number | null
          duracion_minutos?: number | null
          evolucion?: string | null
          fecha?: string
          fisioterapeuta_id?: string
          id?: string
          notas_sesion?: string | null
          paciente_id?: string
          tratamiento_id?: string | null
          updated_at?: string
        }
      }
      tratamientos: {
        Row: {
          created_at: string
          descripcion: string | null
          diagnostico: string | null
          estado: Database['public']['Enums']['estado_tratamiento']
          fecha_fin_estimada: string | null
          fecha_fin_real: string | null
          fecha_inicio: string
          fisioterapeuta_id: string
          id: string
          objetivos: string | null
          paciente_id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          diagnostico?: string | null
          estado?: Database['public']['Enums']['estado_tratamiento']
          fecha_fin_estimada?: string | null
          fecha_fin_real?: string | null
          fecha_inicio?: string
          fisioterapeuta_id: string
          id?: string
          objetivos?: string | null
          paciente_id: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          diagnostico?: string | null
          estado?: Database['public']['Enums']['estado_tratamiento']
          fecha_fin_estimada?: string | null
          fecha_fin_real?: string | null
          fecha_inicio?: string
          fisioterapeuta_id?: string
          id?: string
          objetivos?: string | null
          paciente_id?: string
          titulo?: string
          updated_at?: string
        }
      }
    }
    Views: {
      v_citas: {
        Row: {
          clinica_id: string | null
          clinica_nombre: string | null
          created_at: string | null
          duracion_minutos: number | null
          estado: Database['public']['Enums']['estado_cita'] | null
          fecha_hora: string | null
          fisioterapeuta_apellidos: string | null
          fisioterapeuta_id: string | null
          fisioterapeuta_nombre: string | null
          id: string | null
          motivo: string | null
          notas: string | null
          paciente_apellidos: string | null
          paciente_id: string | null
          paciente_nombre: string | null
        }
      }
      v_fisioterapeutas: {
        Row: {
          activo: boolean | null
          apellidos: string | null
          biografia: string | null
          clinica_id: string | null
          clinica_nombre: string | null
          email: string | null
          especialidades: string[] | null
          foto_url: string | null
          id: string | null
          nombre: string | null
          numero_colegiado: string | null
          profile_id: string | null
          telefono: string | null
        }
      }
      v_pacientes: {
        Row: {
          activo: boolean | null
          alergias: string | null
          apellidos: string | null
          contacto_emergencia_nombre: string | null
          contacto_emergencia_telefono: string | null
          direccion: string | null
          dni: string | null
          email: string | null
          fecha_nacimiento: string | null
          foto_url: string | null
          id: string | null
          medicacion_actual: string | null
          nombre: string | null
          profile_id: string | null
          telefono: string | null
        }
      }
    }
    Functions: {
      buscar_paciente_por_email: {
        Args: {
          p_email: string
        }
        Returns: Json
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
        Returns: Json
      }
      get_fisioterapeuta_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_paciente_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database['public']['Enums']['user_role']
      }
      vincular_paciente: {
        Args: {
          p_profile_id: string
          p_fecha_nacimiento?: string | null
          p_historial_medico?: string | null
          p_alergias?: string | null
          p_medicacion_actual?: string | null
        }
        Returns: Json
      }
    }
    Enums: {
      dificultad_ejercicio: 'basico' | 'intermedio' | 'avanzado'
      estado_cita: 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'no_asistio'
      estado_pago: 'pendiente' | 'pagado' | 'parcial' | 'cancelado'
      estado_tratamiento: 'activo' | 'completado' | 'suspendido'
      tipo_nota: 'general' | 'evolucion' | 'incidencia' | 'alta'
      tipo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'seguro'
      user_role: 'admin' | 'fisioterapeuta' | 'paciente'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ─── Convenience type aliases (named exports consumed across the codebase) ────

export type UserRole = Database['public']['Enums']['user_role']
export type EstadoCita = Database['public']['Enums']['estado_cita']
export type EstadoTratamiento = Database['public']['Enums']['estado_tratamiento']
export type EstadoPago = Database['public']['Enums']['estado_pago']
export type TipoPago = Database['public']['Enums']['tipo_pago']
export type TipoNota = Database['public']['Enums']['tipo_nota']
export type DificultadEjercicio = Database['public']['Enums']['dificultad_ejercicio']
