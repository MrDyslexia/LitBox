import mongoose, { type Document, type Model, Schema } from "mongoose"

export interface ITipoGasto extends Document {
  nombre: string
  icono: string       // Lucide React icon name, e.g. "Car", "Utensils"
  activo: boolean
  orden: number
  fechaCreacion: Date
}

const tipoGastoSchema = new Schema<ITipoGasto>(
  {
    nombre: {
      type: String,
      required: [true, "El nombre del tipo es requerido"],
      unique: true,
      trim: true,
      maxlength: [60, "El nombre no puede superar 60 caracteres"],
    },
    icono: {
      type: String,
      required: [true, "El ícono es requerido"],
      default: "FileText",
      trim: true,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    orden: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: "fechaCreacion", updatedAt: false },
    versionKey: false,
  }
)

tipoGastoSchema.index({ activo: 1, orden: 1 })

export const TipoGasto: Model<ITipoGasto> =
  mongoose.models.TipoGasto ?? mongoose.model<ITipoGasto>("TipoGasto", tipoGastoSchema)
