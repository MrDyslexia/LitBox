import { Elysia, t } from "elysia"
import { authMiddleware } from "../middleware/auth"
import type { UserRole } from "../types"
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
  t.Literal("gestor"),
  t.Literal("administrador"),
])

const tipoCuentaEnum = t.Union([
  t.Literal("corriente"),
  t.Literal("vista"),
  t.Literal("ahorro"),
])

const infoBancariaSchema = t.Object({
  banco:        t.String({ minLength: 1 }),
  tipoCuenta:   tipoCuentaEnum,
  numeroCuenta: t.String({ minLength: 1 }),
})

export const userRoutes = new Elysia({ prefix: "/users" })
  .use(authMiddleware)

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
            page:   query.page   ? Number(query.page)  : 1,
            limit:  query.limit  ? Math.min(Number(query.limit), 100) : 20,
            rol:    query.rol    as UserRole | undefined,
            activo: query.activo === undefined ? undefined : query.activo === "true",
            buscar: query.buscar,
          }),
        {
          query: t.Object({
            page:   t.Optional(t.String()),
            limit:  t.Optional(t.String()),
            rol:    t.Optional(t.String()),
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
            primerNombre:   t.String({ minLength: 1, maxLength: 50 }),
            segundoNombre:  t.Optional(t.String({ maxLength: 50 })),
            primerApellido: t.String({ minLength: 1, maxLength: 50 }),
            segundoApellido: t.Optional(t.String({ maxLength: 50 })),
            rut:    t.String({ minLength: 9 }),   // ej: 1.234.567-8
            email:  t.String({ format: "email" }),
            rol:    rolEnum,
            infoBancaria: t.Optional(infoBancariaSchema),
          }),
          detail: { summary: "Crear usuario", tags: ["Usuarios"] },
        }
      )

      // PATCH /api/users/:id
      .patch(
        "/:id",
        ({ params, body }) => actualizarUsuario(params.id, body),
        {
          body: t.Object({
            primerNombre:    t.Optional(t.String({ minLength: 1 })),
            segundoNombre:   t.Optional(t.String()),
            primerApellido:  t.Optional(t.String({ minLength: 1 })),
            segundoApellido: t.Optional(t.String()),
            rut:             t.Optional(t.String({ pattern: "^\\d{1,2}\\.\\d{3}\\.\\d{3}-[\\dkK]$" })),
            rol:             t.Optional(rolEnum),
            activo:          t.Optional(t.Boolean()),
            infoBancaria:    t.Optional(infoBancariaSchema),
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
