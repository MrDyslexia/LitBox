import { Elysia, t } from "elysia"
import { authMiddleware } from "../middleware/auth"
import {
  listarUsuarios,
  obtenerUsuario,
  crearUsuario,
  actualizarUsuario,
  toggleEstado,
  eliminarUsuario,
} from "../controllers/user.controller"

const rolEnum = t.Union([
  t.Literal("empleado"),
  t.Literal("auditor"),
  t.Literal("administrador"),
])

export const userRoutes = new Elysia({ prefix: "/users" })
  .use(authMiddleware)

  // Todas las rutas de usuario requieren ser administrador (guard scoped)
  .guard({}, (app) =>
    app
      .onBeforeHandle(({ authUser, set }) => {
        if (authUser.rol !== "administrador") {
          set.status = 403
          throw new Error("Acceso denegado: se requiere rol administrador")
        }
      })

      // GET /api/users
      .get(
        "/",
        ({ query }) =>
          listarUsuarios({
            page: query.page ? Number(query.page) : 1,
            limit: query.limit ? Number(query.limit) : 20,
            rol: query.rol as any,
            activo: query.activo === undefined ? undefined : query.activo === "true",
            buscar: query.buscar,
          }),
        {
          query: t.Object({
            page: t.Optional(t.String()),
            limit: t.Optional(t.String()),
            rol: t.Optional(t.String()),
            activo: t.Optional(t.String()),
            buscar: t.Optional(t.String()),
          }),
          detail: { summary: "Listar usuarios", tags: ["Usuarios"] },
        }
      )

      // GET /api/users/:id
      .get(
        "/:id",
        ({ params }) => obtenerUsuario(params.id),
        { detail: { summary: "Obtener usuario por ID", tags: ["Usuarios"] } }
      )

      // POST /api/users
      .post(
        "/",
        ({ body }) => crearUsuario(body),
        {
          body: t.Object({
            nombre: t.String({ minLength: 2, maxLength: 100 }),
            email: t.String({ format: "email" }),
            password: t.String({ minLength: 6 }),
            rol: rolEnum,
          }),
          detail: { summary: "Crear usuario", tags: ["Usuarios"] },
        }
      )

      // PATCH /api/users/:id
      .patch(
        "/:id",
        ({ params, body }) => actualizarUsuario(params.id, body as any),
        {
          body: t.Object({
            nombre: t.Optional(t.String({ minLength: 2 })),
            rol: t.Optional(rolEnum),
            activo: t.Optional(t.Boolean()),
            password: t.Optional(t.String({ minLength: 6 })),
          }),
          detail: { summary: "Actualizar usuario", tags: ["Usuarios"] },
        }
      )

      // PATCH /api/users/:id/toggle-status
      .patch(
        "/:id/toggle-status",
        ({ params }) => toggleEstado(params.id),
        { detail: { summary: "Activar/desactivar usuario", tags: ["Usuarios"] } }
      )

      // DELETE /api/users/:id
      .delete(
        "/:id",
        ({ params }) => eliminarUsuario(params.id),
        { detail: { summary: "Eliminar usuario", tags: ["Usuarios"] } }
      )
  )
