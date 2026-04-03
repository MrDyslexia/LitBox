import mongoose from "mongoose"
import { env } from "./env"

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.mongodb.uri, {
      serverSelectionTimeoutMS: 5000,
    })
    console.log(`✓ MongoDB conectado: ${mongoose.connection.host}`)
  } catch (error) {
    console.error("✗ Error conectando a MongoDB:", error)
    process.exit(1)
  }
}

mongoose.connection.on("disconnected", () => {
  console.warn("⚠ MongoDB desconectado")
})

mongoose.connection.on("error", (err) => {
  console.error("✗ Error en MongoDB:", err)
})
