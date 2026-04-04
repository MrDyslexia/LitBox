// ─── Roles ────────────────────────────────────────────────────────────────────

export type UserRole = "empleado" | "auditor" | "gestor" | "administrador"

// ─── Estados de boleta ────────────────────────────────────────────────────────

export type BoletaEstado = "pendiente" | "en_revision" | "aprobada" | "rechazada" | "pagada"

// ─── Tipos de boleta (categorías de gasto) ───────────────────────────────────

export type BoletaTipo =
  | "Traslado"
  | "Reuniones comerciales"
  | "Insumos urgentes"
  | "Alimentación"
  | "Hospedaje"
  | "Comunicaciones"
  | "Materiales de oficina"
  | "Otro"

// ─── Acciones de auditoría ────────────────────────────────────────────────────

export type AuditAccion =
  | "crear"
  | "revisar"
  | "aprobar"
  | "rechazar"
  | "pagar"
  | "eliminar"
  | "actualizar"
  | "login"
  | "logout"

// ─── Payloads JWT ─────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string      // user._id
  email: string
  rol: UserRole
  iat?: number
  exp?: number
}

// ─── Contexto de usuario autenticado ─────────────────────────────────────────

export interface AuthUser {
  _id: string
  nombre: string
  email: string
  rol: UserRole
}

// ─── Parámetros de paginación ─────────────────────────────────────────────────

export interface PaginationParams {
  page?: number
  limit?: number
}

// ─── Filtros de boleta ────────────────────────────────────────────────────────

export interface BoletaFiltros extends PaginationParams {
  estado?: BoletaEstado
  tipo?: BoletaTipo
  empleadoId?: string
  desde?: string    // fecha ISO
  hasta?: string    // fecha ISO
  buscar?: string   // texto libre en descripción
}

// ─── Filtros de usuario ───────────────────────────────────────────────────────

export interface UsuarioFiltros extends PaginationParams {
  rol?: UserRole
  activo?: boolean
  buscar?: string
}
