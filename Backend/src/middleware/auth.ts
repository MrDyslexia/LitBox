import { Elysia } from "elysia"
import { jwt } from "@elysiajs/jwt"
import { env } from "../config/env"
import { User } from "../models/User"
import type { JwtPayload, AuthUser } from "../types"

// ─── Plugin de JWT ────────────────────────────────────────────────────────────

export const jwtPlugin = new Elysia({ name: "jwt" }).use(
  jwt({
    name: "jwt",
    secret: env.jwt.secret,
    exp: env.jwt.expiresIn as string,
  })
)

// ─── Middleware de autenticación ──────────────────────────────────────────────

export const authMiddleware = new Elysia({ name: "auth" })
  .use(jwtPlugin)
  .derive({ as: "scoped" }, async ({ jwt, cookie, set }) => {
    const token = cookie.auth?.value

    if (!token) {
      set.status = 401
      throw new Error("No autenticado: token no encontrado")
    }

    const payload = await jwt.verify(token as string) as JwtPayload | false

    if (!payload) {
      set.status = 401
      throw new Error("No autenticado: token inválido o expirado")
    }

    const user = await User.findById(payload.sub).select("-password").lean()

    if (!user?.activo) {
      set.status = 401
      throw new Error("No autenticado: usuario inactivo o no encontrado")
    }

    return {
      authUser: {
        _id: String(user._id),
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      } satisfies AuthUser,
    }
  })

// ─── Guard por rol ────────────────────────────────────────────────────────────

export const requireRole = (...roles: AuthUser["rol"][]) =>
  new Elysia({ name: `require-role:${roles.join(",")}` })
    .use(authMiddleware)
    .onBeforeHandle({ as: "scoped" }, ({ authUser, set }) => {
      if (!authUser) {
        set.status = 401
        throw new Error("No autenticado: se requiere autenticación")
      }
      if (!roles.includes(authUser.rol)) {
        set.status = 403
        throw new Error(`Acceso denegado: se requiere rol ${roles.join(" o ")}`)
      }
    })
