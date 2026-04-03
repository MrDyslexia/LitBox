import mongoose, { type Document, type Model, Schema, Types } from "mongoose"
import type { AuditAccion } from "../types"

// ─── Interfaz del documento ───────────────────────────────────────────────────

export interface IAuditLog extends Document {
  boleta?: Types.ObjectId      // ref: Boleta (opcional, ej: login no tiene boleta)
  usuario: Types.ObjectId      // ref: User — quien realizó la acción
  accion: AuditAccion
  estadoAnterior?: string
  estadoNuevo?: string
  comentario?: string
  ip?: string
  userAgent?: string
  fecha: Date
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const auditLogSchema = new Schema<IAuditLog>(
  {
    boleta: {
      type: Schema.Types.ObjectId,
      ref: "Boleta",
    },
    usuario: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    accion: {
      type: String,
      required: true,
      enum: ["crear", "revisar", "aprobar", "rechazar", "eliminar", "actualizar", "login", "logout"],
    },
    estadoAnterior: String,
    estadoNuevo: String,
    comentario: String,
    ip: String,
    userAgent: String,
    fecha: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
)

// ─── Índices (TTL: logs se eliminan a los 90 días automáticamente) ────────────

auditLogSchema.index({ fecha: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 })
auditLogSchema.index({ boleta: 1 })
auditLogSchema.index({ usuario: 1, fecha: -1 })
auditLogSchema.index({ accion: 1 })

// ─── Modelo ───────────────────────────────────────────────────────────────────

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ?? mongoose.model<IAuditLog>("AuditLog", auditLogSchema)
