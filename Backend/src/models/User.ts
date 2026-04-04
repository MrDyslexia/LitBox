import mongoose, { type Document, type Model, Schema } from "mongoose"
import bcrypt from "bcryptjs"
import type { UserRole } from "../types"

// ─── Interfaz del documento ───────────────────────────────────────────────────

export interface IUser extends Document {
  nombre: string
  email: string
  password: string
  rol: UserRole
  activo: boolean
  avatar: string               // iniciales generadas automáticamente
  fechaCreacion: Date
  ultimoAcceso?: Date

  // Métodos de instancia
  verificarPassword(password: string): Promise<boolean>
  toPublic(): Omit<IUser, "password">
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const userSchema = new Schema<IUser>(
  {
    nombre: {
      type: String,
      required: [true, "El nombre es requerido"],
      trim: true,
      minlength: [2, "El nombre debe tener al menos 2 caracteres"],
      maxlength: [100, "El nombre no puede superar 100 caracteres"],
    },
    email: {
      type: String,
      required: [true, "El email es requerido"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email inválido"],
    },
    password: {
      type: String,
      required: [true, "La contraseña es requerida"],
      minlength: [6, "La contraseña debe tener al menos 6 caracteres"],
      select: false, // nunca se devuelve en queries por defecto
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
    ultimoAcceso: {
      type: Date,
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

// Generar avatar (iniciales) y hashear contraseña antes de guardar
userSchema.pre("save", async function (next) {
  // Generar iniciales si no existen o el nombre cambió
  if (this.isModified("nombre") || !this.avatar) {
    const partes = this.nombre.trim().split(" ").filter(Boolean)
    this.avatar =
      partes.length >= 2
        ? `${partes[0][0]}${partes[1][0]}`.toUpperCase()
        : partes[0].substring(0, 2).toUpperCase()
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
