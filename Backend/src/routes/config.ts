import { Elysia, t } from "elysia"
import { authMiddleware } from "../middleware/auth"
import { User } from "../models/User"
import { TipoGasto } from "../models/TipoGasto"
import { actualizarAvatar } from "../controllers/auth.controller"
import sharp from "sharp"
import { env } from "../config/env"
import { mkdir } from "node:fs/promises"
import { join, resolve } from "node:path"

const UPLOAD_DIR = resolve(env.uploads.dir)
await mkdir(UPLOAD_DIR, { recursive: true })

// Tipos iniciales (se crean si la colección está vacía)
const TIPOS_INICIALES = [
  { nombre: "Traslado",               icono: "Car",           orden: 1 },
  { nombre: "Reuniones comerciales",  icono: "Handshake",     orden: 2 },
  { nombre: "Insumos urgentes",       icono: "Package",       orden: 3 },
  { nombre: "Alimentación",           icono: "Utensils",      orden: 4 },
  { nombre: "Hospedaje",              icono: "Hotel",         orden: 5 },
  { nombre: "Comunicaciones",         icono: "Phone",         orden: 6 },
  { nombre: "Materiales de oficina",  icono: "Paperclip",     orden: 7 },
  { nombre: "Otro",                   icono: "HelpCircle",    orden: 8 },
]

async function seedTiposIfEmpty() {
  const count = await TipoGasto.countDocuments()
  if (count === 0) {
    await TipoGasto.insertMany(TIPOS_INICIALES)
  }
}

// Ejecutar seed al arrancar
await seedTiposIfEmpty()

export const configRoutes = new Elysia({ prefix: "/config" })
  .use(authMiddleware)

  // ── Tipos de gasto — lectura pública (cualquier usuario autenticado) ──────────

  // GET /api/config/tipos-gasto
  .get(
    "/tipos-gasto",
    async () => {
      const tipos = await TipoGasto.find().sort({ orden: 1, nombre: 1 }).lean()
      return tipos
    },
    { detail: { summary: "Listar tipos de gasto", tags: ["Config"] } }
  )

  // ── Notificaciones (solo admin) ──────────────────────────────────────────────

  .guard({}, (app) =>
    app
      .onBeforeHandle(({ authUser, set }) => {
        if (authUser.rol !== "administrador") {
          set.status = 403
          throw new Error("Acceso denegado: se requiere rol administrador")
        }
      })

      .get(
        "/notificaciones",
        async ({ authUser }) => {
          const user = await User.findById(authUser._id).lean()
          if (!user) throw Object.assign(new Error("Usuario no encontrado"), { status: 404 })
          return (user as any).notificaciones ?? {
            creacion: true, aprobacion: true, rechazo: true, atraso: true,
          }
        },
        { detail: { summary: "Obtener configuración de notificaciones", tags: ["Config"] } }
      )

      .patch(
        "/notificaciones",
        async ({ authUser, body }) => {
          await User.findByIdAndUpdate(authUser._id, { notificaciones: body })
          return { mensaje: "Configuración actualizada" }
        },
        {
          body: t.Object({
            creacion: t.Boolean(), aprobacion: t.Boolean(),
            rechazo: t.Boolean(), atraso: t.Boolean(),
          }),
          detail: { summary: "Actualizar configuración de notificaciones", tags: ["Config"] },
        }
      )
  )

  // ── Tipos de gasto CRUD (admin o gestor) ─────────────────────────────────────

  .guard({}, (app) =>
    app
      .onBeforeHandle(({ authUser, set }) => {
        if (authUser.rol !== "administrador" && authUser.rol !== "gestor") {
          set.status = 403
          throw new Error("Acceso denegado: se requiere rol administrador o gestor")
        }
      })

      // POST /api/config/tipos-gasto
      .post(
        "/tipos-gasto",
        async ({ body, set }) => {
          const existe = await TipoGasto.findOne({ nombre: body.nombre.trim() })
          if (existe) throw Object.assign(new Error("Ya existe un tipo con ese nombre"), { status: 409 })
          const maxOrden = await TipoGasto.findOne().sort({ orden: -1 }).lean()
          const orden = maxOrden ? (maxOrden as any).orden + 1 : 1
          const tipo = await TipoGasto.create({ nombre: body.nombre.trim(), icono: body.icono, activo: true, orden })
          set.status = 201
          return tipo
        },
        {
          body: t.Object({
            nombre: t.String({ minLength: 1, maxLength: 60 }),
            icono:  t.String({ minLength: 1 }),
          }),
          detail: { summary: "Crear tipo de gasto", tags: ["Config"] },
        }
      )

      // PATCH /api/config/tipos-gasto/:id
      .patch(
        "/tipos-gasto/:id",
        async ({ params, body }) => {
          const tipo = await TipoGasto.findById(params.id)
          if (!tipo) throw Object.assign(new Error("Tipo no encontrado"), { status: 404 })
          if (body.nombre !== undefined) {
            const existe = await TipoGasto.findOne({ nombre: body.nombre.trim(), _id: { $ne: params.id } })
            if (existe) throw Object.assign(new Error("Ya existe un tipo con ese nombre"), { status: 409 })
            tipo.nombre = body.nombre.trim()
          }
          if (body.icono  !== undefined) tipo.icono  = body.icono
          if (body.activo !== undefined) tipo.activo = body.activo
          if (body.orden  !== undefined) tipo.orden  = body.orden
          await tipo.save()
          return tipo
        },
        {
          body: t.Object({
            nombre: t.Optional(t.String({ minLength: 1, maxLength: 60 })),
            icono:  t.Optional(t.String({ minLength: 1 })),
            activo: t.Optional(t.Boolean()),
            orden:  t.Optional(t.Number()),
          }),
          detail: { summary: "Actualizar tipo de gasto", tags: ["Config"] },
        }
      )

      // DELETE /api/config/tipos-gasto/:id
      .delete(
        "/tipos-gasto/:id",
        async ({ params, set }) => {
          const tipo = await TipoGasto.findById(params.id)
          if (!tipo) throw Object.assign(new Error("Tipo no encontrado"), { status: 404 })
          await tipo.deleteOne()
          set.status = 204
        },
        { detail: { summary: "Eliminar tipo de gasto", tags: ["Config"] } }
      )

      // POST /api/config/avatar — subir foto de perfil (cualquier rol autenticado lo puede usar
      // pero está en este guard solo para reutilizar el patrón; lo moveremos afuera)
  )

  // ── Avatar — cualquier usuario autenticado puede actualizar su foto ───────────

  // POST /api/config/avatar
  .post(
    "/avatar",
    async ({ authUser, body, set }) => {
      const file = body.file
      const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

      if (!IMAGE_TYPES.has(file.type)) {
        set.status = 400
        throw new Error("Solo se permiten imágenes JPG, PNG o WebP")
      }
      if (file.size > 5 * 1024 * 1024) {
        set.status = 400
        throw new Error("La imagen no puede superar 5 MB")
      }

      const rawBuffer = await file.arrayBuffer()
      const comprimido = await sharp(Buffer.from(rawBuffer))
        .rotate()
        .resize({ width: 400, height: 400, fit: "cover" })
        .webp({ quality: 85 })
        .toBuffer()

      const nombreArchivo = `avatar_${authUser._id}_${Date.now()}.webp`
      const rutaCompleta = join(UPLOAD_DIR, nombreArchivo)
      await Bun.write(rutaCompleta, comprimido)

      const avatarUrl = `/api/uploads/${nombreArchivo}`
      const user = await actualizarAvatar(authUser._id, avatarUrl)
      return { avatarUrl, user }
    },
    {
      body: t.Object({
        file: t.File({ type: ["image/jpeg", "image/png", "image/webp"] }),
      }),
      detail: { summary: "Actualizar foto de perfil", tags: ["Config"] },
    }
  )

  // DELETE /api/config/avatar — eliminar foto de perfil
  .delete(
    "/avatar",
    async ({ authUser, set }) => {
      const user = await actualizarAvatar(authUser._id, null)
      set.status = 200
      return { mensaje: "Foto de perfil eliminada", user }
    },
    { detail: { summary: "Eliminar foto de perfil", tags: ["Config"] } }
  )
