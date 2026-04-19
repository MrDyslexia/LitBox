import { createWorker } from "tesseract.js"
import sharp from "sharp"

export interface ScanResult {
  monto?: number
  fecha?: string
  descripcion?: string
}


async function preprocesar(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate()                    // corregir orientación EXIF
    .grayscale()                 // eliminar color → mejor contraste OCR
    .normalise()                 // estira histograma → mejora zonas oscuras/claras
    .sharpen({ sigma: 1.5 })    // enfoca texto borroso
    .linear(1.4, -30)           // aumenta contraste (multiply + offset)
    .toBuffer()
}

export async function scanBoleta(imageBuffer: Buffer): Promise<ScanResult> {
  const procesado = await preprocesar(imageBuffer)

  const worker = await createWorker("spa", 1, {
    cachePath: "/tmp/tesseract-cache",
    logger: () => {},
  })

  let text = ""
  try {
    const { data } = await worker.recognize(procesado)
    text = data.text
  } finally {
    await worker.terminate()
  }

  const result = parseBoleta(text)
  console.log("[OCR] Texto extraído:\n", text)
  console.log("[OCR] Resultado parseado:", result)
  return result
}

function parseBoleta(text: string): ScanResult {
  const result: ScanResult = {}
  // --- MONTO ---
  const montoPatterns = [
    /^[ \t]*total\s+a\s+pagar[ \t]*[^\d\n]{0,10}([\d.]+)/im,
    /^[ \t]*monto\s+total[ \t]*[^\d\n]{0,10}([\d.]+)/im,
    // TOTAL al inicio de línea (con posible leading whitespace y chars OCR)
    /^[ \t]*total[ \t]*[^\d\n]{0,8}([\d.]{4,})/im,
    // TOTAL en cualquier posición de línea (ej: "La TOTAL: $15.980")
    /\btotal\s*[^\d\n]{0,8}([\d.]{4,})/im,
    // OCR errors en negrita: TOTA!, T0TAL, TOTAI, etc.
    /\btot[a4][l!1i]\s*[^\d\n]{0,8}([\d.]{4,})/im,
    // Transbank y medios de pago (línea puede tener prefijo OCR basura)
    /(?:tbk[ \t]+)?(?:debito|crédito|credito|efectivo|tarjeta|pago)[ \t]*[^\d\n]{0,8}([\d.]{4,})/im,
    /^[ \t]*subtotal[ \t]*[^\d\n]{0,8}([\d.]{4,})/im,
  ]
  for (const pattern of montoPatterns) {
    const m = text.match(pattern)
    console.log(`[OCR][monto] pattern=${pattern} match=${JSON.stringify(m?.[0])} group=${m?.[1]}`)
    if (m) {
      const num = parseInt(m[1].replace(/\./g, ""), 10)
      if (!isNaN(num) && num >= 100 && num <= 99_999_999) {
        result.monto = num
        break
      }
    }
  }

  // Fallback: mayor $ en el texto (el total es generalmente el monto más alto)
  if (!result.monto) {
    const allMatches = [...text.matchAll(/\$[ \t]*([\d.]{4,})/g)]
    const candidates = allMatches
      .map((m) => parseInt(m[1].replace(/\./g, ""), 10))
      .filter((n) => !isNaN(n) && n >= 1000 && n <= 99_999_999)
    if (candidates.length > 0) {
      result.monto = Math.max(...candidates)
      console.log("[OCR][monto] fallback mayor $:", result.monto)
    }
  }

  // --- FECHA --- (YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY)
  const isoMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    const iso = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`
    const parsed = new Date(iso + "T00:00:00")
    if (!isNaN(parsed.getTime()) && parsed <= new Date()) {
      result.fecha = iso
    }
  }
  if (!result.fecha) {
    const dmyMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
    if (dmyMatch) {
      const iso = `${dmyMatch[3]}-${dmyMatch[2].padStart(2, "0")}-${dmyMatch[1].padStart(2, "0")}`
      const parsed = new Date(iso + "T00:00:00")
      if (!isNaN(parsed.getTime()) && parsed <= new Date()) {
        result.fecha = iso
      }
    }
  }

  // --- DESCRIPCION ---
  // Prioridad: línea con LTDA / S.A. / SPA / LIMITADA (razón social)
  // Fallback: línea después de "dirección:" o primera línea limpia larga
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length >= 5)

  // Prioridad 1: línea con indicador de razón social (LTDA, S.A., etc.)
  const razonSocial = lines.find((l) =>
    /\b(ltda|s\.a\.|spa|limitada|s\.p\.a\.|eirl|sociedad)\b/i.test(l) &&
    /[a-zA-ZáéíóúÁÉÍÓÚñÑ]{4,}/.test(l)
  )

  if (razonSocial) {
    result.descripcion = `Gasto en ${razonSocial.substring(0, 120)}`
  } else {
    // Fallback: primera línea con ≥2 palabras de ≥4 letras (descarta ruido OCR)
    const cleanLine = lines.find((l) => {
      if (l.length < 8 || l.length > 120) return false
      const palabrasLimpias = l.split(/\s+/).filter((w) =>
        (w.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/g) || []).length >= 4
      )
      return palabrasLimpias.length >= 2
    })
    if (cleanLine) result.descripcion = `Gasto en ${cleanLine.substring(0, 120)}`
  }

  return result
}
