import mongoose, { type Document, type Model, Schema } from "mongoose"

interface ICounter extends Document<string> {
  _id: string
  seq: number
}

const counterSchema = new Schema<ICounter>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
)

export const Counter: Model<ICounter> =
  mongoose.models.Counter ?? mongoose.model<ICounter>("Counter", counterSchema)
