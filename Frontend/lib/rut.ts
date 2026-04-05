import { formatRut, validateRut, cleanRut, RutFormat } from "@fdograph/rut-utilities"

/**
 * Formatea el RUT mientras el usuario escribe.
 * Acepta cualquier entrada sucia y devuelve el formato XX.XXX.XXX-D.
 * Si el input está vacío devuelve "".
 */
export function formatRutInput(raw: string): string {
  // Conservar solo dígitos y la letra K/k
  const clean = raw.replace(/[^0-9kK]/g, "").toUpperCase()
  if (!clean) return ""

  // El verifier es el último char; los dígitos son el resto
  const digits = clean.slice(0, -1)
  const verifier = clean.slice(-1)

  if (!digits) return verifier // solo tiene 1 char

  return formatRut(`${digits}-${verifier}`, RutFormat.DOTS_DASH)
}

/**
 * Valida un RUT ya formateado (con puntos y guión).
 * Usa el dígito verificador del algoritmo Módulo 11.
 */
export function isValidRut(rut: string): boolean {
  return validateRut(rut)
}

/**
 * Devuelve el RUT limpio (solo números + verifier) para enviar al backend.
 * Ejemplo: "12.345.678-9" → "123456789"
 * El backend almacena con puntos/guión, así que también aceptamos el formateado.
 */
export function normalizeRutForApi(rut: string): string {
  // Mandamos el formato con puntos y guión directo
  return rut.trim()
}
