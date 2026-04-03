import { Elysia } from "elysia"
import { cors } from "@elysiajs/cors"
import { swagger } from "@elysiajs/swagger"
import { connectDB } from "./config/database"
import { env } from "./config/env"
import { authRoutes } from "./routes/auth"
import { boletaRoutes } from "./routes/boletas"
import { userRoutes } from "./routes/users"
import { uploadRoutes } from "./routes/uploads"

// ─── Conectar a MongoDB ───────────────────────────────────────────────────────
await connectDB()

// ─── Aplicación Elysia ────────────────────────────────────────────────────────
const app = new Elysia()

  // ── Plugins globales ──────────────────────────────────────────────────────
  .use(
    cors({
      origin: env.cors.origin,
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )
  .use(
    swagger({
      path: "/docs",
      documentation: {
        info: {
          title: "LitBox API",
          description: "API para gestión de boletas y solicitudes de reembolso",
          version: "0.1.0",
        },
        tags: [
          { name: "Auth", description: "Autenticación" },
          { name: "Boletas", description: "Gestión de boletas/comprobantes" },
          { name: "Usuarios", description: "Gestión de usuarios (admin)" },
          { name: "Uploads", description: "Carga de archivos" },
        ],
      },
    })
  )

  // ── Health check ──────────────────────────────────────────────────────────
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: env.nodeEnv,
  }))

  // ── Rutas de la API ───────────────────────────────────────────────────────
  .group("/api", (app) =>
    app
      .use(authRoutes)
      .use(boletaRoutes)
      .use(userRoutes)
      .use(uploadRoutes)
  )

  // ── Manejo de errores global ──────────────────────────────────────────────
  .onError(({ error, set, code }) => {
    const err = error as Error & { status?: number }
    const errorMessage = err instanceof Error ? err.message : String(err)

    // Errores con status explícito (lanzados en controllers)
    if (err.status) {
      set.status = err.status
      return { error: err.message }
    }

    // Errores de validación de Elysia
    if (code === "VALIDATION") {
      set.status = 422
      return { error: "Datos inválidos", detalle: errorMessage }
    }

    // Error genérico
    set.status = 500
    if (env.isDev) {
      return { error: "Error interno del servidor", detalle: errorMessage }
    }
    return { error: "Error interno del servidor" }
  })

  .listen(env.port)

console.log(`✓ LitBox Backend corriendo en http://localhost:${env.port}`)
console.log(`✓ Documentación API en http://localhost:${env.port}/docs`)

export type App = typeof app
