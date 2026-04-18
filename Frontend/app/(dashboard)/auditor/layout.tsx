"use client"

import { LayoutDashboard, ClipboardList, Settings, BarChart3 } from "lucide-react"
import RoleShell from "@/components/role-shell"

const navItems = [
  { icon: <LayoutDashboard className="w-4 h-4" />, label: "Resumen", href: "/auditor" },
  { icon: <ClipboardList className="w-4 h-4" />, label: "Revisar boletas", href: "/auditor/revision" },
  { icon: <BarChart3 className="w-4 h-4" />, label: "Estadísticas", href: "/auditor/estadisticas" },
  { icon: <Settings className="w-4 h-4" />, label: "Mi perfil", href: "/auditor/configuracion" },
]

export default function AuditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleShell
      navItems={navItems}
      roleLabel="Auditor"
      roleColor="oklch(0.60 0.14 65)"
    >
      {children}
    </RoleShell>
  )
}
