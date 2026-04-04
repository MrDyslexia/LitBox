import { Boleta } from "../models/Boleta"
import { AuditLog } from "../models/AuditLog"
import { Types } from "mongoose"
import type { BoletaFiltros, AuthUser } from "../types"
import { broadcast } from "../ws/broadcaster"

// ─── Listar boletas (filtros + paginación) ────────────────────────────────────

export async function listarBoletas(filtros: BoletaFiltros, authUser: AuthUser) {
  const { page = 1, limit = 20, estado, tipo, empleadoId, desde, hasta, buscar } = filtros

  const query: Record<string, unknown> = {}

  // Empleados solo ven sus propias boletas — ObjectId cast para que el match funcione
  if (authUser.rol === "empleado") {
    query.empleado = new Types.ObjectId(authUser._id)
  } else if (empleadoId) {
    query.empleado = new Types.ObjectId(empleadoId)
  }

  if (estado) query.estado = estado
  if (tipo) query.tipo = tipo

  if (desde || hasta) {
    query.fecha = {}
    if (desde) (query.fecha as Record<string, unknown>).$gte = new Date(desde)
    if (hasta) (query.fecha as Record<string, unknown>).$lte = new Date(hasta)
  }

  if (buscar) {
    query.descripcion = { $regex: buscar, $options: "i" }
  }

  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    Boleta.find(query)
      .populate("empleado", "nombre email avatar")
      .populate("auditor", "nombre email avatar")
      .populate("gestor", "nombre email avatar")
      .sort({ fechaCreacion: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Boleta.countDocuments(query),
  ])

  return { items, total, page, totalPages: Math.ceil(total / limit) }
}

// ─── Obtener una boleta ───────────────────────────────────────────────────────

export async function obtenerBoleta(id: string, authUser: AuthUser) {
  const boleta = await Boleta.findById(id)
    .populate("empleado", "nombre email avatar")
    .populate("auditor", "nombre email avatar")
    .populate("gestor", "nombre email avatar")
    .lean()

  if (!boleta) {
    throw Object.assign(new Error("Boleta no encontrada"), { status: 404 })
  }

  if (
    authUser.rol === "empleado" &&
    String((boleta.empleado as { _id: unknown })._id) !== authUser._id
  ) {
    throw Object.assign(new Error("Acceso denegado"), { status: 403 })
  }

  return boleta
}

// ─── Crear boleta ─────────────────────────────────────────────────────────────

export async function crearBoleta(
  data: {
    tipo: string
    monto: number
    fecha: string
    descripcion: string
    imagen?: { url: string; nombre: string; tipo: string; tamano: number }
  },
  authUser: AuthUser
) {
  const boleta = await Boleta.create({
    ...data,
    fecha: new Date(data.fecha),
    empleado: authUser._id,
    estado: "pendiente",
  })

  await AuditLog.create({
    boleta: boleta._id,
    usuario: authUser._id,
    accion: "crear",
    estadoNuevo: "pendiente",
  })

  const resultado = await Boleta.findById(boleta._id).lean()
  broadcast({ type: "boleta:created", boletaId: boleta._id.toString() })
  return resultado
}

// ─── Cambiar estado (auditor) ─────────────────────────────────────────────────

// Transiciones de estado válidas
const TRANSICIONES: Record<string, string[]> = {
  revisar: ["pendiente"],
  aprobar: ["pendiente", "en_revision"],
  rechazar: ["pendiente", "en_revision"],
  pagar:   ["aprobada"],
}

export async function cambiarEstado(
  id: string,
  accion: "revisar" | "aprobar" | "rechazar" | "pagar",
  comentario: string | undefined,
  authUser: AuthUser,
  comprobante?: { url: string; nombre: string; tipo: string; tamano: number }
) {
  const boleta = await Boleta.findById(id)
  if (!boleta) {
    throw Object.assign(new Error("Boleta no encontrada"), { status: 404 })
  }

  if (!TRANSICIONES[accion].includes(boleta.estado)) {
    throw Object.assign(
      new Error(`No se puede ${accion} una boleta en estado "${boleta.estado}"`),
      { status: 422 }
    )
  }

  const mapaEstado = {
    revisar: "en_revision",
    aprobar: "aprobada",
    rechazar: "rechazada",
    pagar: "pagada",
  } as const

  const estadoAnterior = boleta.estado
  const estadoNuevo = mapaEstado[accion]

  boleta.estado = estadoNuevo

  if (accion === "pagar") {
    if (!comprobante) {
      throw Object.assign(new Error("Se requiere un comprobante de pago"), { status: 422 })
    }
    boleta.gestor = authUser._id as unknown as typeof boleta.gestor
    boleta.fechaPago = new Date()
    boleta.comprobante = comprobante
  } else {
    boleta.auditor = authUser._id as unknown as typeof boleta.auditor
    boleta.fechaRevision = new Date()
    if (comentario) boleta.comentarioAuditor = comentario
  }

  await boleta.save()

  await AuditLog.create({
    boleta: boleta._id,
    usuario: authUser._id,
    accion,
    estadoAnterior,
    estadoNuevo,
    comentario,
  })

  const resultado = await Boleta.findById(boleta._id)
    .populate("empleado", "nombre email avatar")
    .populate("auditor", "nombre email avatar")
    .populate("gestor", "nombre email avatar")
    .lean()
  broadcast({ type: "boleta:updated", boletaId: id })
  return resultado
}

// ─── Eliminar boleta (admin) ──────────────────────────────────────────────────

export async function eliminarBoleta(id: string, authUser: AuthUser) {
  const boleta = await Boleta.findByIdAndDelete(id)
  if (!boleta) {
    throw Object.assign(new Error("Boleta no encontrada"), { status: 404 })
  }

  await AuditLog.create({
    boleta: boleta._id,
    usuario: authUser._id,
    accion: "eliminar",
    estadoAnterior: boleta.estado,
    comentario: `Eliminada por admin: ${authUser.email}`,
  })

  broadcast({ type: "boleta:deleted", boletaId: id })
  return { mensaje: "Boleta eliminada correctamente" }
}

// ─── Estadísticas (para dashboards) ──────────────────────────────────────────

export async function estadisticas(authUser: AuthUser) {
  // Cast a ObjectId para que el $match en aggregation funcione correctamente
  const matchBase =
    authUser.rol === "empleado"
      ? { empleado: new Types.ObjectId(authUser._id) }
      : {}

  const [conteos, montosAprobado, montosPagado] = await Promise.all([
    Boleta.aggregate([
      { $match: matchBase },
      { $group: { _id: "$estado", total: { $sum: 1 } } },
    ]),
    Boleta.aggregate([
      { $match: { ...matchBase, estado: "aprobada" } },
      { $group: { _id: null, totalMonto: { $sum: "$monto" } } },
    ]),
    Boleta.aggregate([
      { $match: { ...matchBase, estado: "pagada" } },
      { $group: { _id: null, totalMonto: { $sum: "$monto" } } },
    ]),
  ])

  const stats: Record<string, number> = {
    pendiente: 0,
    en_revision: 0,
    aprobada: 0,
    rechazada: 0,
    pagada: 0,
  }
  for (const c of conteos) stats[c._id] = c.total

  return {
    ...stats,
    total: Object.values(stats).reduce((a, b) => a + b, 0),
    montoAprobado: montosAprobado[0]?.totalMonto ?? 0,
    montoPagado: montosPagado[0]?.totalMonto ?? 0,
  }
}
