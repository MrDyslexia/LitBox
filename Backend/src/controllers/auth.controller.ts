import { User } from "../models/User"
import { AuditLog } from "../models/AuditLog"
import type { JwtPayload } from "../types"

// ─── Login ────────────────────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string,
  signJwt: (payload: object) => Promise<string>,
  ip?: string
) {
  const user = await User.findOne({ email: email.toLowerCase(), activo: true })
    .select("+password")

  if (!user) {
    throw Object.assign(new Error("Credenciales inválidas"), { status: 401 })
  }

  const valid = await user.verificarPassword(password)
  if (!valid) {
    throw Object.assign(new Error("Credenciales inválidas"), { status: 401 })
  }

  // Actualizar último acceso
  user.ultimoAcceso = new Date()
  await user.save()

  // Generar token
  const payload: JwtPayload = {
    sub: String(user._id),
    email: user.email,
    rol: user.rol,
  }
  const token = await signJwt(payload)

  // Registrar en audit log
  await AuditLog.create({
    usuario: user._id,
    accion: "login",
    ip,
  })

  return {
    token,
    user: user.toPublic(),
  }
}

// ─── Me (perfil del usuario autenticado) ─────────────────────────────────────

export async function getMe(userId: string) {
  const user = await User.findById(userId).lean()
  if (!user) {
    throw Object.assign(new Error("Usuario no encontrado"), { status: 404 })
  }
  return user
}
