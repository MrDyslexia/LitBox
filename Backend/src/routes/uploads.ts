import { Elysia, t } from "elysia"
import { authMiddleware } from "../middleware/auth"
import { env } from "../config/env"
import { mkdir } from "node:fs/promises"
import { join, resolve } from "node:path"

// Resolver a ruta absoluta para que el chequeo anti-traversal sea consistente
const UPLOAD_DIR = resolve(env.uploads.dir)

// Asegurar que el directorio de uploads existe
await mkdir(UPLOAD_DIR, { recursive: true })

export const uploadRoutes = new Elysia({ prefix: "/uploads" })

  // GET /api/uploads/:filename — servir archivo (sin auth: las URLs son únicas por timestamp)
  .get(
    "/:filename",
    async ({ params, set }) => {
      const ruta = join(UPLOAD_DIR, params.filename)

      // Prevenir path traversal
      if (!ruta.startsWith(UPLOAD_DIR + "/")) {
        set.status = 400
        throw new Error("Ruta inválida")
      }

      const archivo = Bun.file(ruta)
      const existe = await archivo.exists()

      if (!existe) {
        set.status = 404
        throw new Error("Archivo no encontrado")
      }

      return new Response(archivo)
    },
    { detail: { summary: "Obtener archivo subido", tags: ["Uploads"] } }
  )

  // POST /api/uploads — subir archivo (requiere auth)
  .use(authMiddleware)
  .post(
    "/",
    async ({ body, set }) => {
      const file = body.file

      if (!env.uploads.allowedTypes.includes(file.type)) {
        set.status = 400
        throw new Error(
          `Tipo de archivo no permitido. Permitidos: ${env.uploads.allowedTypes.join(", ")}`
        )
      }

      if (file.size > env.uploads.maxSize) {
        set.status = 400
        throw new Error(
          `El archivo supera el tamaño máximo de ${env.uploads.maxSize / 1_048_576}MB`
        )
      }

      const nombreSanitizado = file.name
        .replaceAll(/[^a-zA-Z0-9._-]/g, "_")
        .substring(0, 50)
      const nombreArchivo = `${Date.now()}_${nombreSanitizado}`
      const rutaCompleta = join(UPLOAD_DIR, nombreArchivo)

      await Bun.write(rutaCompleta, file)

      return {
        url: `/api/uploads/${nombreArchivo}`,
        nombre: file.name,
        tipo: file.type,
        tamano: file.size,
      }
    },
    {
      body: t.Object({
        file: t.File({
          type: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
        }),
      }),
      detail: { summary: "Subir imagen de boleta", tags: ["Uploads"] },
    }
  )
