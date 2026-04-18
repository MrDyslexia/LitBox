"use client"

import { LayoutDashboard, FileText, PlusCircle, Settings, BarChart3 } from "lucide-react"
import RoleShell from "@/components/role-shell"

const navItems = [
  { icon: <LayoutDashboard className="w-4 h-4" />, label: "Inicio", href: "/empleado" },
  { icon: <FileText className="w-4 h-4" />, label: "Mis boletas", href: "/empleado/boletas" },
  { icon: <BarChart3 className="w-4 h-4" />, label: "Estadísticas", href: "/empleado/estadisticas" },
  { icon: <PlusCircle className="w-4 h-4" />, label: "Nueva boleta", href: "/empleado/nueva" },
  { icon: <Settings className="w-4 h-4" />, label: "Mi perfil", href: "/empleado/configuracion" },
]

export default function EmpleadoLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleShell navItems={navItems} roleLabel="Empleado" roleColor="oklch(0.52 0.21 28)">
      {children}
    </RoleShell>
  )
}
