import { User } from "../models/User"
import { AuditLog } from "../models/AuditLog"
import { sendMail } from "../services/email.service"
import { tmplCodigoVerificacion } from "../templates/emails"
import type { JwtPayload } from "../types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generarCodigo(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function expiresIn15(): Date {
  return new Date(Date.now() + 15 * 60 * 1000)
}

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

  user.ultimoAcceso = new Date()
  await user.save()

  const payload: JwtPayload = { sub: String(user._id), email: user.email, rol: user.rol }
  const token = await signJwt(payload)

  await AuditLog.create({ usuario: user._id, accion: "login", ip })

  return { token, user: user.toPublic() }
}

// ─── Me ───────────────────────────────────────────────────────────────────────

export async function getMe(userId: string) {
  const user = await User.findById(userId).lean()
  if (!user) throw Object.assign(new Error("Usuario no encontrado"), { status: 404 })
  return user
}

// ─── Actualizar perfil (datos personales + bancaria, SIN contraseña) ──────────

export async function actualizarPerfil(
  userId: string,
  data: {
    primerNombre?: string
    segundoNombre?: string
    primerApellido?: string
    segundoApellido?: string
    email?: string
    infoBancaria?: { banco: string; tipoCuenta: "corriente" | "vista" | "ahorro"; numeroCuenta: string }
  }
) {
  const user = await User.findById(userId)
  if (!user) throw Object.assign(new Error("Usuario no encontrado"), { status: 404 })

  if (data.email && data.email.toLowerCase() !== user.email) {
    const existe = await User.findOne({ email: data.email.toLowerCase(), _id: { $ne: userId } })
    if (existe) throw Object.assign(new Error("Ese correo ya está en uso por otro usuario"), { status: 409 })
    user.email = data.email.toLowerCase()
  }

  if (data.primerNombre)               user.primerNombre    = data.primerNombre
  if (data.segundoNombre  !== undefined) user.segundoNombre  = data.segundoNombre
  if (data.primerApellido)              user.primerApellido  = data.primerApellido
  if (data.segundoApellido !== undefined) user.segundoApellido = data.segundoApellido
  if (data.infoBancaria)               user.infoBancaria    = data.infoBancaria

  await user.save()
  return user.toPublic()
}

// ─── Solicitar código (usuario autenticado — cambio de contraseña) ────────────

export async function solicitarCodigoCambio(userId: string) {
  const user = await User.findById(userId)
  if (!user) throw Object.assign(new Error("Usuario no encontrado"), { status: 404 })

  const codigo = generarCodigo()
  user.codigoReset = codigo
  user.codigoResetExpira = expiresIn15()
  await user.save()

  await sendMail({
    to: user.email,
    subject: "[LitBox] Código de verificación — cambio de contraseña",
    html: tmplCodigoVerificacion({ nombre: user.nombre, codigo, motivo: "cambio_password" }),
  })

  return { mensaje: `Código enviado a ${user.email}` }
}

// ─── Confirmar cambio de contraseña (usuario autenticado) ─────────────────────

export async function confirmarCambioPassword(userId: string, codigo: string, passwordNueva: string) {
  const user = await User.findById(userId).select("+password")
  if (!user) throw Object.assign(new Error("Usuario no encontrado"), { status: 404 })

  if (
    !user.codigoReset ||
    user.codigoReset !== codigo ||
    !user.codigoResetExpira ||
    user.codigoResetExpira < new Date()
  ) {
    throw Object.assign(new Error("Código inválido o expirado"), { status: 422 })
  }

  user.password = passwordNueva
  user.codigoReset = undefined
  user.codigoResetExpira = undefined
  await user.save()

  return { mensaje: "Contraseña actualizada correctamente" }
}

// ─── Solicitar recuperación de contraseña (público) ───────────────────────────

export async function solicitarRecuperacion(email: string) {
  const user = await User.findOne({ email: email.toLowerCase(), activo: true })
  // Respuesta genérica para no revelar si el email existe
  if (!user) return { mensaje: "Si el correo existe, recibirás un código en breve." }

  const codigo = generarCodigo()
  user.codigoReset = codigo
  user.codigoResetExpira = expiresIn15()
  await user.save()

  await sendMail({
    to: user.email,
    subject: "[LitBox] Código de recuperación de contraseña",
    html: tmplCodigoVerificacion({ nombre: user.nombre, codigo, motivo: "recuperacion" }),
  })

  return { mensaje: "Si el correo existe, recibirás un código en breve." }
}

// ─── Recuperar contraseña con código (público) ────────────────────────────────

export async function recuperarPassword(email: string, codigo: string, passwordNueva: string) {
  const user = await User.findOne({ email: email.toLowerCase(), activo: true }).select("+password")
  if (!user) throw Object.assign(new Error("Código inválido o expirado"), { status: 422 })

  if (
    !user.codigoReset ||
    user.codigoReset !== codigo ||
    !user.codigoResetExpira ||
    user.codigoResetExpira < new Date()
  ) {
    throw Object.assign(new Error("Código inválido o expirado"), { status: 422 })
  }

  user.password = passwordNueva
  user.codigoReset = undefined
  user.codigoResetExpira = undefined
  await user.save()

  return { mensaje: "Contraseña restablecida correctamente" }
}

// ─── Completar perfil (primer inicio de sesión) ───────────────────────────────

export async function completarPerfil(
  userId: string,
  data: {
    password: string
    infoBancaria?: { banco: string; tipoCuenta: "corriente" | "vista" | "ahorro"; numeroCuenta: string }
  }
) {
  const user = await User.findById(userId).select("+password")
  if (!user) throw Object.assign(new Error("Usuario no encontrado"), { status: 404 })

  user.password = data.password
  user.esNuevo = false
  if (data.infoBancaria) user.infoBancaria = data.infoBancaria

  await user.save()
  return user.toPublic()
}
