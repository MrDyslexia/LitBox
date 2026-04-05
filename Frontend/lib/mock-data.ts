export type BoletaStatus = "pendiente" | "en_revision" | "aprobada" | "rechazada" | "pagada"

export type BoletaTipo =
  | "Traslado"
  | "Reuniones comerciales"
  | "Insumos urgentes"
  | "Alimentación"
  | "Hospedaje"
  | "Comunicaciones"
  | "Materiales de oficina"
  | "Otro"

export interface Boleta {
  _id?: string           // MongoDB ObjectId — requerido para llamadas a la API
  id: string             // Código legible: BOL-001
  tipo: BoletaTipo
  monto: number
  fecha: string
  descripcion: string
  estado: BoletaStatus
  empleadoNombre: string
  empleadoEmail: string
  imageUrl: string
  imageTipo?: string
  comentarioAuditor?: string
  fechaRevision?: string
  gestorNombre?: string
  fechaPago?: string
  comprobanteUrl?: string
}

export const MOCK_BOLETAS: Boleta[] = [
  {
    id: "BOL-001",
    tipo: "Traslado",
    monto: 45000,
    fecha: "2025-06-01",
    descripcion: "Taxi desde oficina central hasta cliente en Las Condes para reunión de presentación.",
    estado: "aprobada",
    empleadoNombre: "María González",
    empleadoEmail: "empleado@empresa.com",
    imageUrl: "/placeholder-receipt.jpg",
    comentarioAuditor: "Gasto aprobado. Corresponde a visita registrada en calendario.",
    fechaRevision: "2025-06-03",
  },
  {
    id: "BOL-002",
    tipo: "Reuniones comerciales",
    monto: 120000,
    fecha: "2025-06-05",
    descripcion: "Almuerzo de trabajo con directivos de empresa proveedora para negociar contrato anual.",
    estado: "en_revision",
    empleadoNombre: "María González",
    empleadoEmail: "empleado@empresa.com",
    imageUrl: "/placeholder-receipt.jpg",
  },
  {
    id: "BOL-003",
    tipo: "Insumos urgentes",
    monto: 78500,
    fecha: "2025-06-08",
    descripcion: "Compra urgente de cartuchos de impresora y papel para presentación al directorio.",
    estado: "pendiente",
    empleadoNombre: "María González",
    empleadoEmail: "empleado@empresa.com",
    imageUrl: "/placeholder-receipt.jpg",
  },
  {
    id: "BOL-004",
    tipo: "Alimentación",
    monto: 15000,
    fecha: "2025-05-20",
    descripcion: "Colación durante jornada extendida por cierre de mes en oficina.",
    estado: "rechazada",
    empleadoNombre: "María González",
    empleadoEmail: "empleado@empresa.com",
    imageUrl: "/placeholder-receipt.jpg",
    comentarioAuditor: "No cumple con política de gastos: monto excede límite diario de alimentación.",
    fechaRevision: "2025-05-22",
  },
  {
    id: "BOL-005",
    tipo: "Traslado",
    monto: 32000,
    fecha: "2025-06-10",
    descripcion: "Pasaje de bus ida y vuelta a feria de proveedores en Maipú.",
    estado: "pendiente",
    empleadoNombre: "María González",
    empleadoEmail: "empleado@empresa.com",
    imageUrl: "/placeholder-receipt.jpg",
  },
  {
    id: "BOL-006",
    tipo: "Materiales de oficina",
    monto: 55000,
    fecha: "2025-06-12",
    descripcion: "Compra de artículos para nuevo empleado: agenda, bolígrafos, archivadores.",
    estado: "en_revision",
    empleadoNombre: "Carlos López",
    empleadoEmail: "carlos@empresa.com",
    imageUrl: "/placeholder-receipt.jpg",
  },
  {
    id: "BOL-007",
    tipo: "Hospedaje",
    monto: 250000,
    fecha: "2025-06-03",
    descripcion: "Hotel 2 noches en Viña del Mar para capacitación regional.",
    estado: "aprobada",
    empleadoNombre: "Luis Pérez",
    empleadoEmail: "luis@empresa.com",
    imageUrl: "/placeholder-receipt.jpg",
    comentarioAuditor: "Aprobado. Viaje autorizado por gerencia.",
    fechaRevision: "2025-06-07",
  },
  {
    id: "BOL-008",
    tipo: "Comunicaciones",
    monto: 18900,
    fecha: "2025-06-11",
    descripcion: "Recarga de datos móviles para trabajo en terreno durante semana.",
    estado: "pendiente",
    empleadoNombre: "Carlos López",
    empleadoEmail: "carlos@empresa.com",
    imageUrl: "/placeholder-receipt.jpg",
  },
]

export const STATUS_CONFIG: Record<
  BoletaStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  pendiente: {
    label: "Pendiente",
    color: "oklch(0.55 0.15 70)",
    bg: "oklch(0.97 0.04 70)",
    dot: "oklch(0.65 0.15 70)",
  },
  en_revision: {
    label: "En revisión",
    color: "oklch(0.4 0.1 240)",
    bg: "oklch(0.94 0.03 240)",
    dot: "oklch(0.56 0.13 185)",
  },
  aprobada: {
    label: "Aprobada",
    color: "oklch(0.38 0.12 145)",
    bg: "oklch(0.95 0.04 145)",
    dot: "oklch(0.56 0.13 145)",
  },
  rechazada: {
    label: "Rechazada",
    color: "oklch(0.45 0.18 27)",
    bg: "oklch(0.97 0.02 27)",
    dot: "oklch(0.577 0.245 27.325)",
  },
  pagada: {
    label: "Pagada",
    color: "oklch(0.35 0.1 195)",
    bg: "oklch(0.93 0.04 195)",
    dot: "oklch(0.52 0.14 195)",
  },
}

export const TIPOS_BOLETA: BoletaTipo[] = [
  "Traslado",
  "Reuniones comerciales",
  "Insumos urgentes",
  "Alimentación",
  "Hospedaje",
  "Comunicaciones",
  "Materiales de oficina",
  "Otro",
]

export function formatMonto(monto: number): string {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(monto)
}

export function formatFecha(fecha: string): string {
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
