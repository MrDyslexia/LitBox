import mongoose, { type Document, type Model, Schema } from "mongoose"
import bcrypt from "bcryptjs"
import type { UserRole } from "../types"

// ─── Interfaz del documento ───────────────────────────────────────────────────

export interface IUser extends Document {
  primerNombre: string
  segundoNombre?: string
  primerApellido: string
  segundoApellido?: string
  nombre: string                // campo computado: se construye desde los anteriores
  rut: string
  email: string
  password: string
  rol: UserRole
  activo: boolean
  avatar: string
  infoBancaria?: {
    banco: string
    tipoCuenta: "corriente" | "vista" | "ahorro"
    numeroCuenta: string
  }
  esNuevo: boolean              // true = usuario recién creado con contraseña por defecto
  codigoReset?: string          // código numérico de 6 dígitos (plain, caduca rápido)
  codigoResetExpira?: Date
  fechaCreacion: Date
  fechaActualizacion?: Date
  ultimoAcceso?: Date
  notificaciones?: {
    creacion: boolean
    aprobacion: boolean
    rechazo: boolean
    atraso: boolean
  }

  verificarPassword(password: string): Promise<boolean>
  toPublic(): Omit<IUser, "password">
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const userSchema = new Schema<IUser>(
  {
    primerNombre: {
      type: String,
      required: [true, "El primer nombre es requerido"],
      trim: true,
      maxlength: [50, "El primer nombre no puede superar 50 caracteres"],
    },
    segundoNombre: {
      type: String,
      trim: true,
      maxlength: [50, "El segundo nombre no puede superar 50 caracteres"],
    },
    primerApellido: {
      type: String,
      required: [true, "El primer apellido es requerido"],
      trim: true,
      maxlength: [50, "El primer apellido no puede superar 50 caracteres"],
    },
    segundoApellido: {
      type: String,
      trim: true,
      maxlength: [50, "El segundo apellido no puede superar 50 caracteres"],
    },
    nombre: {
      type: String,
      trim: true,
    },
    rut: {
      type: String,
      required: [true, "El RUT es requerido"],
      unique: true,
      trim: true,
      match: [/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/, "Formato de RUT inválido (ej: 12.345.678-9)"],
    },
    email: {
      type: String,
      required: [true, "El email es requerido"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/, "Email inválido"],
    },
    password: {
      type: String,
      required: [true, "La contraseña es requerida"],
      minlength: [6, "La contraseña debe tener al menos 6 caracteres"],
      select: false,
    },
    rol: {
      type: String,
      enum: ["empleado", "auditor", "gestor", "administrador"],
      default: "empleado",
    },
    activo: {
      type: Boolean,
      default: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    infoBancaria: {
      banco:        { type: String, trim: true },
      tipoCuenta:   { type: String, enum: ["corriente", "vista", "ahorro"] },
      numeroCuenta: { type: String, trim: true },
    },
    esNuevo: {
      type: Boolean,
      default: false,
    },
    codigoReset:       { type: String },
    codigoResetExpira: { type: Date },
    ultimoAcceso: {
      type: Date,
    },
    notificaciones: {
      creacion:   { type: Boolean, default: true },
      aprobacion: { type: Boolean, default: true },
      rechazo:    { type: Boolean, default: true },
      atraso:     { type: Boolean, default: true },
    },
  },
  {
    timestamps: { createdAt: "fechaCreacion", updatedAt: "fechaActualizacion" },
    versionKey: false,
  }
)

// ─── Índices ──────────────────────────────────────────────────────────────────

userSchema.index({ rol: 1, activo: 1 })

// ─── Hooks ────────────────────────────────────────────────────────────────────

userSchema.pre("save", async function (next) {
  // Computar nombre completo desde partes
  if (
    this.isModified("primerNombre") ||
    this.isModified("segundoNombre") ||
    this.isModified("primerApellido") ||
    this.isModified("segundoApellido") ||
    !this.nombre
  ) {
    const partes = [
      this.primerNombre,
      this.segundoNombre,
      this.primerApellido,
      this.segundoApellido,
    ].filter(Boolean)
    this.nombre = partes.join(" ")
  }

  // Generar avatar (iniciales: primera letra del primer nombre + primera letra del primer apellido)
  if (this.isModified("nombre") || !this.avatar) {
    this.avatar = `${this.primerNombre[0]}${this.primerApellido[0]}`.toUpperCase()
  }

  // Hashear contraseña solo si fue modificada
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12)
  }

  next()
})

// ─── Métodos de instancia ─────────────────────────────────────────────────────

userSchema.methods.verificarPassword = async function (
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.password)
}

userSchema.methods.toPublic = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

// ─── Modelo ───────────────────────────────────────────────────────────────────

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", userSchema)
