/**
 * Seed completo: ~150 boletas de ejemplo con imagen real adjunta
 * Uso: bun src/scripts/seed.ts
 */

import { connectDB } from "../config/database"
import { User } from "../models/User"
import { Boleta } from "../models/Boleta"
import { AuditLog } from "../models/AuditLog"
import type { BoletaEstado } from "../types"

await connectDB()
console.log("🌱 Iniciando seed completo...\n")

// ─── Limpiar colecciones ──────────────────────────────────────────────────────
await Promise.all([User.deleteMany({}), Boleta.deleteMany({}), AuditLog.deleteMany({})])
console.log("  ✓ Colecciones limpiadas")

// ─── Imagen de ejemplo (copiada a uploads/) ───────────────────────────────────
const IMAGEN_EJEMPLO = {
  url: "/api/uploads/foto_example.png",
  nombre: "foto_example.png",
  tipo: "image/png",
  tamano: 1_384_745,
}

// ─── Crear usuarios ───────────────────────────────────────────────────────────
const [admin, auditor1, auditor2, gestor, ...empleados] = await User.create([
  // Administradores
  { primerNombre: "Ana",       primerApellido: "Martínez",  rut: "12.345.678-9", email: "admin@empresa.com",            password: "demo1234", rol: "administrador" },
  // Auditores
  { primerNombre: "Carlos",    primerApellido: "Ramírez",   rut: "11.234.567-8", email: "auditor@empresa.com",          password: "demo1234", rol: "auditor" },
  { primerNombre: "Sofía",     primerApellido: "Herrera",   rut: "10.123.456-7", email: "sofia.herrera@empresa.com",    password: "demo1234", rol: "auditor" },
  // Gestores
  { primerNombre: "Roberto",   primerApellido: "Fuentes",   rut: "9.876.543-2",  email: "gestor@empresa.com",           password: "demo1234", rol: "gestor" },
  // Empleados — esNuevo: true para testing del protocolo de primer acceso
  { primerNombre: "María",     primerApellido: "González",  rut: "8.765.432-1",  email: "empleado@empresa.com",         password: "demo1234", rol: "empleado", esNuevo: true },
  { primerNombre: "Juan",      primerApellido: "Pérez",     rut: "7.654.321-k",  email: "juan.perez@empresa.com",       password: "demo1234", rol: "empleado", esNuevo: true },
  { primerNombre: "Diego",     primerApellido: "Morales",   rut: "6.543.210-9",  email: "diego.morales@empresa.com",    password: "demo1234", rol: "empleado", esNuevo: true },
  { primerNombre: "Valentina", primerApellido: "Rojas",     rut: "5.432.109-8",  email: "valentina.rojas@empresa.com",  password: "demo1234", rol: "empleado", esNuevo: true },
  { primerNombre: "Sebastián", primerApellido: "Castro",    rut: "14.567.890-3", email: "sebastian.castro@empresa.com", password: "demo1234", rol: "empleado", esNuevo: true },
  { primerNombre: "Camila",    primerApellido: "Torres",    rut: "15.678.901-4", email: "camila.torres@empresa.com",    password: "demo1234", rol: "empleado", esNuevo: true },
  { primerNombre: "Matías",    primerApellido: "Vargas",    rut: "16.789.012-5", email: "matias.vargas@empresa.com",    password: "demo1234", rol: "empleado", esNuevo: true },
  { primerNombre: "Isidora",   primerApellido: "Pinto",     rut: "17.890.123-6", email: "isidora.pinto@empresa.com",    password: "demo1234", rol: "empleado", esNuevo: true },
  { primerNombre: "Felipe",    primerApellido: "Naranjo",   rut: "18.901.234-7", email: "felipe.naranjo@empresa.com",   password: "demo1234", rol: "empleado", esNuevo: true },
])

console.log(`  ✓ ${1 + 2 + 1 + empleados.length} usuarios creados`)

const auditores = [auditor1, auditor2]
const allEmpleados = empleados

// ─── Datos para generación aleatoria ─────────────────────────────────────────

const TIPOS = [
  "Traslado",
  "Reuniones comerciales",
  "Insumos urgentes",
  "Alimentación",
  "Hospedaje",
  "Comunicaciones",
  "Materiales de oficina",
] as const

const DESCRIPCIONES: Record<string, string[]> = {
  "Traslado": [
    "Taxi desde oficina central hasta cliente en Las Condes para reunión de presentación de propuesta.",
    "Uber de ida y vuelta al aeropuerto Arturo Merino Benítez para viaje de negocios a Concepción.",
    "Pasaje de bus interurbano Santiago–Valparaíso para visita a sucursal regional.",
    "Arriendo de vehículo por día completo para recorrido de visitas a clientes en zona norte.",
    "Estacionamiento en edificio corporativo durante reunión con directivos de empresa asociada.",
    "Taxi desde hotel al recinto de conferencia durante congreso nacional de proveedores.",
    "Micro y metro para traslados durante semana de capacitación en sede Santiago centro.",
    "Peaje autopista en viaje de negocios a San Antonio para inspección de planta.",
    "Taxi nocturno de regreso tras reunión extendida con clientes internacionales.",
    "Bencina vehículo propio en visita a terreno — zona industrial de Pudahuel.",
  ],
  "Reuniones comerciales": [
    "Almuerzo de trabajo con directivos de empresa proveedora para negociar contrato anual.",
    "Cena de negocios con delegación de clientes internacionales en visita a la empresa.",
    "Desayuno ejecutivo con gerente de empresa cliente para revisar propuesta de renovación.",
    "Coffee break para reunión de equipo comercial con clientes potenciales del sector retail.",
    "Almuerzo de cierre de negocio con representantes de empresa distribuidora.",
    "Cena de bienvenida para equipo de auditores externos durante proceso de certificación.",
    "Almuerzo de cortesía con representante de empresa socia durante visita a planta.",
    "Refreshments para presentación de producto ante comité de compras de cliente corporativo.",
    "Cena de trabajo durante visita a feria internacional de proveedores en Santiago.",
    "Almuerzo de revisión de contrato con asesor legal externo y representante cliente.",
  ],
  "Insumos urgentes": [
    "Compra urgente de cartuchos de impresora y papel para presentación al directorio.",
    "Adquisición de materiales de papelería para nuevo empleado que ingresa mañana.",
    "Tóner para impresora del departamento agotado en proceso de cierre de mes.",
    "Compra de pen drives y cables USB para configuración de equipos en sala de reuniones.",
    "Adquisición urgente de pizarrones y plumones para taller con clientes.",
    "Compra de cargadores y adaptadores de computador para sala de conferencias.",
    "Materiales de embalaje para envío urgente de muestras a cliente en Antofagasta.",
    "Compra de extensiones y regletas para nueva configuración de puestos de trabajo.",
    "Adquisición de mouse y teclado inalámbrico para gerente que perdió los suyos.",
    "Batería de reemplazo para UPS de servidor crítico en sala de telecomunicaciones.",
  ],
  "Alimentación": [
    "Colación durante jornada extendida por cierre de mes en oficina — hora extra aprobada.",
    "Snacks para equipo durante maratón de trabajo fin de semana — lanzamiento de producto.",
    "Almuerzo en restaurant cercano durante visita a cliente — sin casino disponible.",
    "Desayuno en aeropuerto durante espera de vuelo de negocios a ciudad regional.",
    "Agua y colaciones para equipo durante workshop de planificación estratégica anual.",
    "Almuerzo fuera de oficina por obras en casino del edificio — semana de renovación.",
    "Vianda para equipo de soporte técnico en guardia nocturna durante migración de sistemas.",
    "Colación en hotel durante viaje de negocios — desayuno no incluido en tarifa.",
    "Lunch box para equipo comercial en evento de demostración fuera de la ciudad.",
    "Café y pastelería para reunión de directorio celebrada en sala VIP del edificio.",
  ],
  "Hospedaje": [
    "Hotel 2 noches en Viña del Mar para capacitación regional — tarifa corporativa.",
    "Alojamiento 1 noche en Concepción por reunión con proveedores zona sur.",
    "Hostal 3 noches en Antofagasta para supervisión de instalación en cliente minero.",
    "Hotel en Valdivia durante congreso nacional de la industria — 2 noches.",
    "Alojamiento en La Serena para reunión con cliente del sector agrícola — 1 noche.",
    "Hotel en Iquique durante visita comercial a zona franca — 2 noches.",
    "Alojamiento en Temuco para capacitación de distribuidores zona sur — 3 noches.",
    "Hotel aeropuerto por vuelo de madrugada en viaje de negocios internacional.",
    "Alojamiento en Rancagua durante auditoría en planta de cliente industrial — 2 noches.",
    "Hotel en Puerto Montt para instalación y puesta en marcha de equipamiento — 4 noches.",
  ],
  "Comunicaciones": [
    "Recarga de datos móviles para trabajo en terreno durante semana de visitas a clientes.",
    "Plan de datos prepago para dispositivo de demo utilizado en presentaciones a clientes.",
    "Llamadas internacionales a proveedor en el extranjero durante negociación de contrato.",
    "Roaming internacional durante viaje de negocios a Buenos Aires — 3 días.",
    "Compra de tarjeta SIM local durante viaje de negocios a Brasil — conferencia anual.",
    "SMS masivos de confirmación enviados a participantes de evento corporativo.",
    "Llamadas a línea 800 de soporte técnico proveedor durante instalación crítica.",
    "Internet portátil para trabajo remoto durante semana fuera de la oficina principal.",
    "Envío de documentos por courier urgente a cliente en otra región — contrato firmado.",
    "Recarga plan de datos para tablet usada en presentaciones durante gira comercial.",
  ],
  "Materiales de oficina": [
    "Compra de artículos para nuevo empleado: agenda, bolígrafos y archivadores.",
    "Resmas de papel bond para impresora de uso intensivo en período de cierre.",
    "Carpetas, separadores y materiales para armado de propuestas comerciales para cliente.",
    "Post-its, marcadores y papelógrafo para taller de planificación con el equipo.",
    "Clips, grapadoras y suministros de escritorio para reposición mensual de la oficina.",
    "Etiquetas de identificación y fundas plastificadoras para documentos de archivo.",
    "Cuadernos y lápices para distribuir al equipo antes de reunión de kickoff de proyecto.",
    "Tinta para sello corporativo — consumible de uso continuo en área de contratos.",
    "Calculadoras de escritorio para equipo de finanzas — reposición por obsolescencia.",
    "Bandas elásticas, broches y materiales de archivo para cierre de año contable.",
  ],
}

// Montos realistas por tipo (CLP)
const RANGOS_MONTO: Record<string, [number, number]> = {
  "Traslado":             [3_500,   85_000],
  "Reuniones comerciales":[25_000,  320_000],
  "Insumos urgentes":     [8_000,   180_000],
  "Alimentación":         [4_500,   45_000],
  "Hospedaje":            [45_000,  380_000],
  "Comunicaciones":       [3_900,   55_000],
  "Materiales de oficina":[4_000,   95_000],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Redondea a múltiplo de 100 (más natural en CLP) */
function randMonto(tipo: string): number {
  const [min, max] = RANGOS_MONTO[tipo] ?? [5_000, 100_000]
  return Math.round(randInt(min, max) / 100) * 100
}

/** Fecha aleatoria en los últimos N días */
function randFecha(diasAtras: number): Date {
  const ms = Date.now() - Math.random() * diasAtras * 86_400_000
  return new Date(ms)
}

/**
 * Distribución de estados:
 *   pendiente   ~25%
 *   en_revision ~20%
 *   aprobada    ~25%
 *   rechazada   ~10%
 *   pagada      ~20%
 */
function randEstado(): BoletaEstado {
  const r = Math.random()
  if (r < 0.25) return "pendiente"
  if (r < 0.45) return "en_revision"
  if (r < 0.70) return "aprobada"
  if (r < 0.80) return "rechazada"
  return "pagada"
}

const COMENTARIOS_APROBACION = [
  "Gasto justificado. Aprobado según política de reembolsos.",
  "Documentación completa. Monto dentro del límite autorizado.",
  "Aprobado. Corresponde a actividad registrada en sistema de gestión.",
  "Reembolso autorizado. Gasto alineado con presupuesto del área.",
  "Aprobado sin observaciones. Boleta en regla.",
  "Gasto aprobado. Actividad validada con jefatura directa.",
  "Autorizado. Dentro del rango permitido para el tipo de gasto.",
  "Aprobado. Adjunta documentación de respaldo suficiente.",
]

const COMENTARIOS_RECHAZO = [
  "Rechazado. El monto excede el límite diario establecido en la política de gastos.",
  "No aprobado. El tipo de gasto no corresponde a las categorías reembolsables.",
  "Rechazado. Falta documentación de respaldo para justificar el monto solicitado.",
  "No procede. El gasto debió ser autorizado previamente por jefatura.",
  "Rechazado. La actividad no está relacionada con funciones laborales.",
  "No aprobado. El comprobante adjunto no cumple con los requisitos tributarios.",
  "Rechazado. Gasto duplicado — ya existe una boleta registrada para esta actividad.",
  "No procede en este período. Superado el presupuesto mensual asignado al área.",
]

// ─── Generar 150 boletas secuencialmente ─────────────────────────────────────

console.log("  ⏳ Generando 150 boletas (puede tardar unos segundos)...")

const boletasCreadas: Array<Awaited<ReturnType<typeof Boleta.create>>> = []

for (let i = 0; i < 150; i++) {
  const empleado = rand(allEmpleados)
  const tipo = rand([...TIPOS])
  const estado = randEstado()
  const fecha = randFecha(180) // últimos 6 meses
  const auditor = rand(auditores)
  const descripcionPool = DESCRIPCIONES[tipo] ?? []
  const descripcion = rand(descripcionPool)

  const boletaData: Record<string, unknown> = {
    tipo,
    monto: randMonto(tipo),
    fecha,
    descripcion,
    estado,
    empleado: empleado._id,
    imagen: IMAGEN_EJEMPLO,
  }

  if (estado === "en_revision" || estado === "aprobada" || estado === "rechazada" || estado === "pagada") {
    boletaData.auditor = auditor._id
    boletaData.fechaRevision = new Date(fecha.getTime() + randInt(1, 5) * 86_400_000)
  }

  if (estado === "aprobada" || estado === "pagada") {
    boletaData.comentarioAuditor = rand(COMENTARIOS_APROBACION)
  }

  if (estado === "rechazada") {
    boletaData.comentarioAuditor = rand(COMENTARIOS_RECHAZO)
  }

  if (estado === "pagada") {
    boletaData.gestor = gestor._id
    boletaData.fechaPago = new Date((boletaData.fechaRevision as Date).getTime() + randInt(1, 7) * 86_400_000)
    boletaData.comprobante = {
      url: "/api/uploads/foto_example.png",
      nombre: "comprobante_transferencia.png",
      tipo: "image/png",
      tamano: 1_384_745,
    }
  }

  const boleta = await Boleta.create(boletaData)
  boletasCreadas.push(boleta)

  // Progreso visual cada 30
  if ((i + 1) % 30 === 0) process.stdout.write(`    → ${i + 1}/150\n`)
}

console.log("  ✓ 150 boletas creadas")

// ─── Generar audit logs ───────────────────────────────────────────────────────

const auditEntries = []

for (const boleta of boletasCreadas) {
  const empleadoId = (boleta as any).empleado

  // Siempre: log de creación
  auditEntries.push({
    boleta: (boleta as any)._id,
    usuario: empleadoId,
    accion: "crear",
    estadoNuevo: "pendiente",
    fecha: (boleta as any).createdAt,
  })

  // Si tiene auditor asignado
  if (boleta.auditor) {
    if (boleta.estado === "en_revision") {
      auditEntries.push({
        boleta: (boleta as any)._id,
        usuario: boleta.auditor,
        accion: "revisar",
        estadoAnterior: "pendiente",
        estadoNuevo: "en_revision",
        fecha: boleta.fechaRevision,
      })
    }

    if (boleta.estado === "aprobada") {
      auditEntries.push(
        { boleta: (boleta as any)._id, usuario: boleta.auditor, accion: "revisar", estadoAnterior: "pendiente", estadoNuevo: "en_revision", fecha: boleta.fechaRevision },
        { boleta: (boleta as any)._id, usuario: boleta.auditor, accion: "aprobar", estadoAnterior: "en_revision", estadoNuevo: "aprobada", comentario: boleta.comentarioAuditor, fecha: boleta.fechaRevision }
      )
    }

    if (boleta.estado === "rechazada") {
      auditEntries.push(
        { boleta: (boleta as any)._id, usuario: boleta.auditor, accion: "revisar", estadoAnterior: "pendiente", estadoNuevo: "en_revision", fecha: boleta.fechaRevision },
        { boleta: (boleta as any)._id, usuario: boleta.auditor, accion: "rechazar", estadoAnterior: "en_revision", estadoNuevo: "rechazada", comentario: boleta.comentarioAuditor, fecha: boleta.fechaRevision }
      )
    }

    if (boleta.estado === "pagada") {
      auditEntries.push(
        { boleta: (boleta as any)._id, usuario: boleta.auditor, accion: "revisar", estadoAnterior: "pendiente", estadoNuevo: "en_revision", fecha: boleta.fechaRevision },
        { boleta: (boleta as any)._id, usuario: boleta.auditor, accion: "aprobar", estadoAnterior: "en_revision", estadoNuevo: "aprobada", comentario: boleta.comentarioAuditor, fecha: boleta.fechaRevision },
        { boleta: (boleta as any)._id, usuario: boleta.gestor, accion: "pagar", estadoAnterior: "aprobada", estadoNuevo: "pagada", fecha: boleta.fechaPago }
      )
    }
  }
}

// Logs de login de usuarios demo
for (const u of [admin, auditor1, auditor2, gestor, ...allEmpleados]) {
  auditEntries.push({ usuario: u._id, accion: "login", fecha: new Date() })
}

// insertMany es seguro aquí (no hay pre-save hook relevante en AuditLog)
await AuditLog.insertMany(auditEntries)
console.log(`  ✓ ${auditEntries.length} audit logs creados`)

// ─── Resumen final ────────────────────────────────────────────────────────────

const conteos = await Boleta.aggregate([
  { $group: { _id: "$estado", total: { $sum: 1 } } },
])
const totalAprobado = await Boleta.aggregate([
  { $match: { estado: "aprobada" } },
  { $group: { _id: null, monto: { $sum: "$monto" } } },
])

console.log("\n✅ Seed completado exitosamente")
console.log("\n📊 Distribución de boletas:")
for (const c of conteos.sort((a, b) => a._id.localeCompare(b._id))) {
  console.log(`   ${c._id.padEnd(12)} → ${c.total} boletas`)
}
console.log(`\n💰 Monto total aprobado: $${(totalAprobado[0]?.monto ?? 0).toLocaleString("es-CL")} CLP`)

console.log("\n👥 Cuentas de acceso (contraseña: demo1234):")
console.log("   admin@empresa.com                → Administrador (Ana Martínez)")
console.log("   auditor@empresa.com              → Auditor (Carlos Ramírez)")
console.log("   sofia.herrera@empresa.com        → Auditor (Sofía Herrera)")
console.log("   gestor@empresa.com               → Gestor (Roberto Fuentes)")
console.log("   empleado@empresa.com             → Empleado (María González)")
console.log("   juan.perez@empresa.com           → Empleado (Juan Pérez)")
console.log("   + 6 empleados adicionales")

process.exit(0)
