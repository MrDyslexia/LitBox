import { Elysia, t } from "elysia"
import sharp from "sharp"
import { authMiddleware } from "../middleware/auth"
import { env } from "../config/env"
import { mkdir } from "node:fs/promises"
import { join, resolve } from "node:path"

// Resolver a ruta absoluta para que el chequeo anti-traversal sea consistente
const UPLOAD_DIR = resolve(env.uploads.dir)

// Asegurar que el directorio de uploads existe
await mkdir(UPLOAD_DIR, { recursive: true })

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

/**
 * Comprime una imagen a WebP y la redimensiona si supera el ancho máximo.
 * Los PDFs se pasan sin modificar.
 * Retorna el buffer comprimido y el tipo MIME resultante.
 */
async function comprimirImagen(
  buffer: ArrayBuffer,
  mimeType: string
): Promise<{ buffer: Buffer; tipo: string }> {
  if (!IMAGE_TYPES.has(mimeType)) {
    return { buffer: Buffer.from(buffer), tipo: mimeType }
  }

  const { quality, maxWidth } = env.uploads.compression

  const comprimido = await sharp(Buffer.from(buffer))
    .rotate()                          // corregir orientación EXIF automáticamente
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer()

  return { buffer: comprimido, tipo: "image/webp" }
}

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

      const rawBuffer = await file.arrayBuffer()
      const { buffer: finalBuffer, tipo: tipoFinal } = await comprimirImagen(rawBuffer, file.type)

      const extension = tipoFinal === "image/webp" ? ".webp"
        : tipoFinal === "image/jpeg"               ? ".jpg"
        : tipoFinal === "image/png"                ? ".png"
        : tipoFinal === "application/pdf"          ? ".pdf"
        : ".bin"

      const nombreBase = file.name
        .replaceAll(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/\.[^.]+$/, "")           // quitar extensión original
        .substring(0, 40)
      const nombreArchivo = `${Date.now()}_${nombreBase}${extension}`
      const rutaCompleta = join(UPLOAD_DIR, nombreArchivo)

      await Bun.write(rutaCompleta, finalBuffer)

      return {
        url:    `/api/uploads/${nombreArchivo}`,
        nombre: file.name,
        tipo:   tipoFinal,
        tamano: finalBuffer.length,
      }
    },
    {
      body: t.Object({
        file: t.File({
          type: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
        }),
      }),
      detail: { summary: "Subir y comprimir imagen de boleta", tags: ["Uploads"] },
    }
  )
