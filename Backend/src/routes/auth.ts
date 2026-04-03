import { Elysia, t } from "elysia"
import { jwtPlugin, authMiddleware } from "../middleware/auth"
import { login, getMe } from "../controllers/auth.controller"

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(jwtPlugin)

  // POST /api/auth/login
  .post(
    "/login",
    async ({ body, jwt, cookie, set, request }) => {
      const ip = request.headers.get("x-forwarded-for") ?? undefined

      const { token, user } = await login(body.email, body.password, jwt.sign, ip)

      // Setear cookie httpOnly
      cookie.auth.set({
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: "/",
      })

      set.status = 200
      return { token, user }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6 }),
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

  // GET /api/auth/me
  .use(authMiddleware)
  .get(
    "/me",
    async ({ authUser }) => getMe(authUser._id),
    { detail: { summary: "Perfil del usuario autenticado", tags: ["Auth"] } }
  )
