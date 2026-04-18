"use client"

import { LayoutDashboard, Wallet, History, Settings, BarChart3, Tag } from "lucide-react"
import RoleShell from "@/components/role-shell"

const GESTOR_COLOR = "oklch(0.36 0.08 252)"

const navItems = [
  { icon: <LayoutDashboard className="w-4 h-4" />, label: "Resumen", href: "/gestor" },
  { icon: <Wallet className="w-4 h-4" />, label: "Por pagar", href: "/gestor/por-pagar" },
  { icon: <History className="w-4 h-4" />, label: "Historial de pagos", href: "/gestor/historial" },
  { icon: <Tag className="w-4 h-4" />, label: "Tipos de gasto", href: "/gestor/tipos-gasto" },
  { icon: <BarChart3 className="w-4 h-4" />, label: "Estadísticas", href: "/gestor/estadisticas" },
  { icon: <Settings className="w-4 h-4" />, label: "Mi perfil", href: "/gestor/configuracion" },
]

export default function GestorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleShell navItems={navItems} roleLabel="Gestor" roleColor={GESTOR_COLOR}>
      {children}
    </RoleShell>
  )
}
