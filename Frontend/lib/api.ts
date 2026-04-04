import type { ApiUser, ApiBoleta, ApiStats, ApiPaginated } from "./types"
import type { Boleta } from "./mock-data"

const BASE = process.env.NEXT_PUBLIC_API_URL
// ─── Error tipado ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = "ApiError"
  }
}

// ─── Fetch base ───────────────────────────────────────────────────────────────

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: isFormData
      ? (options?.headers ?? {})
      : { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new ApiError(res.status, data.error ?? `Error ${res.status}`)
  }

  // 204 No Content
  if (res.status === 204) return undefined as T
  return res.json()
}

// ─── Normalización ApiBoleta → Boleta (frontend) ─────────────────────────────

export function normalizeBoleta(b: ApiBoleta): Boleta & { _id: string } {
  return {
    _id: b._id,
    id: b.codigo,
    tipo: b.tipo as Boleta["tipo"],
    monto: b.monto,
    fecha: b.fecha?.split("T")[0] ?? "",
    descripcion: b.descripcion,
    estado: b.estado,
    empleadoNombre: b.empleado?.nombre ?? "",
    empleadoEmail: b.empleado?.email ?? "",
    imageUrl: b.imagen?.url ?? "",
    comentarioAuditor: b.comentarioAuditor,
    fechaRevision: b.fechaRevision ? b.fechaRevision.split("T")[0] : undefined,
    gestorNombre: b.gestor?.nombre,
    fechaPago: b.fechaPago ? b.fechaPago.split("T")[0] : undefined,
    comprobanteUrl: b.comprobante?.url,
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const auth = {
  login: (email: string, password: string) =>
    req<{ token: string; user: ApiUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    req<void>("/api/auth/logout", { method: "POST" }),

  me: () =>
    req<ApiUser>("/api/auth/me"),
}

// ─── Boletas ──────────────────────────────────────────────────────────────────

export const boletasApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return req<ApiPaginated<ApiBoleta>>(`/api/boletas${qs}`)
  },

  stats: () =>
    req<ApiStats>("/api/boletas/stats"),

  create: (data: {
    tipo: string
    monto: number
    fecha: string
    descripcion: string
    imagen?: { url: string; nombre: string; tipo: string; tamano: number }
  }) =>
    req<ApiBoleta>("/api/boletas", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  revisar: (id: string) =>
    req<ApiBoleta>(`/api/boletas/${id}/revisar`, {
      method: "PATCH",
      body: JSON.stringify({}),
    }),

  aprobar: (id: string, comentario?: string) =>
    req<ApiBoleta>(`/api/boletas/${id}/aprobar`, {
      method: "PATCH",
      body: JSON.stringify({ comentario }),
    }),

  rechazar: (id: string, comentario?: string) =>
    req<ApiBoleta>(`/api/boletas/${id}/rechazar`, {
      method: "PATCH",
      body: JSON.stringify({ comentario }),
    }),

  pagar: (id: string, comprobante: { url: string; nombre: string; tipo: string; tamano: number }) =>
    req<ApiBoleta>(`/api/boletas/${id}/pagar`, {
      method: "PATCH",
      body: JSON.stringify({ comprobante }),
    }),

  eliminar: (id: string) =>
    req<{ mensaje: string }>(`/api/boletas/${id}`, { method: "DELETE" }),
}

// ─── Usuarios ─────────────────────────────────────────────────────────────────

export const usersApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return req<ApiPaginated<ApiUser>>(`/api/users${qs}`)
  },

  create: (data: { nombre: string; email: string; password: string; rol: string }) =>
    req<ApiUser>("/api/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  toggleStatus: (id: string) =>
    req<{ activo: boolean; mensaje: string }>(`/api/users/${id}/toggle-status`, {
      method: "PATCH",
      body: JSON.stringify({}),
    }),

  delete: (id: string) =>
    req<{ mensaje: string }>(`/api/users/${id}`, { method: "DELETE" }),
}

// ─── Uploads ──────────────────────────────────────────────────────────────────

export const uploadsApi = {
  upload: (file: File) => {
    const fd = new FormData()
    fd.append("file", file)
    return req<{ url: string; nombre: string; tipo: string; tamano: number }>("/api/uploads", {
      method: "POST",
      body: fd,
    })
  },
}
