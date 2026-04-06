// Tipos que mapean exactamente las respuestas del Backend (MongoDB)

export type UserRole = "empleado" | "auditor" | "gestor" | "administrador"
export type BoletaEstado = "pendiente" | "en_revision" | "aprobada" | "rechazada" | "pagada"
export type BoletaTipoApi =
  | "Traslado"
  | "Reuniones comerciales"
  | "Insumos urgentes"
  | "Alimentación"
  | "Hospedaje"
  | "Comunicaciones"
  | "Materiales de oficina"
  | "Otro"

export interface ApiUser {
  _id: string
  primerNombre: string
  segundoNombre?: string
  primerApellido: string
  segundoApellido?: string
  nombre: string
  rut: string
  email: string
  rol: UserRole
  activo: boolean
  avatar: string
  infoBancaria?: {
    banco: string
    tipoCuenta: "corriente" | "vista" | "ahorro"
    numeroCuenta: string
  }
  esNuevo: boolean
  fechaCreacion: string
  ultimoAcceso?: string
  totalBoletas?: number
}

export interface ApiBoleta {
  _id: string
  codigo: string
  tipo: BoletaTipoApi
  monto: number
  fecha: string
  descripcion: string
  estado: BoletaEstado
  empleado: { _id: string; nombre: string; email: string; avatar: string }
  auditor?: { _id: string; nombre: string; email: string; avatar: string }
  gestor?: { _id: string; nombre: string; email: string; avatar: string }
  comentarioAuditor?: string
  fechaRevision?: string
  fechaPago?: string
  imagen?: { url: string; nombre: string; tipo: string; tamano: number }
  comprobante?: { url: string; nombre: string; tipo: string; tamano: number }
  fechaCreacion: string
}

export interface ApiStats {
  pendiente: number
  en_revision: number
  aprobada: number
  rechazada: number
  pagada: number
  total: number
  montoAprobado: number
  montoPagado: number
  // KPI extensions
  porTipo: { tipo: string; total: number }[]
  tiempoPromedioResolucion: number | null
  boletasMes: number
  montoMes: number
  resueltasMes: number
  aprobadasMes: number
  rechazadasMes: number
  pagadasMes: number
  montoPagadoMes: number
  boletasAtrasadas: number
  tiempoEndToEnd: number | null
}

export interface ApiPaginated<T> {
  items: T[]
  total: number
  page: number
  totalPages: number
}

export interface NotificacionesConfig {
  creacion: boolean
  aprobacion: boolean
  rechazo: boolean
  atraso: boolean
}
