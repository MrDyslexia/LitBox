import { User } from "../models/User"
import { Boleta } from "../models/Boleta"
import type { UsuarioFiltros, UserRole } from "../types"

// ─── Listar usuarios ──────────────────────────────────────────────────────────

export async function listarUsuarios(filtros: UsuarioFiltros) {
  const { page = 1, limit = 20, rol, activo, buscar } = filtros

  const query: Record<string, unknown> = {}
  if (rol) query.rol = rol
  if (activo !== undefined) query.activo = activo
  if (buscar) {
    query.$or = [
      { nombre: { $regex: buscar, $options: "i" } },
      { email: { $regex: buscar, $options: "i" } },
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

  // Agregar cantidad de boletas por usuario
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
  nombre: string
  email: string
  password: string
  rol: UserRole
}) {
  const existe = await User.findOne({ email: data.email.toLowerCase() })
  if (existe) {
    throw Object.assign(new Error("Ya existe un usuario con ese email"), { status: 409 })
  }

  const user = await User.create(data)
  return user.toPublic()
}

// ─── Actualizar usuario ───────────────────────────────────────────────────────

export async function actualizarUsuario(
  id: string,
  data: Partial<{ nombre: string; rol: UserRole; activo: boolean; password: string }>
) {
  const user = await User.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean()

  if (!user) {
    throw Object.assign(new Error("Usuario no encontrado"), { status: 404 })
  }
  return user
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

  // Las boletas quedan huérfanas para historial — decisión de negocio
  return { mensaje: "Usuario eliminado correctamente" }
}
