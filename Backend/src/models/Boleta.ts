import mongoose, { type Document, type Model, Schema, Types } from "mongoose"
import type { BoletaEstado, BoletaTipo } from "../types"

// ─── Interfaz del documento ───────────────────────────────────────────────────

export interface IBoleta extends Document {
  codigo: string               // BOL-001, generado automáticamente
  tipo: BoletaTipo
  monto: number                // en CLP (pesos chilenos)
  fecha: Date                  // fecha del gasto
  descripcion: string
  estado: BoletaEstado
  empleado: Types.ObjectId     // ref: User
  auditor?: Types.ObjectId     // ref: User — quien revisó
  gestor?: Types.ObjectId      // ref: User — quien pagó
  comentarioAuditor?: string
  fechaRevision?: Date
  fechaPago?: Date
  imagen?: {
    url: string
    nombre: string
    tipo: string               // MIME type
    tamano: number             // bytes
  }
  comprobante?: {
    url: string
    nombre: string
    tipo: string               // MIME type
    tamano: number             // bytes
  }
  fechaCreacion: Date
  fechaActualizacion: Date
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const boletaSchema = new Schema<IBoleta>(
  {
    codigo: {
      type: String,
      unique: true,
      // Se genera automáticamente en el hook pre-save
    },
    tipo: {
      type: String,
      required: [true, "El tipo de boleta es requerido"],
      enum: [
        "Traslado",
        "Reuniones comerciales",
        "Insumos urgentes",
        "Alimentación",
        "Hospedaje",
        "Comunicaciones",
        "Materiales de oficina",
        "Otro",
      ],
    },
    monto: {
      type: Number,
      required: [true, "El monto es requerido"],
      min: [1, "El monto debe ser mayor a 0"],
    },
    fecha: {
      type: Date,
      required: [true, "La fecha del gasto es requerida"],
    },
    descripcion: {
      type: String,
      required: [true, "La descripción es requerida"],
      trim: true,
      minlength: [10, "La descripción debe tener al menos 10 caracteres"],
      maxlength: [1000, "La descripción no puede superar 1000 caracteres"],
    },
    estado: {
      type: String,
      enum: ["pendiente", "en_revision", "aprobada", "rechazada", "pagada"],
      default: "pendiente",
    },
    empleado: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El empleado es requerido"],
    },
    auditor: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    gestor: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    comentarioAuditor: {
      type: String,
      trim: true,
      maxlength: [500, "El comentario no puede superar 500 caracteres"],
    },
    fechaRevision: {
      type: Date,
    },
    fechaPago: {
      type: Date,
    },
    imagen: {
      url: String,
      nombre: String,
      tipo: String,
      tamano: Number,
    },
    comprobante: {
      url: String,
      nombre: String,
      tipo: String,
      tamano: Number,
    },
  },
  {
    timestamps: { createdAt: "fechaCreacion", updatedAt: "fechaActualizacion" },
    versionKey: false,
  }
)

// ─── Índices ──────────────────────────────────────────────────────────────────

boletaSchema.index({ empleado: 1, estado: 1 })
boletaSchema.index({ estado: 1, fechaCreacion: -1 })
boletaSchema.index({ tipo: 1 })

// ─── Generador de código secuencial ──────────────────────────────────────────

boletaSchema.pre("save", async function (next) {
  if (this.isNew && !this.codigo) {
    const ultima = await Boleta.findOne({}, { codigo: 1 })
      .sort({ fechaCreacion: -1 })
      .lean()

    let siguiente = 1
    if (ultima?.codigo) {
      const num = Number.parseInt(ultima.codigo.replace("BOL-", ""), 10)
      if (!Number.isNaN(num)) siguiente = num + 1
    }

    this.codigo = `BOL-${String(siguiente).padStart(3, "0")}`
  }
  next()
})

// ─── Modelo ───────────────────────────────────────────────────────────────────

export const Boleta: Model<IBoleta> =
  mongoose.models.Boleta ?? mongoose.model<IBoleta>("Boleta", boletaSchema)
