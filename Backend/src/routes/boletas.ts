import { Elysia, t } from "elysia"
import { authMiddleware } from "../middleware/auth"
import {
  listarBoletas,
  obtenerBoleta,
  crearBoleta,
  cambiarEstado,
  eliminarBoleta,
  estadisticas,
} from "../controllers/boleta.controller"

const tipoEnum = t.Union([
  t.Literal("Traslado"),
  t.Literal("Reuniones comerciales"),
  t.Literal("Insumos urgentes"),
  t.Literal("Alimentación"),
  t.Literal("Hospedaje"),
  t.Literal("Comunicaciones"),
  t.Literal("Materiales de oficina"),
  t.Literal("Otro"),
])

export const boletaRoutes = new Elysia({ prefix: "/boletas" })
  .use(authMiddleware)

  // ── Rutas accesibles para todos los roles autenticados ────────────────────

  // GET /api/boletas/stats
  .get(
    "/stats",
    ({ authUser }) => estadisticas(authUser),
    { detail: { summary: "Estadísticas de boletas", tags: ["Boletas"] } }
  )

  // GET /api/boletas
  .get(
    "/",
    ({ query, authUser }) =>
      listarBoletas(
        {
          page: query.page ? Number(query.page) : 1,
          limit: query.limit ? Number(query.limit) : 20,
          estado: query.estado as any,
          tipo: query.tipo as any,
          empleadoId: query.empleadoId,
          desde: query.desde,
          hasta: query.hasta,
          buscar: query.buscar,
        },
        authUser
      ),
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        estado: t.Optional(t.String()),
        tipo: t.Optional(t.String()),
        empleadoId: t.Optional(t.String()),
        desde: t.Optional(t.String()),
        hasta: t.Optional(t.String()),
        buscar: t.Optional(t.String()),
      }),
      detail: { summary: "Listar boletas", tags: ["Boletas"] },
    }
  )

  // GET /api/boletas/:id
  .get(
    "/:id",
    ({ params, authUser }) => obtenerBoleta(params.id, authUser),
    { detail: { summary: "Obtener boleta por ID", tags: ["Boletas"] } }
  )

  // ── Solo empleados y administradores pueden CREAR ─────────────────────────

  .guard({}, (app) =>
    app
      .onBeforeHandle(({ authUser, set }) => {
        if (!["empleado", "administrador"].includes(authUser.rol)) {
          set.status = 403
          throw new Error("Acceso denegado: se requiere rol empleado o administrador")
        }
      })
      .post(
        "/",
        ({ body, authUser }) => crearBoleta(body as any, authUser),
        {
          body: t.Object({
            tipo: tipoEnum,
            monto: t.Number({ minimum: 1 }),
            fecha: t.String(),
            descripcion: t.String({ minLength: 10, maxLength: 1000 }),
            imagen: t.Optional(
              t.Object({
                url: t.String(),
                nombre: t.String(),
                tipo: t.String(),
                tamano: t.Number(),
              })
            ),
          }),
          detail: { summary: "Crear nueva boleta", tags: ["Boletas"] },
        }
      )
  )

  // ── Solo auditores y administradores pueden REVISAR / APROBAR / RECHAZAR ──

  .guard({}, (app) =>
    app
      .onBeforeHandle(({ authUser, set }) => {
        if (!["auditor", "administrador"].includes(authUser.rol)) {
          set.status = 403
          throw new Error("Acceso denegado: se requiere rol auditor o administrador")
        }
      })
      .patch(
        "/:id/revisar",
        ({ params, body, authUser }) =>
          cambiarEstado(params.id, "revisar", body.comentario, authUser),
        {
          body: t.Object({ comentario: t.Optional(t.String()) }),
          detail: { summary: "Marcar boleta en revisión", tags: ["Boletas"] },
        }
      )
      .patch(
        "/:id/aprobar",
        ({ params, body, authUser }) =>
          cambiarEstado(params.id, "aprobar", body.comentario, authUser),
        {
          body: t.Object({ comentario: t.Optional(t.String()) }),
          detail: { summary: "Aprobar boleta", tags: ["Boletas"] },
        }
      )
      .patch(
        "/:id/rechazar",
        ({ params, body, authUser }) =>
          cambiarEstado(params.id, "rechazar", body.comentario, authUser),
        {
          body: t.Object({ comentario: t.Optional(t.String()) }),
          detail: { summary: "Rechazar boleta", tags: ["Boletas"] },
        }
      )
  )

  // ── Solo gestores y administradores pueden PAGAR ──────────────────────────

  .guard({}, (app) =>
    app
      .onBeforeHandle(({ authUser, set }) => {
        if (!["gestor", "administrador"].includes(authUser.rol)) {
          set.status = 403
          throw new Error("Acceso denegado: se requiere rol gestor o administrador")
        }
      })
      .patch(
        "/:id/pagar",
        ({ params, body, authUser }) =>
          cambiarEstado(params.id, "pagar", undefined, authUser, body.comprobante),
        {
          body: t.Object({
            comprobante: t.Object({
              url: t.String(),
              nombre: t.String(),
              tipo: t.String(),
              tamano: t.Number(),
            }),
          }),
          detail: { summary: "Marcar boleta como pagada", tags: ["Boletas"] },
        }
      )
  )

  // ── Solo administradores pueden ELIMINAR ──────────────────────────────────

  .guard({}, (app) =>
    app
      .onBeforeHandle(({ authUser, set }) => {
        if (authUser.rol !== "administrador") {
          set.status = 403
          throw new Error("Acceso denegado: se requiere rol administrador")
        }
      })
      .delete(
        "/:id",
        ({ params, authUser }) => eliminarBoleta(params.id, authUser),
        { detail: { summary: "Eliminar boleta", tags: ["Boletas"] } }
      )
  )
