import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { connectDB } from "./config/database";
import { env } from "./config/env";
import { authRoutes } from "./routes/auth";
import { boletaRoutes } from "./routes/boletas";
import { userRoutes } from "./routes/users";
import { uploadRoutes } from "./routes/uploads";
import { addClient, removeClient, clientCount } from "./ws/broadcaster";

// ─── Conectar a MongoDB ───────────────────────────────────────────────────────
await connectDB();

// ─── Aplicación Elysia ────────────────────────────────────────────────────────
const app = new Elysia()

  // ── Plugins globales ──────────────────────────────────────────────────────
  .use(
    cors({
      origin: (request) => {
        const origin = request.headers.get('origin');
        
        // Si no hay origen, permitir (peticiones del mismo origen)
        if (!origin) return true;
        
        // Permitir localhost en desarrollo
        if (env.isDev && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
          return true;
        }
        
        // Verificar contra orígenes permitidos
        const allowedOrigins = Array.isArray(env.cors.origin) 
          ? env.cors.origin 
          : [env.cors.origin];
        
        const isAllowed = allowedOrigins.some(allowed => {
          // Permitir coincidencia exacta o subdominios
          if (allowed === origin) return true;
          // Permitir si el origen termina con el dominio (para subdominios)
          if (allowed.startsWith('*.') && origin.endsWith(allowed.slice(1))) return true;
          return false;
        });
        
        if (isAllowed) {
          return true;
        }
        
        console.warn(`CORS bloqueado: ${origin} no está en la lista permitida`);
        return false;
      },
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Access-Control-Allow-Private-Network", "Cookie"],
      exposeHeaders: ["Set-Cookie"],
      preflight: true,
      maxAge: 86400, // 24 horas
    })
  )
  
  // Manejar Private Network Access (para localhost en desarrollo)
  .onRequest(({ request, set }) => {
    if (request.headers.get('access-control-request-private-network') === 'true') {
      set.headers['Access-Control-Allow-Private-Network'] = 'true';
    }
  })
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
    }),
  )

  // ── Health check ──────────────────────────────────────────────────────────
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: env.nodeEnv,
  }))
  .get("/", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))
  // ── Rutas de la API ───────────────────────────────────────────────────────
  .group("/api", (app) =>
    app.use(authRoutes).use(boletaRoutes).use(userRoutes).use(uploadRoutes),
  )

  // ── WebSocket — notificaciones en tiempo real ─────────────────────────────
  .ws("/ws", {
    open(ws) {
      addClient(ws)
      console.log(`WS: cliente conectado (total: ${clientCount()})`)
    },
    close(ws) {
      removeClient(ws)
      console.log(`WS: cliente desconectado (total: ${clientCount()})`)
    },
    message() {
      // Los clientes no envían mensajes; solo reciben eventos
    },
  })

  // ── Manejo de errores global ──────────────────────────────────────────────
  .onError(({ error, set, code }) => {
    const err = error as Error & { status?: number };
    const errorMessage = err instanceof Error ? err.message : String(err);

    // Errores con status explícito (lanzados en controllers)
    if (err.status) {
      set.status = err.status;
      return { error: err.message };
    }

    // Errores de validación de Elysia
    if (code === "VALIDATION") {
      set.status = 422;
      return { error: "Datos inválidos", detalle: errorMessage };
    }

    // Error genérico
    set.status = 500;
    if (env.isDev) {
      return { error: "Error interno del servidor", detalle: errorMessage };
    }
    return { error: "Error interno del servidor" };
  })

  .listen(env.port);

console.log(`✓ LitBox Backend corriendo en http://localhost:${env.port}`);
console.log(`✓ Documentación API en http://localhost:${env.port}/docs`);

export type App = typeof app;
