"use client"

import * as LucideIcons from "lucide-react"
import { FileText } from "lucide-react"

interface Props {
  icono: string
  className?: string
  style?: React.CSSProperties
}

export function TipoGastoIcon({ icono, className, style }: Props) {
  const Icon = (LucideIcons as Record<string, any>)[icono]
  if (!Icon) return <FileText className={className} style={style} />
  return <Icon className={className} style={style} />
}

// Iconos curados para tipos de gasto (nombre → label)
export const ICONOS_DISPONIBLES: { name: string; label: string }[] = [
  { name: "Car",            label: "Auto" },
  { name: "Bus",            label: "Bus" },
  { name: "Train",          label: "Tren" },
  { name: "Plane",          label: "Avión" },
  { name: "Ship",           label: "Barco" },
  { name: "Truck",          label: "Camión" },
  { name: "Bike",           label: "Bicicleta" },
  { name: "Utensils",       label: "Comida" },
  { name: "Coffee",         label: "Café" },
  { name: "Wine",           label: "Restaurante" },
  { name: "Pizza",          label: "Almuerzo" },
  { name: "Hotel",          label: "Hotel" },
  { name: "Home",           label: "Alojamiento" },
  { name: "Building2",      label: "Edificio" },
  { name: "Briefcase",      label: "Maletín" },
  { name: "Users",          label: "Reunión" },
  { name: "Handshake",      label: "Negociación" },
  { name: "Presentation",   label: "Presentación" },
  { name: "ShoppingCart",   label: "Compras" },
  { name: "Package",        label: "Paquete" },
  { name: "Box",            label: "Insumos" },
  { name: "ShoppingBag",    label: "Bolsa" },
  { name: "Phone",          label: "Teléfono" },
  { name: "Wifi",           label: "Internet" },
  { name: "Mail",           label: "Correo" },
  { name: "MessageSquare",  label: "Mensajería" },
  { name: "Paperclip",      label: "Papelería" },
  { name: "Printer",        label: "Impresión" },
  { name: "Pen",            label: "Escritura" },
  { name: "FileText",       label: "Documento" },
  { name: "Receipt",        label: "Recibo" },
  { name: "CreditCard",     label: "Tarjeta" },
  { name: "DollarSign",     label: "Dinero" },
  { name: "Wallet",         label: "Billetera" },
  { name: "Wrench",         label: "Herramientas" },
  { name: "Settings",       label: "Configuración" },
  { name: "Zap",            label: "Energía" },
  { name: "BookOpen",       label: "Capacitación" },
  { name: "GraduationCap",  label: "Formación" },
  { name: "Monitor",        label: "Monitor" },
  { name: "Laptop",         label: "Computador" },
  { name: "Camera",         label: "Cámara" },
  { name: "HelpCircle",     label: "Otro" },
  { name: "Tag",            label: "Etiqueta" },
  { name: "Star",           label: "Especial" },
]
