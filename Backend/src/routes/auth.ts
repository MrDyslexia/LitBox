import { Elysia, t } from "elysia"
import { jwtPlugin, authMiddleware } from "../middleware/auth"
import {
  login,
  getMe,
  actualizarPerfil,
  solicitarCodigoCambio,
  confirmarCambioPassword,
  solicitarRecuperacion,
  recuperarPassword,
  completarPerfil,
} from "../controllers/auth.controller"

// ─── Rate limiter en memoria ──────────────────────────────────────────────────

interface RateBucket { count: number; resetAt: number }
const rateBuckets = new Map<string, RateBucket>()

function checkRateLimit(key: string, maxRequests: number, windowMs: number) {
  const now = Date.now()
  const bucket = rateBuckets.get(key)

  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs })
    return
  }

  bucket.count++
  if (bucket.count > maxRequests) {
    throw Object.assign(new Error("Demasiados intentos. Intenta más tarde."), { status: 429 })
  }
}

function getIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown"
}

const infoBancariaSchema = t.Object({
  banco:        t.String({ minLength: 1 }),
  tipoCuenta:   t.Union([t.Literal("corriente"), t.Literal("vista"), t.Literal("ahorro")]),
  numeroCuenta: t.String({ minLength: 1 }),
})

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(jwtPlugin)

  // POST /api/auth/login
  .post(
    "/login",
    async ({ body, jwt, cookie, set, request }) => {
      checkRateLimit(`login:${getIp(request)}`, 10, 15 * 60 * 1000)
      const ip = getIp(request)
      const { token, user } = await login(body.email, body.password, jwt.sign as (payload: object) => Promise<string>, ip)
      cookie.auth.set({
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      })
      set.status = 200
      return { user }
    },
    {
      body: t.Object({
        email:    t.String({ format: "email" }),
        password: t.String({ minLength: 1 }),
      }),
      detail: { summary: "Iniciar sesión", tags: ["Auth"] },
    }
  )

  // POST /api/auth/logout
  .post(
    "/logout",
    ({ cookie, set }) => {
      cookie.auth.remove()
      set.status = 200
      return { mensaje: "Sesión cerrada correctamente" }
    },
    { detail: { summary: "Cerrar sesión", tags: ["Auth"] } }
  )

  // ── Rutas públicas de recuperación (sin auth) ────────────────────────────────

  // POST /api/auth/solicitar-recuperacion
  .post(
    "/solicitar-recuperacion",
    ({ body, request }) => {
      checkRateLimit(`recuperacion:${getIp(request)}`, 5, 15 * 60 * 1000)
      return solicitarRecuperacion(body.email)
    },
    {
      body: t.Object({ email: t.String({ format: "email" }) }),
      detail: { summary: "Solicitar código de recuperación de contraseña", tags: ["Auth"] },
    }
  )

  // POST /api/auth/recuperar-password
  .post(
    "/recuperar-password",
    ({ body, request }) => {
      checkRateLimit(`recuperar:${getIp(request)}`, 10, 15 * 60 * 1000)
      return recuperarPassword(body.email, body.codigo, body.passwordNueva)
    },
    {
      body: t.Object({
        email:         t.String({ format: "email" }),
        codigo:        t.String({ minLength: 6, maxLength: 6 }),
        passwordNueva: t.String({ minLength: 8 }),
      }),
      detail: { summary: "Restablecer contraseña con código", tags: ["Auth"] },
    }
  )

  // ── Rutas protegidas ──────────────────────────────────────────────────────��──
  .use(authMiddleware)

  // GET /api/auth/me
  .get(
    "/me",
    ({ authUser }) => getMe(authUser._id),
    { detail: { summary: "Perfil del usuario autenticado", tags: ["Auth"] } }
  )

  // PATCH /api/auth/perfil — datos personales + bancaria
  .patch(
    "/perfil",
    ({ authUser, body }) => actualizarPerfil(authUser._id, body as any),
    {
      body: t.Object({
        primerNombre:    t.Optional(t.String({ minLength: 1, maxLength: 50 })),
        segundoNombre:   t.Optional(t.String({ maxLength: 50 })),
        primerApellido:  t.Optional(t.String({ minLength: 1, maxLength: 50 })),
        segundoApellido: t.Optional(t.String({ maxLength: 50 })),
        email:           t.Optional(t.String({ format: "email" })),
        infoBancaria:    t.Optional(infoBancariaSchema),
      }),
      detail: { summary: "Actualizar perfil del usuario autenticado", tags: ["Auth"] },
    }
  )

  // POST /api/auth/solicitar-cambio-password — envía código al correo
  .post(
    "/solicitar-cambio-password",
    ({ authUser }) => solicitarCodigoCambio(authUser._id),
    { detail: { summary: "Solicitar código para cambio de contraseña", tags: ["Auth"] } }
  )

  // POST /api/auth/confirmar-cambio-password — verifica código + actualiza contraseña
  .post(
    "/confirmar-cambio-password",
    ({ authUser, body }) => confirmarCambioPassword(authUser._id, body.codigo, body.passwordNueva),
    {
      body: t.Object({
        codigo:        t.String({ minLength: 6, maxLength: 6 }),
        passwordNueva: t.String({ minLength: 8 }),
      }),
      detail: { summary: "Confirmar cambio de contraseña con código", tags: ["Auth"] },
    }
  )

  // PATCH /api/auth/completar-perfil
  .patch(
    "/completar-perfil",
    ({ authUser, body }) => completarPerfil(authUser._id, body as any),
    {
      body: t.Object({
        password:     t.String({ minLength: 8 }),
        infoBancaria: t.Optional(infoBancariaSchema),
      }),
      detail: { summary: "Completar perfil en primer inicio de sesión", tags: ["Auth"] },
    }
  )
