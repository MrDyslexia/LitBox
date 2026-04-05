import { randomBytes } from "crypto"
import { User } from "../models/User"
import { Boleta } from "../models/Boleta"
import type { UsuarioFiltros, UserRole } from "../types"
import { notificarBienvenida } from "../services/notificaciones.service"

// ─── Generador de contraseña ──────────────────────────────────────────────────

function generarPassword(): string {
  // 12 caracteres URL-safe (letras + números)
  return randomBytes(9).toString("base64url")
}

// ─── Listar usuarios ──────────────────────────────────────────────────────────

export async function listarUsuarios(filtros: UsuarioFiltros) {
  const { page = 1, limit = 20, rol, activo, buscar } = filtros

  const query: Record<string, unknown> = {}
  if (rol) query.rol = rol
  if (activo !== undefined) query.activo = activo
  if (buscar) {
    query.$or = [
      { nombre:        { $regex: buscar, $options: "i" } },
      { email:         { $regex: buscar, $options: "i" } },
      { rut:           { $regex: buscar, $options: "i" } },
    ]
  }

  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    User.find(query)
      .sort({ fechaCreacion: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ])

  const ids = items.map((u) => u._id)
  const boletaCounts = await Boleta.aggregate([
    { $match: { empleado: { $in: ids } } },
    { $group: { _id: "$empleado", total: { $sum: 1 } } },
  ])
  const countMap = Object.fromEntries(boletaCounts.map((c) => [String(c._id), c.total]))

  return {
    items: items.map((u) => ({ ...u, totalBoletas: countMap[String(u._id)] ?? 0 })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

// ─── Obtener usuario ──────────────────────────────────────────────────────────

export async function obtenerUsuario(id: string) {
  const user = await User.findById(id).lean()
  if (!user) {
    throw Object.assign(new Error("Usuario no encontrado"), { status: 404 })
  }
  return user
}

// ─── Crear usuario (admin) ────────────────────────────────────────────────────

export async function crearUsuario(data: {
  primerNombre: string
  segundoNombre?: string
  primerApellido: string
  segundoApellido?: string
  rut: string
  email: string
  rol: UserRole
  infoBancaria?: {
    banco: string
    tipoCuenta: "corriente" | "vista" | "ahorro"
    numeroCuenta: string
  }
}) {
  const [existeEmail, existeRut] = await Promise.all([
    User.findOne({ email: data.email.toLowerCase() }),
    User.findOne({ rut: data.rut }),
  ])
  if (existeEmail) {
    throw Object.assign(new Error("Ya existe un usuario con ese email"), { status: 409 })
  }
  if (existeRut) {
    throw Object.assign(new Error("Ya existe un usuario con ese RUT"), { status: 409 })
  }

  const password = generarPassword()

  const user = await User.create({ ...data, password, esNuevo: true })

  notificarBienvenida({
    nombre: user.nombre,
    email: data.email,
    password,
    rol: data.rol,
  }).catch((err) => console.error("[notif] bienvenida:", err))

  return user.toPublic()
}

// ─── Actualizar usuario ───────────────────────────────────────────────────────

export async function actualizarUsuario(
  id: string,
  data: Partial<{
    primerNombre: string
    segundoNombre: string
    primerApellido: string
    segundoApellido: string
    rut: string
    rol: UserRole
    activo: boolean
    infoBancaria: { banco: string; tipoCuenta: string; numeroCuenta: string }
  }>
) {
  const user = await User.findById(id)
  if (!user) {
    throw Object.assign(new Error("Usuario no encontrado"), { status: 404 })
  }

  Object.assign(user, data)
  await user.save()

  return user.toPublic()
}

// ─── Toggle activo/inactivo ───────────────────────────────────────────────────

export async function toggleEstado(id: string) {
  const user = await User.findById(id)
  if (!user) {
    throw Object.assign(new Error("Usuario no encontrado"), { status: 404 })
  }

  user.activo = !user.activo
  await user.save()

  return { activo: user.activo, mensaje: `Usuario ${user.activo ? "activado" : "desactivado"}` }
}

// ─── Eliminar usuario ─────────────────────────────────────────────────────────

export async function eliminarUsuario(id: string) {
  const user = await User.findByIdAndDelete(id)
  if (!user) {
    throw Object.assign(new Error("Usuario no encontrado"), { status: 404 })
  }

  return { mensaje: "Usuario eliminado correctamente" }
}
