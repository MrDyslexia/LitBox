import { Elysia, t } from "elysia"
import { authMiddleware } from "../middleware/auth"
import { User } from "../models/User"

export const configRoutes = new Elysia({ prefix: "/config" })
  .use(authMiddleware)

  .guard({}, (app) =>
    app
      .onBeforeHandle(({ authUser, set }) => {
        if (authUser.rol !== "administrador") {
          set.status = 403
          throw new Error("Acceso denegado: se requiere rol administrador")
        }
      })

      // GET /api/config/notificaciones — devuelve la config del admin autenticado
      .get(
        "/notificaciones",
        async ({ authUser }) => {
          const user = await User.findById(authUser._id).lean()
          if (!user) throw Object.assign(new Error("Usuario no encontrado"), { status: 404 })

          const notif = (user as any).notificaciones ?? {
            creacion: true,
            aprobacion: true,
            rechazo: true,
            atraso: true,
          }
          return notif
        },
        { detail: { summary: "Obtener configuración de notificaciones", tags: ["Config"] } }
      )

      // PATCH /api/config/notificaciones — actualiza la config del admin autenticado
      .patch(
        "/notificaciones",
        async ({ authUser, body }) => {
          await User.findByIdAndUpdate(authUser._id, { notificaciones: body })
          return { mensaje: "Configuración actualizada" }
        },
        {
          body: t.Object({
            creacion: t.Boolean(),
            aprobacion: t.Boolean(),
            rechazo: t.Boolean(),
            atraso: t.Boolean(),
          }),
          detail: { summary: "Actualizar configuración de notificaciones", tags: ["Config"] },
        }
      )
  )
