import { createWorker } from "tesseract.js"
import sharp from "sharp"
import { env } from "../config/env"

const log = (...args: any[]) => { if (env.isDev) console.log("[SCAN]", ...args) }

let scanEnCurso = false

export interface ScanResult {
  valido: boolean
  motivo?: string
  monto?: number
  fecha?: string
  descripcion?: string
}

async function preprocesar(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate()                    // corregir orientación EXIF
    .grayscale()                 // escala de grises
    .normalise()                 // estira histograma
    .threshold(140)              // binariza: texto negro queda negro, watermarks/fondos grises → blanco
    .toBuffer()
}

async function extraerTextoConfiable(buffer: Buffer): Promise<{ texto: string; confianza: number; palabras: number } | null> {
  log("▶ Iniciando Tesseract OCR...")
  const worker = await createWorker("spa", 1, {
    cachePath: "/tmp/tesseract-cache",
    logger: () => {},
  })

  try {
    const { data } = await worker.recognize(buffer)

    const words = data.words ?? []
    const rawText = (data.text ?? "").trim()
    const globalConf: number = data.confidence ?? 0

    log(`── ANTES DEL FILTRO ──`)
    log(`Total palabras: ${words.length} | Confianza global raw: ${globalConf.toFixed(1)}%`)
    log("Texto raw OCR:\n" + (rawText || "(vacío)"))

    // Caso A: words disponibles → filtrar por confidence por palabra
    if (words.length >= env.ocr.minUsableWords) {
      log(`Muestra palabras con su confidence:`)
      words.slice(0, 30).forEach((w: any) => log(`  "${w.text}" → ${w.confidence.toFixed(1)}%`))

      const palabrasConfiables = words.filter(
        (w: any) => w.confidence >= env.ocr.wordConfidenceMin && w.text.trim().length > 0
      )
      log(`── DESPUÉS DEL FILTRO (conf ≥ ${env.ocr.wordConfidenceMin}) ──`)
      log(`Aceptadas: ${palabrasConfiables.length} | Rechazadas: ${words.length - palabrasConfiables.length}`)

      if (palabrasConfiables.length < env.ocr.minUsableWords) {
        log(`✗ Rechazado: insuficientes palabras confiables (${palabrasConfiables.length} < ${env.ocr.minUsableWords})`)
        return null
      }

      const confianzaPromedio =
        palabrasConfiables.reduce((sum: number, w: any) => sum + w.confidence, 0) / palabrasConfiables.length

      log(`Confianza promedio post-filtro: ${confianzaPromedio.toFixed(1)}%`)

      if (confianzaPromedio < env.ocr.docConfidenceMin) {
        log(`✗ Rechazado: confianza promedio ${confianzaPromedio.toFixed(1)} < ${env.ocr.docConfidenceMin}`)
        return null
      }

      const textoLimpio = (data.lines ?? [])
        .map((line: any) =>
          (line.words ?? [])
            .filter((w: any) => w.confidence >= env.ocr.wordConfidenceMin)
            .map((w: any) => w.text)
            .join(" ")
        )
        .filter((l: string) => l.trim().length > 0)
        .join("\n")

      log(`── TEXTO LIMPIO PARA LLM (vía words) ──\n` + textoLimpio)
      return { texto: textoLimpio, confianza: confianzaPromedio, palabras: palabrasConfiables.length }
    }

    // Caso B: words vacío — usar data.text directamente con confidence global
    log(`── FALLBACK: words vacío, usando data.text directamente ──`)
    if (!rawText || rawText.length < 20) {
      log(`✗ Rechazado: texto vacío o demasiado corto`)
      return null
    }
    if (globalConf < env.ocr.docConfidenceMin) {
      log(`✗ Rechazado: confianza global ${globalConf.toFixed(1)} < ${env.ocr.docConfidenceMin}`)
      return null
    }
    log(`✓ Aceptado con conf global ${globalConf.toFixed(1)}% — ${rawText.length} chars`)
    log(`── TEXTO PARA LLM (vía data.text) ──\n` + rawText)
    return { texto: rawText, confianza: globalConf, palabras: rawText.split(/\s+/).length }
  } finally {
    await worker.terminate()
  }
}

async function extraerConOllama(texto: string): Promise<ScanResult> {
  log(`▶ Enviando a Ollama (${env.ocr.ollamaModel}) — timeout ${env.ocr.ollamaTimeoutMs}ms...`)
  const prompt = `Eres un extractor de datos de boletas y tickets de compra chilenos.

Se te entrega texto extraído por OCR con posibles errores tipográficos.

CRITERIO DE VALIDEZ: Retorna valido:true si puedes extraer AL MENOS UN campo útil (monto, fecha o nombre de negocio). Solo retorna valido:false si el texto es completamente incoherente y no contiene absolutamente ningún dato recuperable.

Extrae los campos que PUEDAS determinar con razonable confianza. Omite los que no puedas:
- monto: total final en CLP como entero. Busca TOTAL o SUBTOTAL al final. En Chile el punto es separador de miles: 8.300 = 8300, 88.407 = 88407
- fecha: formato YYYY-MM-DD. Busca patrones como "14/12/2014", "2022-02-12", "Fecha:"
- descripcion: nombre del negocio o empresa, máximo 80 caracteres. Busca "LTDA", "S.A.", "SPA" o el nombre al inicio del texto

Texto OCR:
${texto}

Responde SOLO con JSON, sin texto adicional:
Con datos: {"valido":true,"monto":8300,"fecha":"2022-02-12","descripcion":"Britt Chile Ltda"}
Parcial: {"valido":true,"monto":8300,"descripcion":"Britt Chile Ltda"}
Inválido: {"valido":false,"motivo":"razón específica"}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), env.ocr.ollamaTimeoutMs)

  try {
    const res = await fetch(`${env.ocr.ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.ocr.ollamaModel,
        prompt,
        stream: false,
        format: "json",
        options: { temperature: 0.1 },
      }),
      signal: controller.signal,
    })

    if (!res.ok) throw new Error(`Ollama respondió ${res.status}`)

    const json = await res.json() as { response: string }
    log(`── RESPUESTA LLM ──`)
    log(json.response)

    // Extraer JSON de la respuesta (puede venir con texto extra)
    const match = json.response.match(/\{[\s\S]*\}/)
    if (!match) throw new Error("LLM no devolvió JSON válido")

    const resultado = JSON.parse(match[0]) as ScanResult
    log("✓ Resultado final:", resultado)
    return resultado

  } catch (err: any) {
    if (err.name === "AbortError") {
      log("✗ Timeout Ollama")
      return { valido: false, motivo: "El análisis tardó demasiado, intenta con otra imagen" }
    }
    log("✗ Error Ollama:", err.message)
    return { valido: false, motivo: "Error al analizar la imagen" }
  } finally {
    clearTimeout(timeout)
  }
}

export async function scanBoleta(imageBuffer: Buffer): Promise<ScanResult> {
  if (scanEnCurso) {
    log("✗ Scan ya en curso — rechazando request concurrente")
    return { valido: false, motivo: "Ya hay un análisis en proceso, espera un momento" }
  }
  scanEnCurso = true
  try {
    log("═══════════════════════════════")
    log("Iniciando scan de boleta")

    const procesado = await preprocesar(imageBuffer)
    log("✓ Preprocesado de imagen completado")

    const ocr = await extraerTextoConfiable(procesado)
    if (!ocr) {
      log("✗ Imagen rechazada por baja calidad OCR")
      return { valido: false, motivo: "La imagen no es legible, intenta con una foto más nítida" }
    }

    const resultado = await extraerConOllama(ocr.texto)
    log("Scan finalizado:", resultado)
    log("═══════════════════════════════")
    return resultado
  } catch (err: any) {
    log("✗ Error inesperado en scan:", err.message)
    return { valido: false, motivo: "Error interno al procesar la imagen" }
  } finally {
    scanEnCurso = false
  }
}
